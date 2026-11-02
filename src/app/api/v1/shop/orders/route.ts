import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { AppError } from "@/lib/errors";
import { listOrders } from "@/orders/service";
import { ok, runApi, tenantContextFrom } from "@/lib/http";

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const ctx = await tenantContextFrom(req);
    if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address.");
    const { user } = await requireUser(req);
    return ok({ orders: await listOrders(ctx.tenant.id, user._id) });
  });
}
