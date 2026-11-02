import type { NextRequest } from "next/server";
import { tokenSchema } from "@/auth/schemas";
import { verifyEmail } from "@/auth/service";
import { consumeRateLimit } from "@/lib/rate-limit";
import { ok, readJson, runApi } from "@/lib/http";

export async function POST(req: NextRequest) {
  return runApi(req, async ({ ip }) => {
    consumeRateLimit("verify:ip", ip, 20, 60 * 60 * 1000);
    const { token } = tokenSchema.parse(await readJson(req));
    await verifyEmail(token);
    return ok({ verified: true });
  });
}
