import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user's target role/industry from settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!settings?.targetRole || !settings?.targetIndustry) {
      return NextResponse.json({ signals: [] });
    }
    
    // Get latest market signal for user's targets
    const signal = await prisma.marketSignal.findFirst({
      where: {
        roleFamily: settings.targetRole,
        industry: settings.targetIndustry,
      },
      orderBy: { date: "desc" },
    });
    
    return NextResponse.json({ signal });
  } catch (error: any) {
    console.error("Get market signals error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch market signals" },
      { status: 500 }
    );
  }
}

