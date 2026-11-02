import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { listSessions } from "@/customers/service";
import { ok, runApi } from "@/lib/http";

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { user, session } = await requireUser(req);
    const rows = await listSessions(user._id);
    return ok({
      sessions: rows.map((s) => ({
        id: String(s._id),
        current: String(s._id) === String(session._id),
        userAgent: s.userAgent ?? "Unknown device",
        lastUsedAt: s.lastUsedAt,
        createdAt: s.createdAt,
      })),
    });
  });
}
