import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { Product } from "@/catalogue/models";
import { connectDb } from "@/db/mongoose";
import { resolveTenantContext } from "@/tenancy/context";

export const dynamic = "force-dynamic";

const ROOT_PAGES = ["", "/about", "/about/founder", "/how-it-works", "/for-tailors", "/features", "/meet-the-creator", "/faq", "/contact", "/get-started", "/shops"];
const SHOP_PAGES = ["", "/products", "/about", "/contact"];

/** One sitemap per host: the root site lists marketing pages, a shop lists only its own pages and published products. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get("host") ?? "localhost";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.includes(".localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  try {
    const ctx = await resolveTenantContext(host);
    if (ctx.kind === "root") return ROOT_PAGES.map((p) => ({ url: `${origin}${p}` }));
    await connectDb();
    const products = await Product.find({ tenantId: ctx.tenant.id, status: "published" }).select("slug updatedAt").limit(5000).lean();
    return [
      ...SHOP_PAGES.map((p) => ({ url: `${origin}${p}` })),
      ...products.map((p) => ({ url: `${origin}/products/${p.slug}`, lastModified: p.updatedAt })),
    ];
  } catch {
    return [];
  }
}
