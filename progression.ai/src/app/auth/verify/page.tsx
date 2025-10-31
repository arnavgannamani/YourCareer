"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export default function VerifyPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const sent = params.get("sent");
  const emailFromQuery = params.get("email");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">(token ? "loading" : "idle");
  const [message, setMessage] = useState<string>("");
  const [resendEmail, setResendEmail] = useState(emailFromQuery || "");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Verification failed");
        if (!cancelled) {
          setStatus("success");
          setMessage("Email verified! Redirecting...");
          setTimeout(() => router.push("/auth/signin"), 1500);
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus("error");
          setMessage(e.message || "Invalid or expired token");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  async function handleResend() {
    if (!resendEmail) return;
    setResending(true);
    setResendSuccess(false);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendSuccess(true);
        setMessage(data.message || "Verification email sent!");
      } else {
        setMessage(data.error || "Failed to resend email");
      }
    } catch (e: any) {
      setMessage("Failed to resend email");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-2">
          <Image 
            src="/circular logo.png" 
            alt="Progression" 
            width={40} 
            height={40}
            className="rounded-full"
          />
          <span className="text-2xl font-semibold text-[#007A33]">Progression</span>
        </div>
        
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sent && !token && (
            <div className="space-y-3">
              <p>We sent you a verification email. Please check your inbox (and spam folder).</p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Didn't receive the email?</p>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <Button onClick={handleResend} disabled={resending || !resendEmail} className="w-full">
                  {resending ? "Sending..." : "Resend verification email"}
                </Button>
                {resendSuccess && <p className="text-sm text-green-600">Verification email sent!</p>}
              </div>
            </div>
          )}
          {token && status === "loading" && <p>Verifying your email...</p>}
          {status === "success" && <p className="text-green-600">{message}</p>}
          {status === "error" && (
            <div className="space-y-2">
              <p className="text-red-600">{message}</p>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email to resend"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <Button onClick={handleResend} disabled={resending || !resendEmail} className="w-full">
                  {resending ? "Sending..." : "Resend verification email"}
                </Button>
              </div>
              <Button variant="outline" onClick={() => router.push("/auth/signup")} className="w-full">Back to Sign Up</Button>
            </div>
          )}
          {!token && !sent && (
            <div className="space-y-2">
              <p>Open your verification link from email, or sign up to get a new one.</p>
              <Button onClick={() => router.push("/auth/signup")}>Go to Sign Up</Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}


