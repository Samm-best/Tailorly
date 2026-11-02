import type { NextRequest } from "next/server";
import { requireShopManager } from "@/auth/shop-access";
import { categoryInputSchema } from "@/catalogue/schemas";
import { createCategory, listCategories } from "@/catalogue/service";
import { ok, readJson, runApi } from "@/lib/http";

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { tenant } = await requireShopManager(req, "catalogue.manage");
    return ok({ categories: await listCategories(tenant.id) });
  });
}

export async function POST(req: NextRequest) {
  return runApi(req, async () => {
    const { tenant } = await requireShopManager(req, "catalogue.manage");
    const input = categoryInputSchema.parse(await readJson(req));
    return ok({ category: await createCategory(tenant.id, input) }, 201);
  });
}
