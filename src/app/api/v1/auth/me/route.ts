import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { getPlatformRole, listMemberships } from "@/auth/service";
import { toPublicUser } from "@/customers/service";
import { ok, runApi, tenantContextFrom } from "@/lib/http";

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    const ctx = await tenantContextFrom(req);
    const [memberships, platformRole] = await Promise.all([listMemberships(user._id), getPlatformRole(user._id)]);
    return ok({
      user: toPublicUser(user),
      memberships,
      platformRole,
      currentShop: ctx.kind === "tenant" ? { slug: ctx.tenant.slug, name: ctx.tenant.name } : null,
    });
  });
}
