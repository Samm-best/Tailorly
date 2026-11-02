import type { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

/**
 * Host-only cookie (no Domain attribute): each shop host keeps its own session, so signing in
 * on shop A never silently authenticates the browser on shop B. Same credentials, separate sessions.
 * In production the __Host- prefix additionally forces Secure + Path=/ + no Domain.
 */
export const SESSION_COOKIE = isProd ? "__Host-tailorly_session" : "tailorly_session";

export function setSessionCookie(res: NextResponse, token: string, expires: Date): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: 0 });
}
