import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../../../lib/email";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({ email: "" }));
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Respond success regardless to avoid user enumeration
  if (!user) return NextResponse.json({ success: true });

  const reset_token = crypto.randomBytes(32).toString("hex");
  const reset_expires = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.user.update({ where: { id: user.id }, data: { reset_token, reset_expires } });
  await sendPasswordResetEmail(user.email, reset_token);
  return NextResponse.json({ success: true });
}


