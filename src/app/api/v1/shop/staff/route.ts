import type { NextRequest } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { requireUser } from "@/auth/current-user";
import { requireTenantPermission } from "@/auth/service";
import { User } from "@/auth/models";
import { AuditEvent } from "@/tenants/audit";
import { TenantMembership } from "@/tenants/models";
import { TENANT_ROLES, type TenantRole } from "@/tenants/roles";
import { TENANT_PERMISSIONS, defaultPermissionsForRole, type TenantPermission } from "@/tenants/permissions";
import { AppError } from "@/lib/errors";
import { connectDb } from "@/db/mongoose";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";

const staffRoles = TENANT_ROLES.filter((role) => role !== "customer") as [Exclude<TenantRole, "customer">, ...Exclude<TenantRole, "customer">[]];
const staffSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(staffRoles),
  permissions: z.array(z.enum(TENANT_PERMISSIONS)).max(TENANT_PERMISSIONS.length).optional(),
});

async function shopId(req: NextRequest) {
  const ctx = await tenantContextFrom(req);
  if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address.");
  return ctx.tenant.id;
}

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const tenantId = await shopId(req);
    const { user } = await requireUser(req);
    await requireTenantPermission(user._id, tenantId, "staff.manage");
    await connectDb();
    const memberships = await TenantMembership.find({ tenantId: new Types.ObjectId(tenantId), status: "active", role: { $ne: "customer" } }).lean();
    const users = await User.find({ _id: { $in: memberships.map((membership) => membership.userId) }, status: "active" }).select("fullName email").lean();
    const byId = new Map(users.map((item) => [String(item._id), item]));
    return ok({
      staff: memberships.flatMap((membership) => {
        const member = byId.get(String(membership.userId));
        return member ? [{ userId: String(member._id), fullName: member.fullName, email: member.email, role: membership.role, permissions: membership.permissions?.length ? membership.permissions : defaultPermissionsForRole(membership.role) }] : [];
      }),
      roles: staffRoles,
      permissions: TENANT_PERMISSIONS,
    });
  });
}

export async function POST(req: NextRequest) {
  return runApi(req, async () => {
    const tenantId = await shopId(req);
    const { user: actor } = await requireUser(req);
    await requireTenantPermission(actor._id, tenantId, "staff.manage");
    const input = staffSchema.parse(await readJson(req));
    await connectDb();
    const user = await User.findOne({ email: input.email.toLowerCase(), status: "active" }).select("fullName email");
    if (!user) throw new AppError("NOT_FOUND", "No registered user exists with that email. Ask them to register before assigning shop access.");
    if (input.role === "owner") throw new AppError("FORBIDDEN", "Ownership changes require the ownership workflow.");
    const permissions = input.permissions ?? defaultPermissionsForRole(input.role);
    await TenantMembership.findOneAndUpdate(
      { tenantId: new Types.ObjectId(tenantId), userId: user._id },
      { $set: { role: input.role, permissions, status: "active" } },
      { upsert: true, new: true },
    ).lean();
    await AuditEvent.create({ tenantId: new Types.ObjectId(tenantId), actorUserId: actor._id, targetUserId: user._id, action: "staff.assigned", metadata: { role: input.role } });
    return ok({ staff: { userId: String(user._id), fullName: user.fullName, email: user.email, role: input.role, permissions } }, 201);
  });
}
