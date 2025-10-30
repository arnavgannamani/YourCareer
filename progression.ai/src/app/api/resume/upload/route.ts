export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { uploadResume, getResumeSignedUrl } from "../../../../lib/storage";
import { prisma } from "../../../../lib/prisma";
import { resumeQueue } from "../../../../lib/queue";
import axios from "axios";
import { processResumeFile } from "../../../../lib/resume-parser";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });

  if (!ALLOWED.includes((file as any).type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  try {
    const { path, signedUrl } = await uploadResume(file, (session.user as any).id, (file as any).name || "resume" );

    const resume = await prisma.resume.create({
      data: {
        user_id: (session.user as any).id,
        file_name: (file as any).name || "resume",
        file_url: path,
        file_size: file.size,
        mime_type: (file as any).type || "application/octet-stream",
        parsing_status: "pending",
      },
    });

    // Immediately mark as processing to reflect progress on UI
    await prisma.resume.update({ where: { id: resume.id }, data: { parsing_status: "processing" } });

    // Enqueue parsing job (non-blocking). If REDIS_URL not set, skip.
    if (process.env.REDIS_URL) {
      resumeQueue
        .add({
          resumeId: resume.id,
          userId: (session.user as any).id,
          filePath: path,
        })
        .catch(async (e) => {
          console.error("enqueue error", e);
          await prisma.resume.update({ where: { id: resume.id }, data: { parsing_status: "failed", parsing_error: "Queue error: " + (e?.message || "unknown") } });
        });
    } else {
      // Dev fallback: process synchronously without Redis/worker
      try {
        if (!process.env.GROQ_API_KEY) {
          throw new Error("GROQ_API_KEY not set");
        }
        const url = await getResumeSignedUrl(path);
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const buffer = Buffer.from(res.data);
        const parsed = await processResumeFile(buffer, (file as any).type || "application/pdf");
        await prisma.resume.update({
          where: { id: resume.id },
          data: { parsing_status: "completed", parsed_data: parsed, parsed_at: new Date() },
        });
        await prisma.profileDraft.create({
          data: {
            user_id: (session.user as any).id,
            resume_id: resume.id,
            draft_data: parsed,
            sections_reviewed: {},
            last_auto_saved: new Date(),
          },
        });
      } catch (e: any) {
        await prisma.resume.update({ where: { id: resume.id }, data: { parsing_status: "failed", parsing_error: e?.message || "parse error" } });
      }
    }

    return NextResponse.json({ success: true, resumeId: resume.id, previewUrl: signedUrl });
  } catch (e: any) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}


