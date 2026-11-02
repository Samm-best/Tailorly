import type { NextRequest } from "next/server";
import { requireTenantOperations, DELIVERY_ROLES } from "@/auth/operations-access";
import { createDeliveryForOrder } from "@/operations/service";
import { ok, runApi } from "@/lib/http";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return runApi(req, async () => {
    const { tenant, user } = await requireTenantOperations(req, DELIVERY_ROLES);
    return ok({ delivery: await createDeliveryForOrder(tenant.id, (await params).id, user._id) }, 201);
  });
}
