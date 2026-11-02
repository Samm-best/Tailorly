import type { NextRequest } from "next/server";
import { requireShopManager } from "@/auth/shop-access";
import { requireUser } from "@/auth/current-user";
import { getTenantMembership } from "@/auth/service";
import { tenantContextFrom } from "@/lib/http";
import { AppError } from "@/lib/errors";
import { defaultPermissionsForRole } from "@/tenants/permissions";
import { ok, readJson, runApi } from "@/lib/http";
import { shopProfileUpdateSchema } from "@/storefront/schemas";
import { getPublicShop, updateShopProfile } from "@/storefront/service";

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const ctx = await tenantContextFrom(req);
    if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address.");
    const { user } = await requireUser(req);
    const membership = await getTenantMembership(user._id, ctx.tenant.id);
    if (!membership) throw new AppError("FORBIDDEN", "You do not have access to this shop.");
    const permissions = membership.permissions?.length ? membership.permissions : defaultPermissionsForRole(membership.role);
    return ok({ shop: await getPublicShop(ctx.tenant.id), role: membership.role, permissions });
  });
}

export async function PATCH(req: NextRequest) {
  return runApi(req, async () => {
    const { tenant } = await requireShopManager(req, "shop.manage");
    const patch = shopProfileUpdateSchema.parse(await readJson(req));
    return ok({ shop: await updateShopProfile(tenant.id, patch) });
  });
}
