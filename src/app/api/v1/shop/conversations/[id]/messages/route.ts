import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { MESSAGE_ROLES, hasTenantOperations } from "@/auth/operations-access";
import { messageSchema } from "@/operations/schemas";
import { addMessage, listMessages } from "@/operations/service";
import { AppError } from "@/lib/errors";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";
type Ctx = { params: Promise<{ id: string }> };
async function access(req: NextRequest) {
  const ctx = await tenantContextFrom(req);
  if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address.");
  const { user } = await requireUser(req);
  const manager = await hasTenantOperations(req, MESSAGE_ROLES);
  return { tenant: ctx.tenant, user, manager };
}
export async function GET(req: NextRequest, { params }: Ctx) {
  return runApi(req, async () => { const a = await access(req); return ok({ messages: await listMessages(a.tenant.id, a.user._id, (await params).id, a.manager) }); });
}
export async function POST(req: NextRequest, { params }: Ctx) {
  return runApi(req, async () => { const a = await access(req); return ok({ message: await addMessage(a.tenant.id, a.user._id, (await params).id, messageSchema.parse(await readJson(req)).body, a.manager) }, 201); });
}
