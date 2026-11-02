import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { markReadSchema, notificationsQuerySchema } from "@/customers/schemas";
import { listNotifications, markNotificationsRead } from "@/customers/service";
import { ok, readJson, runApi } from "@/lib/http";

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    const q = notificationsQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const r = await listNotifications(user._id, { limit: q.limit, before: q.before, unreadOnly: q.unreadOnly === "true" });
    return ok({
      unreadCount: r.unreadCount,
      nextBefore: r.nextBefore,
      notifications: r.items.map((n) => ({
        id: String(n._id), type: n.type, title: n.title, body: n.body, read: Boolean(n.readAt), createdAt: n.createdAt,
      })),
    });
  });
}

export async function PATCH(req: NextRequest) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    return ok(await markNotificationsRead(user._id, markReadSchema.parse(await readJson(req))));
  });
}
