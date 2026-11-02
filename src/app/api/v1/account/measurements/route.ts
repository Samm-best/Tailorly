import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { measurementInputSchema } from "@/orders/schemas";
import { createMeasurement, listMeasurements } from "@/orders/service";
import { ok, readJson, runApi } from "@/lib/http";
export async function GET(req: NextRequest) { return runApi(req, async () => { const { user } = await requireUser(req); return ok({ measurements: await listMeasurements(user._id) }); }); }
export async function POST(req: NextRequest) { return runApi(req, async () => { const { user } = await requireUser(req); return ok({ measurement: await createMeasurement(user._id, measurementInputSchema.parse(await readJson(req))) }, 201); }); }
