import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { requireTenantPermission } from "@/auth/service";
import { AppError } from "@/lib/errors";
import { tenantContextFrom } from "@/lib/http";
import type { TenantRole } from "@/tenants/roles";
import type { TenantPermission } from "@/tenants/permissions";

export const OPERATIONS_ROLES: readonly TenantRole[] = ["owner", "manager", "tailor", "staff", "delivery"];
export const PRODUCTION_ROLES: readonly TenantRole[] = ["owner", "manager", "tailor", "staff"];
export const DELIVERY_ROLES: readonly TenantRole[] = ["owner", "manager", "delivery"];
export const MESSAGE_ROLES: readonly TenantRole[] = ["owner", "manager", "tailor", "staff"];

export async function requireTenantOperations(req: NextRequest, allowed: readonly TenantRole[] = OPERATIONS_ROLES, explicitPermission?: TenantPermission) {
  const ctx = await tenantContextFrom(req);
  if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address.");
  const { user } = await requireUser(req);
  const role = await requireTenantPermission(user._id, ctx.tenant.id, explicitPermission ?? permissionForRoles(allowed));
  return { user, tenant: ctx.tenant, role };
}

function permissionForRoles(allowed: readonly TenantRole[]): TenantPermission {
  if (allowed === PRODUCTION_ROLES) return "production.manage";
  if (allowed === DELIVERY_ROLES) return "deliveries.manage";
  if (allowed === MESSAGE_ROLES) return "messages.manage";
  return "orders.manage";
}

export async function hasTenantOperations(req: NextRequest, allowed: readonly TenantRole[] = OPERATIONS_ROLES): Promise<boolean> {
  try {
    await requireTenantOperations(req, allowed);
    return true;
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") return false;
    throw error;
  }
}
