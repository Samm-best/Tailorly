import type { NextRequest } from "next/server";
import { ok, runApi, tenantContextFrom } from "@/lib/http";

/** Tells the UI which shop (if any) the current host belongs to. Derived from Host only. */
export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const ctx = await tenantContextFrom(req);
    return ok(ctx.kind === "root" ? { kind: "root" } : { kind: "tenant", name: ctx.tenant.name, slug: ctx.tenant.slug });
  });
}
