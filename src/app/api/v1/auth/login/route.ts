import type { NextRequest } from "next/server";
import { setSessionCookie } from "@/auth/cookies";
import { normalizeEmail } from "@/auth/identity";
import { loginSchema } from "@/auth/schemas";
import { loginUser } from "@/auth/service";
import { consumeRateLimit } from "@/lib/rate-limit";
import { ok, readJson, runApi, tenantContextFrom, tenantRefOf } from "@/lib/http";

export async function POST(req: NextRequest) {
  return runApi(req, async ({ ip }) => {
    const input = loginSchema.parse(await readJson(req));
    consumeRateLimit("login:ip", ip, 30, 15 * 60 * 1000);
    consumeRateLimit("login:email", normalizeEmail(input.email), 8, 15 * 60 * 1000);
    const ctx = await tenantContextFrom(req);
    const session = await loginUser({
      ...input,
      tenant: tenantRefOf(ctx),
      userAgent: req.headers.get("user-agent") ?? undefined,
      ip,
    });
    const res = ok({ userId: session.userId, emailVerified: session.emailVerified });
    setSessionCookie(res, session.token, session.expiresAt);
    return res;
  });
}
