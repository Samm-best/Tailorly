import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import { getPublicShop } from "@/storefront/service";
import type { PublicShop } from "@/storefront/serialize";
import { resolveTenantContext } from "@/tenancy/context";

export type PageContext = { kind: "root" } | { kind: "shop"; shop: PublicShop };

/** Server-component helper: who is this page for - the Tailorly site or a specific shop? Derived from Host only. */
export async function getPageContext(): Promise<PageContext> {
  const host = (await headers()).get("host");
  try {
    const ctx = await resolveTenantContext(host);
    if (ctx.kind === "root") return { kind: "root" };
    const shop = await getPublicShop(ctx.tenant.id);
    if (!shop) notFound();
    return { kind: "shop", shop };
  } catch (err) {
    if (err instanceof AppError && err.code === "NOT_FOUND") notFound();
    throw err;
  }
}

/** For pages that only exist on shop addresses (catalogue etc.). */
export async function requireShopPage(): Promise<PublicShop> {
  const ctx = await getPageContext();
  if (ctx.kind !== "shop") notFound();
  return ctx.shop;
}

/** For pages that only exist on the main Tailorly website. */
export async function requireRootPage(): Promise<void> {
  const ctx = await getPageContext();
  if (ctx.kind !== "root") notFound();
}
