import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { changeEmailSchema } from "@/auth/schemas";
import { changeEmail } from "@/auth/service";
import { consumeRateLimit } from "@/lib/rate-limit";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";
import { buildLinkBase } from "@/tenancy/context";

export async function POST(req: NextRequest) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    consumeRateLimit("change-email:user", String(user._id), 3, 60 * 60 * 1000);
    const input = changeEmailSchema.parse(await readJson(req));
    const email = await changeEmail(user._id, input.email, input.password, buildLinkBase(await tenantContextFrom(req)));
    return ok({ email, message: "Email address updated. Check your new inbox to verify it." });
  });
}
