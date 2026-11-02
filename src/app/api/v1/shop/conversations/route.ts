import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { MESSAGE_ROLES, hasTenantOperations } from "@/auth/operations-access";
import { conversationSchema } from "@/operations/schemas";
import { createConversation, listConversations } from "@/operations/service";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";
import { AppError } from "@/lib/errors";
export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const ctx = await tenantContextFrom(req);
    if (ctx.kind !== "tenant") return ok({ conversations: [] });
    const { user } = await requireUser(req);
    const manager = await hasTenantOperations(req, MESSAGE_ROLES);
    return ok({ conversations: await listConversations(ctx.tenant.id, user._id, manager) });
  });
}
export async function POST(req: NextRequest) {
  return runApi(req, async () => {
    const ctx = await tenantContextFrom(req);
    if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address.");
    const { user } = await requireUser(req);
    if (await hasTenantOperations(req, MESSAGE_ROLES)) throw new AppError("CONFLICT", "Shop staff should reply within an existing customer conversation.");
    return ok({ conversation: await createConversation(ctx.tenant.id, user._id, conversationSchema.parse(await readJson(req))) }, 201);
  });
}
