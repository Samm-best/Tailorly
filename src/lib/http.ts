import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { SESSION_COOKIE } from "@/auth/cookies";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { checkSameOrigin, getClientIp } from "@/lib/request-security";
import { resolveTenantContext, type TenantContext } from "@/tenancy/context";

export type ApiCtx = { req: NextRequest; requestId: string; ip: string };

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(err: unknown, requestId: string): NextResponse {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: details[0]?.message ?? "Invalid input", details }, requestId },
      { status: 400 },
    );
  }
  if (err instanceof AppError) {
    const res = NextResponse.json(
      { ok: false, error: { code: err.code, message: err.message, details: err.details }, requestId },
      { status: err.status },
    );
    const retry = (err.details as { retryAfterSec?: number } | undefined)?.retryAfterSec;
    if (err.code === "RATE_LIMITED" && retry) res.headers.set("Retry-After", String(retry));
    return res;
  }
  logger.error("unhandled api error", { requestId, error: err instanceof Error ? err.message : String(err) });
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." }, requestId },
    { status: 500 },
  );
}

/** Wraps every route: request id, CSRF same-origin check, safe error envelope, no-store caching. */
export async function runApi(req: NextRequest, fn: (c: ApiCtx) => Promise<NextResponse>): Promise<NextResponse> {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  try {
    const allowed = checkSameOrigin({
      method: req.method,
      origin: req.headers.get("origin"),
      host: req.headers.get("host"),
      secFetchSite: req.headers.get("sec-fetch-site"),
    });
    if (!allowed) throw new AppError("CSRF_REJECTED", "Cross-site request rejected.");
    const res = await fn({ req, requestId, ip: getClientIp(req.headers) });
    res.headers.set("x-request-id", requestId);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    const res = fail(err, requestId);
    res.headers.set("x-request-id", requestId);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Request body must be valid JSON.");
  }
}

export const sessionTokenFrom = (req: NextRequest) => req.cookies.get(SESSION_COOKIE)?.value;
export const tenantContextFrom = (req: NextRequest): Promise<TenantContext> => resolveTenantContext(req.headers.get("host"));
export const tenantRefOf = (ctx: TenantContext) => (ctx.kind === "tenant" ? ctx.tenant : null);
