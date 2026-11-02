import type { NextRequest } from "next/server";
import { PRODUCTION_ROLES, requireTenantOperations } from "@/auth/operations-access";
import { createProductionForCustomOrder } from "@/operations/service";
import { ok, runApi } from "@/lib/http";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return runApi(req, async () => {
    const { tenant, user } = await requireTenantOperations(req, PRODUCTION_ROLES);
    return ok({ job: await createProductionForCustomOrder(tenant.id, (await params).id, user._id) }, 201);
  });
}
