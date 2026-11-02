import type { NextRequest } from "next/server";
import { PRODUCTION_ROLES, requireTenantOperations } from "@/auth/operations-access";
import { listProduction } from "@/operations/service";
import { ok, runApi } from "@/lib/http";
export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { tenant } = await requireTenantOperations(req, PRODUCTION_ROLES);
    return ok({ jobs: await listProduction(tenant.id) });
  });
}
