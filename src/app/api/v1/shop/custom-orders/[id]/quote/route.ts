import type { NextRequest } from "next/server";
import { requireShopManager } from "@/auth/shop-access";
import { quoteInputSchema } from "@/orders/schemas";
import { quoteCustomOrder } from "@/orders/service";
import { ok, readJson, runApi } from "@/lib/http";
type Ctx = { params: Promise<{ id: string }> };
export async function POST(req: NextRequest, { params }: Ctx) {
  return runApi(req, async () => {
    const { tenant } = await requireShopManager(req, "custom_orders.manage");
    return ok({ order: await quoteCustomOrder(tenant.id, (await params).id, quoteInputSchema.parse(await readJson(req))) });
  });
}
