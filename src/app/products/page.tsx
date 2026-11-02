import type { Metadata } from "next";
import Link from "next/link";
import { Pagination, ShopShell } from "@/components/site";
import { publicListQuerySchema } from "@/catalogue/schemas";
import { listPublicCategories, listPublicProducts } from "@/catalogue/service";
import { requireShopPage } from "@/lib/page-context";
import { ProductCard } from "../shop-pages";

export async function generateMetadata(): Promise<Metadata> {
  const shop = await requireShopPage();
  return { title: `Shop - ${shop.name}`, description: `Browse designs and services from ${shop.name}.` };
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const shop = await requireShopPage();
  const parsed = publicListQuerySchema.safeParse(await searchParams);
  const query = parsed.success ? parsed.data : publicListQuerySchema.parse({});
  const [{ items, total, page, pageSize }, categories] = await Promise.all([listPublicProducts(shop.id, query), listPublicCategories(shop.id)]);
  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: query.q, category: query.category, kind: query.kind, sort: query.sort === "newest" ? undefined : query.sort, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/products?${s}` : "/products";
  };
  const chip = (active: boolean) => `inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${active ? "border-transparent font-semibold" : "border-slate-300 hover:bg-slate-50"}`;
  const activeStyle = { background: "var(--shop-brand)", color: "var(--shop-on-brand)" };
  return (
    <ShopShell shop={shop}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-semibold" style={{ color: "var(--shop-brand)" }}>Shop</h1>
        <form action="/products" role="search" className="mt-4 flex flex-wrap gap-2">
          {query.category ? <input type="hidden" name="category" value={query.category} /> : null}
          <label htmlFor="q" className="sr-only">Search products</label>
          <input id="q" name="q" defaultValue={query.q ?? ""} placeholder="Search designs" className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3" />
          <label htmlFor="sort" className="sr-only">Sort</label>
          <select id="sort" name="sort" defaultValue={query.sort} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
          </select>
          <button className="min-h-11 rounded-lg px-5 text-sm font-semibold" style={activeStyle}>Search</button>
        </form>
        <nav aria-label="Categories" className="mt-4 flex flex-wrap gap-2">
          <Link href={href({ category: undefined, page: undefined })} className={chip(!query.category)} style={!query.category ? activeStyle : undefined}>All</Link>
          {categories.map((c) => (
            <Link key={c.slug} href={href({ category: c.slug, page: undefined })} className={chip(query.category === c.slug)} style={query.category === c.slug ? activeStyle : undefined}>{c.name}</Link>
          ))}
        </nav>
        {items.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-600">
            {query.q || query.category ? "Nothing matches your search. Try clearing the filters." : "This shop has not published any products yet."}
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} product={p} />)}</ul>
        )}
        <Pagination page={page} total={total} pageSize={pageSize} hrefFor={(p) => href({ page: String(p) })} />
      </div>
    </ShopShell>
  );
}
