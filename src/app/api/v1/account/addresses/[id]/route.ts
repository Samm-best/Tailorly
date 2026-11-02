import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { addressUpdateSchema, objectId } from "@/customers/schemas";
import { deleteAddress, updateAddress } from "@/customers/service";
import { ok, readJson, runApi } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    const id = objectId.parse((await params).id);
    const patch = addressUpdateSchema.parse(await readJson(req));
    const doc = await updateAddress(user._id, id, patch);
    return ok({ id: String(doc._id), isDefault: doc.isDefault });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    await deleteAddress(user._id, objectId.parse((await params).id));
    return ok({ deleted: true });
  });
}
