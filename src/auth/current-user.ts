import type { NextRequest } from "next/server";
import { authenticateToken } from "@/auth/service";
import { sessionTokenFrom } from "@/lib/http";

/** Resolves the signed-in user for an API route or throws UNAUTHENTICATED. */
export async function requireUser(req: NextRequest) {
  return authenticateToken(sessionTokenFrom(req));
}
