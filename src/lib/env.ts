import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_URL: z.url().default("http://localhost:3000"),
    ROOT_DOMAIN: z.string().min(1).default("localhost"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
    BREVO_API_KEY: z.string().optional(),
    BREVO_SENDER_EMAIL: z.email().optional(),
    BREVO_SENDER_NAME: z.string().default("Tailorly"),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    PAYSTACK_SECRET_KEY: z.string().optional(),
    PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
    AUTO_VERIFY_EMAIL_IN_DEV: z.enum(["true", "false"]).default("false"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
      ctx.addIssue({ code: "custom", path: ["BREVO_API_KEY"], message: "Brevo is required in production" });
    }
    if (env.AUTO_VERIFY_EMAIL_IN_DEV === "true") {
      ctx.addIssue({ code: "custom", path: ["AUTO_VERIFY_EMAIL_IN_DEV"], message: "Must be false in production" });
    }
  });

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Parsed lazily so `next build` does not need runtime secrets. Throws a readable error. */
export function getEnv(): Env {
  if (cached) return cached;
  // Treat empty strings (e.g. `BREVO_API_KEY=`) as unset.
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== "" && v !== undefined));
  const result = schema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join(".") || "env"}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${problems}`);
  }
  cached = result.data;
  return cached;
}
