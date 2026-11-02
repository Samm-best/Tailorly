import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { acceptQuote } from "@/orders/service";
import { AppError } from "@/lib/errors";
import { ok, runApi, tenantContextFrom } from "@/lib/http";
type Ctx = { params: Promise<{ id: string }> };
export async function POST(req: NextRequest, { params }: Ctx) {
  return runApi(req, async () => {
    const ctx = await tenantContextFrom(req);
    if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address.");
    const { user } = await requireUser(req);
    return ok({ order: await acceptQuote(ctx.tenant.id, user._id, (await params).id) });
  });
}
