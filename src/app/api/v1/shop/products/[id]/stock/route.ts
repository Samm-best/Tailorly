import type { NextRequest } from "next/server";
import { requireShopManager } from "@/auth/shop-access";
import { stockAdjustSchema } from "@/catalogue/schemas";
import { adjustStock } from "@/catalogue/service";
import { objectId } from "@/customers/schemas";
import { ok, readJson, runApi } from "@/lib/http";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return runApi(req, async () => {
    const { tenant, user } = await requireShopManager(req, "catalogue.manage");
    const id = objectId.parse((await params).id);
    const input = stockAdjustSchema.parse(await readJson(req));
    return ok({ product: await adjustStock(tenant.id, user._id, id, input) });
  });
}
