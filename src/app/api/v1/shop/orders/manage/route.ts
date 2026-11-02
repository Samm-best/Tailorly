import type { NextRequest } from "next/server";
import { requireShopManager } from "@/auth/shop-access";
import { listShopOrders } from "@/orders/service";
import { ok, runApi } from "@/lib/http";

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { tenant } = await requireShopManager(req, "orders.manage");
    return ok({ orders: await listShopOrders(tenant.id) });
  });
}
