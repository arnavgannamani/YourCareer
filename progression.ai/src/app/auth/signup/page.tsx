"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { SignupInput, signupSchema, calculatePasswordStrength } from "../../../lib/validations/auth";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [strength, setStrength] = useState<"weak" | "medium" | "strong">("weak");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const password = watch("password") ?? "";

  const onSubmit = async (values: SignupInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json();
        // Handle structured error messages
        const errorMsg = typeof data?.error === "string" ? data.error : "Failed to sign up";
        throw new Error(errorMsg);
      }
      router.push("/auth/verify?sent=1");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const computed = calculatePasswordStrength(password);
  const progress = computed === "strong" ? 100 : computed === "medium" ? 66 : 33;

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
          <CardTitle>Your Career, Quantified.</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                onChange={(e) => {
                  setStrength(calculatePasswordStrength(e.target.value));
                }}
              />
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground capitalize">{computed} password</p>
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Creating account..." : "Sign up"}
            </Button>
            <p className="text-xs text-muted-foreground">Already have an account? <a href="/auth/signin" className="underline">Sign in</a></p>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}


