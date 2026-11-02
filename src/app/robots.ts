import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? "localhost";
  const proto = host.startsWith("localhost") || host.includes(".localhost") ? "http" : "https";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/account", "/manage", "/login", "/register", "/reset-password", "/verify-email", "/forgot-password"] }],
    sitemap: `${proto}://${host}/sitemap.xml`,
  };
}
