import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ hasProfile: false }, { status: 401 });
  }

  try {
    // Check if user has a confirmed profile
    const profile = await prisma.userProfile.findFirst({
      where: {
        user_id: (session.user as any).id,
        is_confirmed: true,
      },
      orderBy: {
        confirmed_at: "desc",
      },
    });

    return NextResponse.json({ hasProfile: !!profile });
  } catch (error: any) {
    console.error("Error checking profile:", error);
    return NextResponse.json({ hasProfile: false }, { status: 500 });
  }
}

