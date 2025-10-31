"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

export default function SignInPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") || null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);
    if (res?.error) {
      if (res.error === "EMAIL_NOT_VERIFIED") {
        setError("Please verify your email before signing in. Check your inbox for the verification link.");
      } else {
        setError("Invalid email or password");
      }
    } else {
      router.replace("/upload");
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
        
        <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="space-y-2">
                <p className="text-sm text-red-600">{error}</p>
                {error.includes("verify your email") && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/auth/verify?sent=1&email=${encodeURIComponent(email)}`)}
                  >
                    Resend verification email
                  </Button>
                )}
              </div>
            )}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="flex justify-between text-xs text-muted-foreground">
              <a className="underline" href="/auth/forgot">Forgot password?</a>
              <a className="underline" href="/auth/signup">Create account</a>
            </div>
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account? <a className="underline" href="/auth/signup">Sign up</a>
            </p>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}


