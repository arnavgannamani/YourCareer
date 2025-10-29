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
    
    const ratings = await prisma.ratingSnapshot.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        overall: true,
        confidence: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json({ ratings });
  } catch (error: any) {
    console.error("Get ratings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch ratings" },
      { status: 500 }
    );
  }
}

