import type { NextRequest } from "next/server";
import { normalizeEmail } from "@/auth/identity";
import { emailOnlySchema } from "@/auth/schemas";
import { requestPasswordReset } from "@/auth/service";
import { consumeRateLimit } from "@/lib/rate-limit";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";
import { buildLinkBase } from "@/tenancy/context";

export async function POST(req: NextRequest) {
  return runApi(req, async ({ ip }) => {
    const { email } = emailOnlySchema.parse(await readJson(req));
    consumeRateLimit("forgot:ip", ip, 10, 60 * 60 * 1000);
    consumeRateLimit("forgot:email", normalizeEmail(email), 3, 60 * 60 * 1000);
    await requestPasswordReset(email, buildLinkBase(await tenantContextFrom(req)));
    return ok({ message: "If an account exists for that email, a reset link has been sent." }, 202);
  });
}
