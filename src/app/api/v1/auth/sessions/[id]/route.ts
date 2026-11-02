import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { objectId } from "@/customers/schemas";
import { revokeSession } from "@/customers/service";
import { ok, runApi } from "@/lib/http";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    await revokeSession(user._id, objectId.parse((await params).id));
    return ok({ revoked: true });
  });
}
