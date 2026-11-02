import type { NextRequest } from "next/server";
import { clearSessionCookie } from "@/auth/cookies";
import { logoutSession } from "@/auth/service";
import { ok, runApi, sessionTokenFrom } from "@/lib/http";

export async function POST(req: NextRequest) {
  return runApi(req, async () => {
    await logoutSession(sessionTokenFrom(req));
    const res = ok({ loggedOut: true });
    clearSessionCookie(res);
    return res;
  });
}
