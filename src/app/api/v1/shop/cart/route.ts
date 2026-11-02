import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { AppError } from "@/lib/errors";
import { cartInputSchema } from "@/orders/schemas";
import { Types } from "mongoose";
import { getCart, saveCart } from "@/orders/service";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";
export async function GET(req: NextRequest) { return runApi(req, async () => { const ctx = await tenantContextFrom(req); if (ctx.kind !== "tenant") return ok({ items: [] }); const { user } = await requireUser(req); return ok(await getCart(ctx.tenant.id, user._id)); }); }
export async function PUT(req: NextRequest) { return runApi(req, async () => { const ctx = await tenantContextFrom(req); if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address."); const { user } = await requireUser(req); const input = cartInputSchema.parse(await readJson(req)); const items = input.items.map((item) => ({ ...item, productId: new Types.ObjectId(item.productId), variantId: new Types.ObjectId(item.variantId) })); return ok(await saveCart(ctx.tenant.id, user._id, items)); }); }
