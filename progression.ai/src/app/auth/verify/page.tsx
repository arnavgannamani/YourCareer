"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

export default function VerifyPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const sent = params.get("sent");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">(token ? "loading" : "idle");
  const [message, setMessage] = useState<string>("");

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

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sent && !token && <p>We sent you a verification email. Please check your inbox.</p>}
          {token && status === "loading" && <p>Verifying your email...</p>}
          {status === "success" && <p className="text-green-600">{message}</p>}
          {status === "error" && (
            <div className="space-y-2">
              <p className="text-red-600">{message}</p>
              <Button onClick={() => router.push("/auth/signup")}>Back to Sign Up</Button>
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
  );
}


