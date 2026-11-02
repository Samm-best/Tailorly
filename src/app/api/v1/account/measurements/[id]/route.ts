import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { AppError } from "@/lib/errors";
import { measurementInputSchema } from "@/orders/schemas";
import { deleteMeasurement, shareMeasurement, updateMeasurement } from "@/orders/service";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";
type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(req: NextRequest, { params }: Ctx) { return runApi(req, async () => { const { user } = await requireUser(req); const input = measurementInputSchema.partial().strict().parse(await readJson(req)); return ok({ measurement: await updateMeasurement(user._id, (await params).id, input) }); }); }
export async function DELETE(req: NextRequest, { params }: Ctx) { return runApi(req, async () => { const { user } = await requireUser(req); await deleteMeasurement(user._id, (await params).id); return ok({ deleted: true }); }); }
export async function POST(req: NextRequest, { params }: Ctx) {
  return runApi(req, async () => {
    const ctx = await tenantContextFrom(req);
    if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "Share a measurement from a shop address.");
    const { user } = await requireUser(req);
    return ok({ measurement: await shareMeasurement(user._id, (await params).id, ctx.tenant.id) });
  });
}
