import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateOVR } from "@/lib/ovr/calculator";
import { getMarketProvider } from "@/lib/market/adapter";
import { z } from "zod";

const confirmProfileSchema = z.object({
  resumeUrl: z.string().optional(),
  fileName: z.string().optional(),
  parser: z.enum(["heuristic", "llm", "bert"]).optional(),
  education: z.array(
    z.object({
      school: z.string(),
      schoolTier: z.number().nullable().optional(),
      degree: z.string(),
      major: z.string().optional(),
      gpa: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ).optional(),
  experiences: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      companyTier: z.number().nullable().optional(),
      industry: z.string().optional(),
      employmentType: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      bullets: z.array(z.string()).optional(),
      impactScore: z.number().optional(),
      geo: z.string().optional(),
    })
  ).optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(
    z.object({
      name: z.string(),
      authority: z.string().optional(),
      issuedOn: z.string().optional(),
    })
  ).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    console.log("📥 Received profile data:", JSON.stringify(body, null, 2));
    const data = confirmProfileSchema.parse(body);
    
    // Save to database in a transaction
    await prisma.$transaction(async (tx) => {
      // Save resume version if provided
      if (data.resumeUrl && data.fileName && data.parser) {
        await tx.resumeVersion.create({
          data: {
            userId: session.user.id,
            url: data.resumeUrl,
            fileName: data.fileName,
            parser: data.parser,
            parsedAt: new Date(),
            json: data,
          },
        });
      }
      
      // Save education
      if (data.education && data.education.length > 0) {
        console.log(`💾 Saving ${data.education.length} education entries`);
        for (const edu of data.education) {
          await tx.education.create({
            data: {
              userId: session.user.id,
              school: edu.school,
              schoolTier: edu.schoolTier,
              degree: edu.degree,
              major: edu.major,
              gpa: edu.gpa,
              startDate: edu.startDate ? new Date(edu.startDate) : undefined,
              endDate: edu.endDate ? new Date(edu.endDate) : undefined,
            },
          });
        }
      } else {
        console.log("⚠️ No education data to save");
      }
      
      // Save experiences
      if (data.experiences && data.experiences.length > 0) {
        console.log(`💼 Saving ${data.experiences.length} experience entries`);
        for (const exp of data.experiences) {
          await tx.experience.create({
            data: {
              userId: session.user.id,
              title: exp.title,
              company: exp.company,
              companyTier: exp.companyTier,
              industry: exp.industry,
              employmentType: exp.employmentType,
              startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
              endDate: exp.endDate ? new Date(exp.endDate) : undefined,
              bullets: exp.bullets || [],
              impactScore: exp.impactScore,
              geo: exp.geo,
            },
          });
        }
      } else {
        console.log("⚠️ No experience data to save");
      }
      
      // Save skills
      if (data.skills && data.skills.length > 0) {
        console.log(`🛠️ Saving ${data.skills.length} skills`);
        for (const skill of data.skills) {
          await tx.skillEndorsement.create({
            data: {
              userId: session.user.id,
              skill,
              level: 3, // Default to intermediate
              verified: false,
            },
          });
        }
      } else {
        console.log("⚠️ No skills data to save");
      }
      
      // Save certifications
      if (data.certifications) {
        for (const cert of data.certifications) {
          await tx.certification.create({
            data: {
              userId: session.user.id,
              name: cert.name,
              authority: cert.authority,
              issuedOn: cert.issuedOn ? new Date(cert.issuedOn) : undefined,
            },
          });
        }
      }
      
      // Mark user as onboarded and profile complete
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          onboardingComplete: true,
          profileComplete: true,
        },
      });
      
      // Create user settings if not exists
      await tx.userSettings.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          allowLLM: data.parser === "llm" || data.parser === "bert",
        },
        update: {},
      });
    });
    
    // AUTO-RATE: Generate initial rating immediately after profile confirmation
    try {
      const [education, experiences, skills, certifications, progressEvents, settings] =
        await Promise.all([
          prisma.education.findMany({ where: { userId: session.user.id } }),
          prisma.experience.findMany({ where: { userId: session.user.id }, orderBy: { startDate: "desc" } }),
          prisma.skillEndorsement.findMany({ where: { userId: session.user.id } }),
          prisma.certification.findMany({ where: { userId: session.user.id } }),
          prisma.progressEvent.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
          prisma.userSettings.findUnique({ where: { userId: session.user.id } }),
        ]);
      
      // Fetch market signal if available
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
      const ratingSnapshot = await prisma.ratingSnapshot.create({
        data: {
          userId: session.user.id,
          overall: result.overall,
          confidence: result.confidence,
          breakdown: result.breakdown as any,
          explanations: result.explanations,
          modelVersion: result.modelVersion,
        },
      });
      
      console.log(`✅ Auto-generated rating for user ${session.user.id}: OVR ${result.overall}`);
      
      return NextResponse.json({ 
        success: true, 
        rating: {
          overall: result.overall,
          confidence: result.confidence,
          snapshotId: ratingSnapshot.id,
        }
      });
    } catch (ratingError: any) {
      console.error("Auto-rating failed, but profile was saved:", ratingError);
      // Don't fail the whole request if rating fails
      return NextResponse.json({ 
        success: true,
        warning: "Profile saved but rating generation failed. Please refresh your rating from the dashboard."
      });
    }
  } catch (error: any) {
    console.error("Profile confirmation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save profile" },
      { status: 500 }
    );
  }
}

