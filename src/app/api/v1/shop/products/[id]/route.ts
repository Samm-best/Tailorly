import type { NextRequest } from "next/server";
import { requireShopManager } from "@/auth/shop-access";
import { productUpdateSchema } from "@/catalogue/schemas";
import { archiveProduct, getManageProduct, updateProduct } from "@/catalogue/service";
import { objectId } from "@/customers/schemas";
import { ok, readJson, runApi } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return runApi(req, async () => {
    const { tenant } = await requireShopManager(req, "catalogue.manage");
    return ok(await getManageProduct(tenant.id, objectId.parse((await params).id)));
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return runApi(req, async () => {
    const { tenant } = await requireShopManager(req, "catalogue.manage");
    const id = objectId.parse((await params).id);
    return ok({ product: await updateProduct(tenant.id, id, productUpdateSchema.parse(await readJson(req))) });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return runApi(req, async () => {
    const { tenant } = await requireShopManager(req, "catalogue.manage");
    return ok({ product: await archiveProduct(tenant.id, objectId.parse((await params).id)) });
  });
}
