import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateOVR, generateRecommendations } from "@/lib/ovr/calculator";
import { getMarketProvider } from "@/lib/market/adapter";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Fetch user profile data
    const [education, experiences, skills, certifications, progressEvents, settings] =
      await Promise.all([
        prisma.education.findMany({ where: { userId } }),
        prisma.experience.findMany({ where: { userId }, orderBy: { startDate: "desc" } }),
        prisma.skillEndorsement.findMany({ where: { userId } }),
        prisma.certification.findMany({ where: { userId } }),
        prisma.progressEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
        prisma.userSettings.findUnique({ where: { userId } }),
      ]);
    
    // Fetch market signal
    let marketSignal;
    if (experiences.length > 0 && settings?.targetRole && settings?.targetIndustry) {
      const provider = getMarketProvider();
      const signal = await provider.fetchSignals(
        settings.targetRole,
        settings.targetIndustry,
        settings.geo || undefined
      );
      
      marketSignal = {
        demandIdx: signal.demandIdx,
        skillScarcity: signal.skillScarcity,
        compMomentum: signal.compMomentum,
      };
    }
    
    // Calculate OVR
    const result = calculateOVR({
      education,
      experiences,
      skills,
      certifications,
      progressEvents,
      marketSignal,
    });
    
    // Save rating snapshot
    await prisma.ratingSnapshot.create({
      data: {
        userId,
        overall: result.overall,
        confidence: result.confidence,
        breakdown: result.breakdown as any,
        explanations: result.explanations,
        modelVersion: result.modelVersion,
      },
    });
    
    // Generate recommendations
    const recommendations = generateRecommendations(
      {
        education,
        experiences,
        skills,
        certifications,
        progressEvents,
        marketSignal,
      },
      result.overall
    );
    
    return NextResponse.json({
      ...result,
      recommendations,
    });
  } catch (error: any) {
    console.error("Rating calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate rating" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get latest rating
    const latestRating = await prisma.ratingSnapshot.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    
    if (!latestRating) {
      return NextResponse.json({ error: "No rating found" }, { status: 404 });
    }
    
    return NextResponse.json(latestRating);
  } catch (error: any) {
    console.error("Get rating error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch rating" },
      { status: 500 }
    );
  }
}

