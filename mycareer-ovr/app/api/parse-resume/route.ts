import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseResume, calculateImpactFromBullets } from "@/lib/parser/resume-parser";
import { getCompanyTier } from "@/lib/tiers/company";
import { getSchoolTier } from "@/lib/tiers/school";

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
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Parse resume
    const useLLM = formData.get("useLLM") === "true";
    const parsed = await parseResume(buffer, file.name, useLLM);
    
    // Enhance with tiers and scores
    const enhancedEducation = parsed.education.map((edu) => ({
      ...edu,
      schoolTier: getSchoolTier(edu.school),
    }));
    
    const enhancedExperiences = parsed.experiences.map((exp) => ({
      ...exp,
      companyTier: getCompanyTier(exp.company),
      impactScore: calculateImpactFromBullets(exp.bullets),
    }));
    
    return NextResponse.json({
      parsed: {
        education: enhancedEducation,
        experiences: enhancedExperiences,
        skills: parsed.skills,
        certifications: parsed.certifications,
        contact: parsed.contact,
      },
      parser: useLLM ? "llm" : "heuristic",
    });
  } catch (error: any) {
    console.error("Resume parse error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse resume" },
      { status: 500 }
    );
  }
}

