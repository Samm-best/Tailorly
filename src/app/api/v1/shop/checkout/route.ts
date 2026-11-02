import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { AppError } from "@/lib/errors";
import { checkoutSchema } from "@/orders/schemas";
import { initializeCheckout } from "@/orders/service";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";
export async function POST(req: NextRequest) { return runApi(req, async () => { const ctx = await tenantContextFrom(req); if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address."); const { user } = await requireUser(req); const input = checkoutSchema.parse(await readJson(req)); return ok(await initializeCheckout(ctx.tenant.id, user._id, input.idempotencyKey, user.email)); }); }
