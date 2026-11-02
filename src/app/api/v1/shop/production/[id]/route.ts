import type { NextRequest } from "next/server";
import { PRODUCTION_ROLES, requireTenantOperations } from "@/auth/operations-access";
import { productionUpdateSchema } from "@/operations/schemas";
import { updateProduction } from "@/operations/service";
import { ok, readJson, runApi } from "@/lib/http";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return runApi(req, async () => {
    const { tenant, user } = await requireTenantOperations(req, PRODUCTION_ROLES);
    return ok({ job: await updateProduction(tenant.id, (await params).id, user._id, productionUpdateSchema.parse(await readJson(req))) });
  });
}
