import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { requireTenantPermission } from "@/auth/service";
import { AppError } from "@/lib/errors";
import { tenantContextFrom } from "@/lib/http";
import type { TenantPermission } from "@/tenants/permissions";

/**
 * Gate for every shop-management route: the shop comes from the trusted Host header,
 * the user from the session, and the role from THIS shop's membership only.
 */
export async function requireShopManager(req: NextRequest, permission: TenantPermission = "shop.manage") {
  const ctx = await tenantContextFrom(req);
  if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address.");
  const { user } = await requireUser(req);
  const role = await requireTenantPermission(user._id, ctx.tenant.id, permission);
  return { user, tenant: ctx.tenant, role };
}
