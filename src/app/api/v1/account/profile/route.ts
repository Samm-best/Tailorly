import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { profileUpdateSchema } from "@/customers/schemas";
import { toPublicUser, updateProfile } from "@/customers/service";
import { ok, readJson, runApi } from "@/lib/http";

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    return ok({ user: toPublicUser(user) });
  });
}

export async function PATCH(req: NextRequest) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    const patch = profileUpdateSchema.parse(await readJson(req));
    return ok({ user: await updateProfile(user._id, patch) });
  });
}
