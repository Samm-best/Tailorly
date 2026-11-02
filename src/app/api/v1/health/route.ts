import { NextResponse } from "next/server";
import { pingDb } from "@/db/mongoose";

export const dynamic = "force-dynamic";

/** Readiness probe: reports only whether the database answers. No secrets, no tenant data. */
export async function GET() {
  const database = await pingDb();
  return NextResponse.json(
    { status: database ? "ok" : "degraded", database: database ? "up" : "down", time: new Date().toISOString() },
    { status: database ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
