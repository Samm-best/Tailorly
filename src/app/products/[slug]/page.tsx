import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopShell } from "@/components/site";
import { formatNaira } from "@/catalogue/money";
import { getPublicProduct } from "@/catalogue/service";
import { requireShopPage } from "@/lib/page-context";
import { DEMO_FASHION_IMAGES, PriceText, StockBadge } from "../../shop-pages";
import { AddToCart } from "../add-to-cart";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shop = await requireShopPage();
  const found = await getPublicProduct(shop.id, (await params).slug.toLowerCase());
  if (!found) return { title: "Product not found" };
  const { product } = found;
  return {
    title: `${product.name} - ${shop.name}`,
    description: product.description.slice(0, 160) || `${product.name} from ${shop.name}`,
    openGraph: { title: product.name, images: product.images[0] ? [product.images[0].url] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const shop = await requireShopPage();
  // The tenant comes from the Host header. A product slug from another shop simply does not exist here.
  const found = await getPublicProduct(shop.id, (await params).slug.toLowerCase());
  if (!found) notFound();
  const { product, category } = found;
  const hasOptions = product.variants.some((v) => v.options.size || v.options.color || v.options.fabric);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description,
    image: product.images.map((i) => i.url),
    offers: { "@type": "AggregateOffer", priceCurrency: "NGN", lowPrice: product.price.min / 100, highPrice: product.price.max / 100,
      availability: product.state === "out_of_stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" },
  };
  return (
    <ShopShell shop={shop}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-600">
          <Link href="/products" className="underline">Shop</Link>
          {category ? <> / <Link href={`/products?category=${category.slug}`} className="underline">{category.name}</Link></> : null}
        </nav>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            {product.images.length ? product.images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.url} src={img.url} alt={img.alt} loading={i === 0 ? "eager" : "lazy"} className="image-motion w-full rounded-2xl bg-slate-100 object-cover" />
            )) : DEMO_FASHION_IMAGES[product.slug] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={DEMO_FASHION_IMAGES[product.slug]} alt={`${product.name} Nigerian fashion design`} className="image-motion w-full rounded-2xl object-cover" />
            ) : (
              <div className="african-textile-placeholder flex aspect-[4/5] items-center justify-center rounded-2xl text-6xl font-semibold text-white" aria-label={`${product.name} Nigerian fashion placeholder`}><span className="relative z-10 rounded-full border border-white/50 bg-black/10 px-7 py-4">{product.name.slice(0, 1).toUpperCase()}</span></div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-2xl font-semibold" style={{ color: "var(--shop-brand)" }}>
              <PriceText price={product.price} />
              {product.compareAtPrice ? <span className="text-base font-normal text-slate-500 line-through">{formatNaira(product.compareAtPrice)}</span> : null}
              <StockBadge state={product.state} />
            </p>
            {product.kind === "custom_service" ? <p className="mt-2 text-sm text-slate-600">Custom service: made to your request and measurements.</p> : null}
            {product.description ? <p className="mt-4 whitespace-pre-line text-slate-700">{product.description}</p> : null}
            {hasOptions ? (
              <section className="mt-6" aria-label="Available options">
                <h2 className="mb-2 font-semibold text-slate-900">Options</h2>
                <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                  {product.variants.map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span>{v.label}</span>
                      <span className="flex items-center gap-2"><span className="font-medium">{formatNaira(v.price)}</span><StockBadge state={v.state} /></span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <AddToCart product={product} />
            <p className="mt-4 text-sm text-slate-600">Need a different design or custom measurements? <Link href="/contact" className="font-medium underline">Contact the shop</Link>.</p>
          </div>
        </div>
      </div>
    </ShopShell>
  );
}
