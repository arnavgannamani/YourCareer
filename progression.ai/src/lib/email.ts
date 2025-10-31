import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = `${appUrl}/auth/verify?token=${encodeURIComponent(token)}`;

  try {
    await resend.emails.send({
      // Use Resend onboarding sender in development to avoid domain verification issues
      from: process.env.NODE_ENV === "production" ? "Progression <no-reply@progression.ai>" : "onboarding@resend.dev",
      to: email,
      subject: "Verify your email",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6">
          <h2>Welcome to Your Career, Quantified</h2>
          <p>Click the button below to verify your email. This link expires in 24 hours.</p>
          <p>
            <a href="${url}" style="background:#007A33;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Verify Email</a>
          </p>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${url}</p>
        </div>
      `,
    });
    return { success: true, url } as const;
  } catch (e) {
    console.error("sendVerificationEmail error", e);
    return { success: false, url } as const;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = `${appUrl}/auth/reset?token=${encodeURIComponent(token)}`;
  try {
    await resend.emails.send({
      from: process.env.NODE_ENV === "production" ? "Progression <no-reply@progression.ai>" : "onboarding@resend.dev",
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6">
          <h2>Password reset</h2>
          <p>Click below to set a new password. This link expires in 1 hour.</p>
          <p><a href="${url}" style="background:#007A33;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Reset Password</a></p>
          <p>If the button doesn't work, copy and paste this URL:<br/>${url}</p>
        </div>
      `,
    });
    return { success: true, url } as const;
  } catch (e) {
    console.error("sendPasswordResetEmail error", e);
    return { success: false, url } as const;
  }
}


