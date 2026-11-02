import { z } from "zod";
import { isValidEmail, isValidPhone, validatePassword } from "@/auth/identity";

const email = z.string().trim().max(254).refine(isValidEmail, "Enter a valid email address");
const phone = z.string().trim().refine(isValidPhone, "Enter a valid phone number");

export const registerSchema = z
  .object({
    email,
    password: z.string().max(128),
    confirmPassword: z.string().max(128),
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    phone,
    termsAccepted: z.literal(true, { error: "Accept the Terms and Privacy Policy to continue." }),
  })
  .superRefine((v, ctx) => {
    const check = validatePassword(v.password, v.email);
    if (!check.ok) for (const message of check.issues) ctx.addIssue({ code: "custom", path: ["password"], message });
    if (v.password !== v.confirmPassword) ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
  });

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
export const emailOnlySchema = z.object({ email });
export const tokenSchema = z.object({ token: z.string().min(20).max(200) });
export const changeEmailSchema = z.object({ email, password: z.string().min(1).max(128) });

export const resetPasswordSchema = z
  .object({ token: z.string().min(20).max(200), password: z.string().max(128) })
  .superRefine((v, ctx) => {
    const check = validatePassword(v.password);
    if (!check.ok) for (const message of check.issues) ctx.addIssue({ code: "custom", path: ["password"], message });
  });
