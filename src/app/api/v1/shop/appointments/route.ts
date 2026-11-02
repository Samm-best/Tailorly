import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { hasTenantOperations } from "@/auth/operations-access";
import { appointmentSchema } from "@/operations/schemas";
import { createAppointment, listAppointments } from "@/operations/service";
import { AppError } from "@/lib/errors";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";
export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const ctx = await tenantContextFrom(req); if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "Appointments require a shop address.");
    const { user } = await requireUser(req); const manager = await hasTenantOperations(req);
    return ok({ appointments: await listAppointments(ctx.tenant.id, user._id, manager) });
  });
}
export async function POST(req: NextRequest) {
  return runApi(req, async () => {
    const ctx = await tenantContextFrom(req); if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "Appointments require a shop address.");
    const { user } = await requireUser(req); return ok({ appointment: await createAppointment(ctx.tenant.id, user._id, appointmentSchema.parse(await readJson(req))) }, 201);
  });
}
