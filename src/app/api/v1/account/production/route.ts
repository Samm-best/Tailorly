import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { AppError } from "@/lib/errors";
import { getCustomerProduction } from "@/operations/service";
import { ok, runApi, tenantContextFrom } from "@/lib/http";
export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const ctx = await tenantContextFrom(req);
    if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "Production is available from a shop address.");
    const { user } = await requireUser(req);
    return ok({ jobs: await getCustomerProduction(ctx.tenant.id, user._id) });
  });
}
