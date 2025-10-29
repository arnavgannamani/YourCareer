import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Emergency endpoint to reset onboarding status
 * Allows users to go through onboarding again if something went wrong
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Reset onboarding flags
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingComplete: false,
        profileComplete: false,
      },
    });
    
    console.log(`✅ Reset onboarding for user ${session.user.id}`);
    
    return NextResponse.json({ 
      success: true,
      message: "Onboarding reset. You can now go through the process again."
    });
  } catch (error: any) {
    console.error("Reset onboarding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset onboarding" },
      { status: 500 }
    );
  }
}

