export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "www", "admin", "api", "app", "login", "support", "mail", "static", "assets", "dashboard", "super-admin", "tailorly",
]);

export type HostInfo =
  | { kind: "root" }
  | { kind: "tenant"; slug: string }
  | { kind: "unknown"; host: string };

const HOST_RE = /^(\[[0-9a-f:]+\]|[a-z0-9.-]+)(:\d{1,5})?$/;
const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

/** Lower-cases, strips port and trailing dot. Returns null for anything that is not a plausible host. */
export function normalizeHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (!value || value.length > 260) return null;
  const match = HOST_RE.exec(value);
  if (!match) return null;
  let host = match[1]!;
  if (host.endsWith(".")) host = host.slice(0, -1);
  if (!host || host.includes("..") || host.startsWith(".") || host.length > 253) return null;
  return host;
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && !RESERVED_SLUGS.has(slug);
}

/** Classifies a Host header. Never trust a tenant id from the browser - only this mapping. */
export function resolveHost(rawHost: string | null | undefined, rootDomain: string): HostInfo {
  const host = normalizeHost(rawHost);
  const root = normalizeHost(rootDomain);
  if (!host || !root) return { kind: "unknown", host: host ?? "" };
  if (host === root || host === `www.${root}`) return { kind: "root" };
  if (host.startsWith("[") || IPV4_RE.test(host)) return { kind: "root" }; // 127.0.0.1, [::1]
  const suffix = `.${root}`;
  if (host.endsWith(suffix)) {
    const sub = host.slice(0, -suffix.length);
    if (!sub.includes(".") && isValidSlug(sub)) return { kind: "tenant", slug: sub };
  }
  return { kind: "unknown", host };
}
