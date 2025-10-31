import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { signupSchema } from "../../../../lib/validations/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "../../../../lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = signupSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password_hash,
        verification_token,
        verification_expires,
      },
    });

    const sendResult = await sendVerificationEmail(user.email, verification_token);

    if (process.env.NODE_ENV !== "production") {
      // Dev helper: log and return the verification URL so you can click it directly
      console.log("[DEV] Verification URL:", sendResult.url);
      
      // In development, if email send fails, auto-verify the user
      if (!sendResult.success) {
        console.log("[DEV] Email send failed, auto-verifying user for development");
        await prisma.user.update({
          where: { id: user.id },
          data: { email_verified: new Date() },
        });
        return NextResponse.json({ 
          success: true, 
          userId: user.id, 
          message: "Account created and auto-verified for development (email service unavailable)" 
        });
      }
      
      return NextResponse.json({ success: true, userId: user.id, dev: { token: verification_token, verificationUrl: sendResult.url } });
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      const errors = err.flatten().fieldErrors;
      const errorMessage = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(", ")}`)
        .join("; ");
      return NextResponse.json({ error: errorMessage }, { status: 422 });
    }
    return NextResponse.json({ error: err?.message || "Something went wrong" }, { status: 500 });
  }
}


