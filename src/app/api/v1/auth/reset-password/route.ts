import type { NextRequest } from "next/server";
import { resetPasswordSchema } from "@/auth/schemas";
import { resetPassword } from "@/auth/service";
import { consumeRateLimit } from "@/lib/rate-limit";
import { ok, readJson, runApi } from "@/lib/http";

export async function POST(req: NextRequest) {
  return runApi(req, async ({ ip }) => {
    consumeRateLimit("reset:ip", ip, 10, 60 * 60 * 1000);
    const { token, password } = resetPasswordSchema.parse(await readJson(req));
    await resetPassword(token, password);
    return ok({ reset: true });
  });
}
