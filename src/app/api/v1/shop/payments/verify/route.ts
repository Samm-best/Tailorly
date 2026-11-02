import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { AppError } from "@/lib/errors";
import { z } from "zod";
import { verifyPayment } from "@/orders/service";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";
export async function POST(req: NextRequest) { return runApi(req, async () => { const ctx = await tenantContextFrom(req); if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address."); const { user } = await requireUser(req); const { reference } = z.object({ reference: z.string().trim().min(8).max(100) }).strict().parse(await readJson(req)); return ok(await verifyPayment(ctx.tenant.id, user._id, reference)); }); }
