import type { NextRequest } from "next/server";
import { requireShopManager } from "@/auth/shop-access";
import { manageListQuerySchema, productInputSchema } from "@/catalogue/schemas";
import { createProduct, listManageProducts } from "@/catalogue/service";
import { ok, readJson, runApi } from "@/lib/http";

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { tenant } = await requireShopManager(req, "catalogue.manage");
    const query = manageListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    return ok(await listManageProducts(tenant.id, query));
  });
}

export async function POST(req: NextRequest) {
  return runApi(req, async () => {
    const { tenant, user } = await requireShopManager(req, "catalogue.manage");
    const input = productInputSchema.parse(await readJson(req));
    return ok({ product: await createProduct(tenant.id, user._id, input) }, 201);
  });
}
