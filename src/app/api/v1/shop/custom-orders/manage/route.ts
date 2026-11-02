import type { NextRequest } from "next/server";
import { requireShopManager } from "@/auth/shop-access";
import { listShopCustomOrders } from "@/orders/service";
import { ok, runApi } from "@/lib/http";
export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { tenant } = await requireShopManager(req, "custom_orders.manage");
    return ok({ orders: await listShopCustomOrders(tenant.id) });
  });
}
