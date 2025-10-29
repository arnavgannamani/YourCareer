import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCompanyTier } from "@/lib/tiers/company";
import { getSchoolTier } from "@/lib/tiers/school";

/**
 * LinkedIn Profile Parser
 * 
 * Note: This is a placeholder implementation. In production, you should:
 * 1. Use LinkedIn's official API with OAuth
 * 2. Or use a third-party service like Proxycurl, RapidAPI's LinkedIn scrapers
 * 3. Or implement proper web scraping with puppeteer/playwright
 * 
 * For now, this accepts a LinkedIn URL and provides a mock/manual entry flow.
 */

interface LinkedInProfile {
  name: string;
  headline?: string;
  location?: string;
  summary?: string;
  experiences: Array<{
    title: string;
    company: string;
    employmentType: string;
    location?: string;
    startMonth?: number;
    startYear: number;
    endMonth?: number;
    endYear?: number;
    isCurrent?: boolean;
    description?: string;
  }>;
  education: Array<{
    school: string;
    degree?: string;
    field?: string;
    startYear?: number;
    endYear?: number;
    grade?: string;
  }>;
  skills: string[];
  certifications?: Array<{
    name: string;
    authority?: string;
    issuedMonth?: number;
    issuedYear?: number;
  }>;
}

async function parseLinkedInProfile(url: string): Promise<LinkedInProfile> {
  // TODO: Implement actual LinkedIn scraping or API call
  // For now, return a structured response indicating manual entry is needed
  
  // Validate URL
  if (!url.includes("linkedin.com/in/")) {
    throw new Error("Invalid LinkedIn profile URL. Must be in format: linkedin.com/in/username");
  }
  
  // Extract username
  const match = url.match(/linkedin\.com\/in\/([^/?]+)/);
  const username = match ? match[1] : "";
  
  // In a real implementation, you would:
  // 1. Use LinkedIn API (requires OAuth)
  // 2. Use a proxy service like Proxycurl
  // 3. Use web scraping (puppeteer/playwright)
  
  // For now, throw an error indicating this needs implementation
  throw new Error(
    `LinkedIn parsing not yet implemented. Please use resume upload or enter information manually. Profile: ${username}`
  );
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "LinkedIn profile URL is required" },
        { status: 400 }
      );
    }

    // Validate LinkedIn URL format
    if (!url.includes("linkedin.com/in/")) {
      return NextResponse.json(
        { error: "Invalid LinkedIn URL. Must be in format: linkedin.com/in/username" },
        { status: 400 }
      );
    }

    // Attempt to parse profile
    const profile = await parseLinkedInProfile(url);

    // Enhance with tier information
    const enhancedEducation = profile.education.map((edu) => ({
      ...edu,
      schoolTier: getSchoolTier(edu.school),
    }));

    const enhancedExperiences = profile.experiences.map((exp) => ({
      ...exp,
      companyTier: getCompanyTier(exp.company),
    }));

    return NextResponse.json({
      parsed: {
        education: enhancedEducation,
        experiences: enhancedExperiences,
        skills: profile.skills,
        certifications: profile.certifications || [],
        contact: {},
      },
      source: "linkedin",
      profile_url: url,
    });
  } catch (error: any) {
    console.error("LinkedIn parse error:", error);
    
    // Return a user-friendly error for not implemented
    if (error.message.includes("not yet implemented")) {
      return NextResponse.json(
        {
          error: "LinkedIn parsing not available",
          message: "LinkedIn profile parsing requires additional setup. Please upload your resume or enter information manually.",
          needsManualEntry: true,
        },
        { status: 501 } // Not Implemented
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to parse LinkedIn profile" },
      { status: 500 }
    );
  }
}

// Helper endpoint to check if LinkedIn parsing is available
export async function GET(req: NextRequest) {
  return NextResponse.json({
    available: false,
    message: "LinkedIn parsing requires API setup or third-party service integration",
    alternatives: [
      "Upload your resume (PDF/DOCX)",
      "Enter information manually",
      "Use the demo profiles",
    ],
    setup_instructions: {
      option1: "Use LinkedIn API with OAuth (official)",
      option2: "Use Proxycurl API (paid service, reliable)",
      option3: "Implement web scraping with Puppeteer (may violate ToS)",
    },
  });
}

