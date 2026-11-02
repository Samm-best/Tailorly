import type { NextRequest } from "next/server";
import { requireShopManager } from "@/auth/shop-access";
import { categoryUpdateSchema } from "@/catalogue/schemas";
import { deleteCategory, updateCategory } from "@/catalogue/service";
import { objectId } from "@/customers/schemas";
import { ok, readJson, runApi } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return runApi(req, async () => {
    const { tenant } = await requireShopManager(req, "catalogue.manage");
    const id = objectId.parse((await params).id);
    return ok({ category: await updateCategory(tenant.id, id, categoryUpdateSchema.parse(await readJson(req))) });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return runApi(req, async () => {
    const { tenant } = await requireShopManager(req, "catalogue.manage");
    await deleteCategory(tenant.id, objectId.parse((await params).id));
    return ok({ deleted: true });
  });
}
