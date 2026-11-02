import { connectDb } from "@/db/mongoose";
import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { Tenant } from "@/tenants/models";
import { resolveHost } from "@/tenancy/host";

export type TenantRef = { id: string; slug: string; name: string };
export type TenantContext = { kind: "root" } | { kind: "tenant"; tenant: TenantRef };

/**
 * Resolves the tenant from the trusted Host header only.
 * Root host -> root. Known active tenant subdomain -> tenant. Anything else -> 404
 * (outside production an unrecognised host falls back to root for LAN/preview convenience).
 */
export async function resolveTenantContext(host: string | null | undefined): Promise<TenantContext> {
  const env = getEnv();
  const info = resolveHost(host, env.ROOT_DOMAIN);
  if (info.kind === "root") return { kind: "root" };
  if (info.kind === "unknown") {
    if (env.NODE_ENV !== "production") return { kind: "root" };
    throw new AppError("NOT_FOUND", "Unknown host");
  }
  await connectDb();
  const tenant = await Tenant.findOne({ slug: info.slug, status: "active" }).select("name slug").lean();
  if (!tenant) throw new AppError("NOT_FOUND", "Shop not found");
  return { kind: "tenant", tenant: { id: String(tenant._id), slug: tenant.slug, name: tenant.name } };
}

/** Origin used inside emails, derived from config + the validated tenant - never from raw Host. */
export function buildLinkBase(ctx: TenantContext): string {
  const env = getEnv();
  const app = new URL(env.APP_URL);
  if (ctx.kind === "root") return app.origin;
  const port = app.port ? `:${app.port}` : "";
  return `${app.protocol}//${ctx.tenant.slug}.${env.ROOT_DOMAIN}${port}`;
}

/** Public origin of a shop, built from config + a validated slug (used by the shop directory). */
export function shopOrigin(slug: string): string {
  const env = getEnv();
  const app = new URL(env.APP_URL);
  const port = app.port ? `:${app.port}` : "";
  return `${app.protocol}//${slug}.${env.ROOT_DOMAIN}${port}`;
}
