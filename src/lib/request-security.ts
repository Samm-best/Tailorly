const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isSafeMethod(method: string): boolean {
  return SAFE_METHODS.has(method.toUpperCase());
}

/**
 * CSRF defence for cookie-authenticated mutations.
 * Browsers always send Origin (or Sec-Fetch-Site) on cross-site POSTs; if either says
 * "not same site" we reject. Requests with neither header (curl, server-to-server) carry
 * no ambient browser cookies, so they are allowed.
 */
export function checkSameOrigin(input: {
  method: string;
  origin: string | null;
  host: string | null;
  secFetchSite: string | null;
}): boolean {
  if (isSafeMethod(input.method)) return true;
  if (input.origin) {
    try {
      return !!input.host && new URL(input.origin).host.toLowerCase() === input.host.toLowerCase();
    } catch {
      return false;
    }
  }
  if (input.secFetchSite) return input.secFetchSite === "same-origin" || input.secFetchSite === "none";
  return true;
}

/** First hop of x-forwarded-for (set by the hosting proxy). Spoofable without a trusted proxy. */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim().slice(0, 64) || "unknown";
  return headers.get("x-real-ip")?.slice(0, 64) || "unknown";
}
