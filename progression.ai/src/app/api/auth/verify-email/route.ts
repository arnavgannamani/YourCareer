import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    const user = await prisma.user.findFirst({
      where: {
        verification_token: token,
        verification_expires: { gt: new Date() },
      },
    });
    if (!user) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: new Date(),
        verification_token: null,
        verification_expires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}


