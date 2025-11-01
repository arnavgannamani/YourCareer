import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

// TODO: Replace with real OVR calculation
function calculateOVR(profile: any): number {
  // Mock calculation - replace with real logic later
  // For now, return a score between 65-85 based on profile data
  let score = 65;
  
  if (profile.years_of_experience) {
    score += Math.min(profile.years_of_experience * 2, 15);
  }
  
  const skills = profile.skills || [];
  score += Math.min(skills.length * 0.5, 5);
  
  return Math.min(Math.round(score), 85);
}

export async function GET(
  req: Request,
  { params }: { params: { profileId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await prisma.userProfile.findFirst({
      where: {
        id: params.profileId,
        user_id: (session.user as any).id,
        is_confirmed: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const ovr = calculateOVR(profile);
    const percentile = Math.max(100 - Math.floor(ovr * 1.2), 10); // Mock percentile

    return NextResponse.json({
      ovr,
      percentile,
      careerField: profile.career_field || "Your Field",
    });
  } catch (error: any) {
    console.error("Error fetching OVR:", error);
    return NextResponse.json({ error: "Failed to fetch OVR" }, { status: 500 });
  }
}
