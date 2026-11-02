import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { hasTenantOperations } from "@/auth/operations-access";
import { listDeliveries } from "@/operations/service";
import { AppError } from "@/lib/errors";
import { ok, runApi, tenantContextFrom } from "@/lib/http";
export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const ctx = await tenantContextFrom(req); if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "Delivery requires a shop address.");
    const { user } = await requireUser(req); const manager = await hasTenantOperations(req);
    return ok({ deliveries: await listDeliveries(ctx.tenant.id, user._id, manager) });
  });
}
