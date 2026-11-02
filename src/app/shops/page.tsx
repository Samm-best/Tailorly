import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, PageHeading, Pagination, Section } from "@/components/site";
import { requireRootPage } from "@/lib/page-context";
import { shopDirectoryQuerySchema } from "@/storefront/schemas";
import { listPublicShops } from "@/storefront/service";
import { resolveTheme } from "@/storefront/branding";
import { shopOrigin } from "@/tenancy/context";

export const metadata: Metadata = { title: "Explore shops", description: "Discover independent tailors and fashion designers on Tailorly." };

export default async function ShopsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRootPage();
  const parsed = shopDirectoryQuerySchema.safeParse(await searchParams);
  const query = parsed.success ? parsed.data : { page: 1 as number, q: undefined };
  const { items, total, page, pageSize } = await listPublicShops(query);
  const qs = (p: number) => `/shops?${new URLSearchParams({ ...(query.q ? { q: query.q } : {}), page: String(p) })}`;
  return (
    <MarketingShell>
      <PageHeading eyebrow="Explore shops" title="Find a tailor you love" intro="Every shop is an independent business with its own catalogue and brand." />
      <Section>
        <form action="/shops" role="search" className="mb-6 flex gap-2">
          <label htmlFor="q" className="sr-only">Search shops</label>
          <input id="q" name="q" defaultValue={query.q ?? ""} placeholder="Search by shop name" className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3" />
          <button className="min-h-11 rounded-lg bg-navy px-5 text-sm font-semibold text-white">Search</button>
        </form>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">{query.q ? "No shops match that search." : "No shops are open yet. Check back soon."}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {items.map((s) => {
              const t = resolveTheme({ brandColor: s.brandColor });
              return (
                <li key={s.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="h-2" style={{ background: t.brand }} />
                  <div className="p-5">
                    <h2 className="text-lg font-semibold text-navy">{s.name}{s.verified ? <span className="ml-2 rounded-full bg-cyan/15 px-2 py-0.5 align-middle text-xs font-medium text-cyan-dark">Verified</span> : null}</h2>
                    {s.tagline ? <p className="mt-1 text-sm text-slate-600">{s.tagline}</p> : null}
                    {s.city ? <p className="mt-1 text-xs text-slate-500">{[s.city, s.state].filter(Boolean).join(", ")}</p> : null}
                    <Link href={shopOrigin(s.slug)} className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-cyan px-4 text-sm font-semibold text-navy hover:bg-cyan/10">Visit shop</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} total={total} pageSize={pageSize} hrefFor={qs} />
      </Section>
    </MarketingShell>
  );
}
