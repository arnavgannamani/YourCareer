import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { sendVerificationEmail } from "../../../../lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return NextResponse.json({ success: true, message: "If the email exists, a verification link has been sent." });
    }

    if (user.email_verified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 });
    }

    // Generate new token
    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verification_token,
        verification_expires,
      },
    });

    const sendResult = await sendVerificationEmail(user.email, verification_token);

    if (process.env.NODE_ENV !== "production") {
      console.log("[DEV] New verification URL:", sendResult.url);
      
      // In development, if email send fails, auto-verify the user
      if (!sendResult.success) {
        console.log("[DEV] Email send failed, auto-verifying user for development");
        await prisma.user.update({
          where: { id: user.id },
          data: { email_verified: new Date() },
        });
        return NextResponse.json({ 
          success: true, 
          message: "Email auto-verified for development (email service unavailable)" 
        });
      }
    }

    return NextResponse.json({ success: true, message: "Verification email sent" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Something went wrong" }, { status: 500 });
  }
}

