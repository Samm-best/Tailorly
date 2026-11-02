import type { NextRequest } from "next/server";
import { clearSessionCookie } from "@/auth/cookies";
import { requireUser } from "@/auth/current-user";
import { deleteAccountSchema } from "@/customers/schemas";
import { deleteAccount, exportAccountData, privacySummary } from "@/customers/service";
import { ok, readJson, runApi } from "@/lib/http";
import { consumeRateLimit } from "@/lib/rate-limit";

/** GET -> data summary; GET ?format=export -> everything we hold about the user as JSON. */
export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    if (req.nextUrl.searchParams.get("format") === "export") return ok(await exportAccountData(user._id));
    return ok(await privacySummary(user._id));
  });
}

export async function DELETE(req: NextRequest) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    consumeRateLimit("delete-account", String(user._id), 5, 60 * 60 * 1000);
    const { password } = deleteAccountSchema.parse(await readJson(req));
    await deleteAccount(user._id, password);
    const res = ok({ deleted: true });
    clearSessionCookie(res);
    return res;
  });
}
