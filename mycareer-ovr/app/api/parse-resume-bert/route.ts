import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { getCompanyTier } from "@/lib/tiers/company";
import { getSchoolTier } from "@/lib/tiers/school";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:5001";
const UPLOAD_DIR = join(process.cwd(), "uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  if (fileName.toLowerCase().endsWith(".pdf")) {
    const data = await pdf(buffer);
    return data.text;
  } else if (fileName.toLowerCase().endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    throw new Error("Unsupported file format. Please upload PDF or DOCX.");
  }
}

async function callBertService(text: string, confidenceThreshold: number = 0.2) {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        confidence_threshold: confidenceThreshold,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "BERT service error");
    }

    return await response.json();
  } catch (error: any) {
    console.error("BERT service call failed:", error);
    throw new Error(
      "Resume parsing service unavailable. Please ensure Python service is running on port 5001."
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file to uploads directory
    await ensureUploadDir();
    const timestamp = Date.now();
    const safeFileName = `${session.user.id}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = join(UPLOAD_DIR, safeFileName);
    await writeFile(filePath, buffer);

    // Extract text from file
    const text = await extractText(buffer, file.name);

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract sufficient text from file" },
        { status: 400 }
      );
    }

    // Call BERT service for entity extraction
    console.log(`🤖 Calling BERT service with ${text.length} characters of text`);
    const bertResult = await callBertService(text);

    const { entities, structured } = bertResult;
    console.log(`📊 BERT extracted: ${entities?.length || 0} entities`);
    console.log(`📚 Education: ${structured?.education?.length || 0} entries`);
    console.log(`💼 Experience: ${structured?.experiences?.length || 0} entries`);
    console.log(`🛠️ Skills: ${structured?.skills?.length || 0} items`);

    // Enhance with tier information
    const enhancedEducation = (structured.education || []).map((edu: any) => ({
      school: edu.school || "",
      degree: edu.degree || "",
      major: edu.major,
      gpa: edu.gpa,
      schoolTier: edu.school ? getSchoolTier(edu.school) : null,
      startDate: edu.startDate || null,
      endDate: edu.endDate || null,
    }));

    const enhancedExperiences = (structured.experiences || []).map((exp: any) => ({
      title: exp.title || "",
      company: exp.company || "",
      employmentType: exp.employmentType || "fulltime",
      companyTier: exp.company ? getCompanyTier(exp.company) : null,
      bullets: exp.bullets || [],
      startDate: exp.startDate || new Date().toISOString(), // Default to now if missing
      endDate: exp.endDate || null, // Current role if no end date
    }));

    // Save resume version to database
    await prisma.resumeVersion.create({
      data: {
        userId: session.user.id,
        url: `/uploads/${safeFileName}`,
        fileName: file.name,
        parsedAt: new Date(),
        parser: "bert",
        json: {
          rawText: text,
          entities,
          structured,
        },
      },
    });

    return NextResponse.json({
      parsed: {
        education: enhancedEducation,
        experiences: enhancedExperiences,
        skills: structured.skills || [],
        certifications: structured.certifications || [],
        contact: structured.contact || {},
        rawText: text,
      },
      entities,
      parser: "bert",
      fileUrl: `/uploads/${safeFileName}`,
    });
  } catch (error: any) {
    console.error("Resume parse error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse resume" },
      { status: 500 }
    );
  }
}

