import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { customOrderInputSchema } from "@/orders/schemas";
import { createCustomOrder, listCustomerOrders } from "@/orders/service";
import { AppError } from "@/lib/errors";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";
export async function GET(req: NextRequest) { return runApi(req, async () => { const ctx = await tenantContextFrom(req); if (ctx.kind !== "tenant") return ok({ orders: [] }); const { user } = await requireUser(req); return ok({ orders: await listCustomerOrders(ctx.tenant.id, user._id) }); }); }
export async function POST(req: NextRequest) { return runApi(req, async () => { const ctx = await tenantContextFrom(req); if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address."); const { user } = await requireUser(req); return ok({ order: await createCustomOrder(ctx.tenant.id, user._id, customOrderInputSchema.parse(await readJson(req))) }, 201); }); }
