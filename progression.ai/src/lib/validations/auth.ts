import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .refine((v) => /[A-Z]/.test(v), "Must include an uppercase letter")
    .refine((v) => /[a-z]/.test(v), "Must include a lowercase letter")
    .refine((v) => /[0-9]/.test(v), "Must include a number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

export type SignupInput = z.infer<typeof signupSchema>;

export function calculatePasswordStrength(password: string): "weak" | "medium" | "strong" {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  if (score >= 4) return "strong";
  if (score >= 3) return "medium";
  return "weak";
}


