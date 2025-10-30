import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { uploadResume } from "../../../../lib/storage";
import { prisma } from "../../../../lib/prisma";
import { resumeQueue } from "../../../../lib/queue";

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

    // Enqueue parsing job
    await resumeQueue.add({
      resumeId: resume.id,
      userId: (session.user as any).id,
      filePath: path,
    });

    return NextResponse.json({ success: true, resumeId: resume.id, previewUrl: signedUrl });
  } catch (e: any) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}


