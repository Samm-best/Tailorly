import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware: assigns a request id and strips any client-supplied x-tailorly-* headers
 * so internal headers can never be spoofed. Tenant resolution itself happens server-side
 * from the Host header (it needs the database, which the edge runtime cannot reach).
 */
export function middleware(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const headers = new Headers(req.headers);
  for (const key of [...headers.keys()]) if (key.startsWith("x-tailorly-")) headers.delete(key);
  headers.set("x-request-id", requestId);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("x-request-id", requestId);
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
