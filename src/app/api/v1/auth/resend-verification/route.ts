import type { NextRequest } from "next/server";
import { resendVerificationForUser } from "@/auth/service";
import { requireUser } from "@/auth/current-user";
import { consumeRateLimit } from "@/lib/rate-limit";
import { ok, runApi, tenantContextFrom } from "@/lib/http";
import { buildLinkBase } from "@/tenancy/context";

export async function POST(req: NextRequest) {
  return runApi(req, async ({ ip }) => {
    consumeRateLimit("resend:ip", ip, 10, 60 * 60 * 1000);
    const { user } = await requireUser(req);
    consumeRateLimit("resend:user", String(user._id), 3, 60 * 60 * 1000);
    await resendVerificationForUser(user._id, buildLinkBase(await tenantContextFrom(req)));
    return ok({ message: "If your email is not verified, a new verification link is on its way." }, 202);
  });
}
