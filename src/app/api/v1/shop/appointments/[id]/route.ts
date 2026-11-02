import type { NextRequest } from "next/server";
import { OPERATIONS_ROLES, requireTenantOperations } from "@/auth/operations-access";
import { appointmentStatusSchema } from "@/operations/schemas";
import { updateAppointment } from "@/operations/service";
import { ok, readJson, runApi } from "@/lib/http";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return runApi(req, async () => { const { tenant } = await requireTenantOperations(req, OPERATIONS_ROLES, "appointments.manage"); const input = appointmentStatusSchema.parse(await readJson(req)); return ok({ appointment: await updateAppointment(tenant.id, (await params).id, input.status) }); });
}
