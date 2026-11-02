import type { NextRequest } from "next/server";
import { registerSchema } from "@/auth/schemas";
import { registerUser } from "@/auth/service";
import { consumeRateLimit } from "@/lib/rate-limit";
import { ok, readJson, runApi, tenantContextFrom, tenantRefOf } from "@/lib/http";
import { buildLinkBase } from "@/tenancy/context";

export async function POST(req: NextRequest) {
  return runApi(req, async ({ ip }) => {
    consumeRateLimit("register:ip", ip, 10, 60 * 60 * 1000);
    const input = registerSchema.parse(await readJson(req));
    const ctx = await tenantContextFrom(req);
    await registerUser({ email: input.email, password: input.password, fullName: input.fullName, phone: input.phone, tenant: tenantRefOf(ctx), linkBase: buildLinkBase(ctx) });
    // Same response whether or not the email already had an account.
    return ok({ message: "If this email can be registered, the next step has been sent or is ready. Check your inbox, then sign in." }, 202);
  });
}
