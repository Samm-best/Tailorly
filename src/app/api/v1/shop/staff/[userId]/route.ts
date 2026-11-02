import type { NextRequest } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { requireUser } from "@/auth/current-user";
import { requireTenantPermission } from "@/auth/service";
import { AuditEvent } from "@/tenants/audit";
import { TenantMembership } from "@/tenants/models";
import { TENANT_ROLES } from "@/tenants/roles";
import { TENANT_PERMISSIONS } from "@/tenants/permissions";
import { AppError } from "@/lib/errors";
import { connectDb } from "@/db/mongoose";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";

const inputSchema = z.object({ role: z.enum(TENANT_ROLES.filter((role) => role !== "customer") as ["owner", "manager", "tailor", "staff", "delivery"]), permissions: z.array(z.enum(TENANT_PERMISSIONS)).max(TENANT_PERMISSIONS.length) });

async function tenantId(req: NextRequest) {
  const context = await tenantContextFrom(req);
  if (context.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address.");
  return context.tenant.id;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  return runApi(req, async () => {
    const shopId = await tenantId(req);
    const { user: actor } = await requireUser(req);
    await requireTenantPermission(actor._id, shopId, "staff.manage");
    const { userId } = await params;
    if (!Types.ObjectId.isValid(userId)) throw new AppError("VALIDATION_ERROR", "Invalid staff member.");
    const input = inputSchema.parse(await readJson(req));
    if (input.role === "owner") throw new AppError("FORBIDDEN", "Ownership changes require the ownership workflow.");
    await connectDb();
    const membership = await TenantMembership.findOne({ tenantId: new Types.ObjectId(shopId), userId: new Types.ObjectId(userId), status: "active" });
    if (!membership || membership.role === "owner") throw new AppError("FORBIDDEN", "The shop owner cannot be changed here.");
    membership.role = input.role;
    membership.permissions = input.permissions;
    await membership.save();
    await AuditEvent.create({ tenantId: new Types.ObjectId(shopId), actorUserId: actor._id, targetUserId: new Types.ObjectId(userId), action: "staff.permissions_updated", metadata: { role: input.role } });
    return ok({ updated: true });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  return runApi(req, async () => {
    const shopId = await tenantId(req);
    const { user: actor } = await requireUser(req);
    await requireTenantPermission(actor._id, shopId, "staff.manage");
    const { userId } = await params;
    if (!Types.ObjectId.isValid(userId) || String(actor._id) === userId) throw new AppError("FORBIDDEN", "You cannot remove your own shop access.");
    await connectDb();
    const result = await TenantMembership.updateOne({ tenantId: new Types.ObjectId(shopId), userId: new Types.ObjectId(userId), role: { $ne: "owner" } }, { $set: { status: "removed" } });
    if (!result.modifiedCount) throw new AppError("NOT_FOUND", "Staff member not found.");
    await AuditEvent.create({ tenantId: new Types.ObjectId(shopId), actorUserId: actor._id, targetUserId: new Types.ObjectId(userId), action: "staff.removed" });
    return ok({ removed: true });
  });
}
