import type { NextRequest } from "next/server";
import { requireTenantOperations, DELIVERY_ROLES } from "@/auth/operations-access";
import { deliveryUpdateSchema } from "@/operations/schemas";
import { updateDelivery } from "@/operations/service";
import { ok, readJson, runApi } from "@/lib/http";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return runApi(req, async () => { const { tenant, user } = await requireTenantOperations(req, DELIVERY_ROLES); return ok({ delivery: await updateDelivery(tenant.id, (await params).id, user._id, deliveryUpdateSchema.parse(await readJson(req))) }); });
}
