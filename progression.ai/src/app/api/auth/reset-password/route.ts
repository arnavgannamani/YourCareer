import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body?.token || "").toString();
    const password = (body?.password || "").toString();
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
    if (!password || password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 422 });

    const user = await prisma.user.findFirst({ where: { reset_token: token, reset_expires: { gt: new Date() } } });
    if (!user) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });

    const password_hash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash, reset_token: null, reset_expires: null },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}


