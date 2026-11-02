import Link from "next/link";
import { ShopShell } from "@/components/site";
import { formatNaira } from "@/catalogue/money";
import type { PublicProduct } from "@/catalogue/serialize";
import type { PublicShop } from "@/storefront/serialize";
import { FASHION_MEDIA } from "@/site/media";

export function PriceText({ price }: { price: { min: number; max: number } }) {
  return <>{price.min === price.max ? formatNaira(price.min) : `From ${formatNaira(price.min)}`}</>;
}

export function StockBadge({ state }: { state: PublicProduct["state"] }) {
  if (state === "in_stock") return null;
  const label = state === "low_stock" ? "Only a few left" : "Out of stock";
  const cls = state === "low_stock" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

export const DEMO_FASHION_IMAGES: Record<string, string> = {
  "senator-suit": "/fashion/download-6.webp",
  "two-piece-business-suit": "/fashion/images-23.jpeg",
  "bespoke-native-fitting": "/fashion/bespoke_vs_ready_to_wear.webp",
  "ankara-peplum-dress": "/fashion/african-fashion-7.png",
  "aso-ebi-set": "/fashion/images-35.jpeg",
};

export function ProductCard({ product }: { product: PublicProduct }) {
  const img = product.images[0] ?? (DEMO_FASHION_IMAGES[product.slug] ? { url: DEMO_FASHION_IMAGES[product.slug], alt: `${product.name} Nigerian fashion design` } : undefined);
  return (
    <li className="fashion-card">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-[4/5] w-full bg-slate-100">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img.url} alt={img.alt} loading="lazy" className="image-motion fashion-image h-full w-full object-cover" />
          ) : (
            <div className="african-textile-placeholder flex h-full items-center justify-center text-4xl font-semibold text-white" aria-label={`${product.name} Nigerian fashion placeholder`}><span className="relative z-10 rounded-full border border-white/50 bg-black/10 px-5 py-3">{product.name.slice(0, 1).toUpperCase()}</span></div>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-2 font-medium text-slate-900">{product.name}</h3>
          <p className="text-sm font-semibold" style={{ color: "var(--shop-brand)" }}>
            {product.kind === "custom_service" ? "Custom service - " : ""}<PriceText price={product.price} />
          </p>
          <StockBadge state={product.state} />
        </div>
      </Link>
    </li>
  );
}

export function ShopHome({ shop, featured, categories }: { shop: PublicShop; featured: PublicProduct[]; categories: { name: string; slug: string; count: number }[] }) {
  const contactPlace = [shop.contact.city, shop.contact.state].filter(Boolean).join(", ");
  const whatsapp = shop.social.whatsapp.replace(/\D/g, "");
  return (
    <ShopShell shop={shop}>
      <section className="relative overflow-hidden bg-gradient-to-r from-[var(--shop-brand)] via-[var(--shop-brand)] to-[var(--shop-accent)] text-white">
        <img src={FASHION_MEDIA.hero} alt="" aria-hidden="true" className="image-motion absolute inset-y-0 right-0 h-full w-2/5 object-cover opacity-20 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,.26),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_0.42fr]">
          <div>
            {shop.verified ? <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">✓ Verified Shop</span> : null}
            <h1 className="mt-4 text-4xl font-bold sm:text-6xl">{shop.name}</h1>
            <p className="mt-3 text-xl font-medium text-white/90">{shop.tagline || "Premium fashion designs for every occasion"}</p>
            {shop.description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80">{shop.description}</p> : null}
            <div className="mt-6 flex flex-wrap gap-5 text-sm font-medium text-white/90"><span>✦ Custom Designs</span><span>◇ Premium Quality</span><span>▣ Fast Delivery</span></div>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/12 p-5 shadow-xl backdrop-blur"><h2 className="text-lg font-semibold">Shop Information</h2>{contactPlace ? <p className="mt-4 text-sm">⌖ {contactPlace}</p> : null}{shop.contact.phone ? <p className="mt-2 text-sm">☎ {shop.contact.phone}</p> : null}<div className="mt-5 grid gap-2">{whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#25D366] px-4 py-3 text-center text-sm font-semibold text-white">Chat on WhatsApp</a> : null}<Link href="/contact" className="rounded-lg border border-white/70 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10">Follow Shop</Link></div></div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-8 lg:grid-cols-[210px_1fr_180px]">
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block"><h2 className="font-semibold text-[var(--shop-brand)]">▦ Shop Categories</h2><nav className="mt-4 grid gap-1">{categories.map((category) => <Link key={category.slug} href={`/products?category=${category.slug}`} className="flex items-center justify-between rounded-lg px-2 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-[var(--shop-brand)]"><span>{category.name}</span><span>›</span></Link>)}</nav>{categories.length ? <Link href="/products" className="mt-4 block text-center text-xs font-semibold text-[var(--shop-brand)]">View All Categories →</Link> : null}<div className="mt-6 rounded-xl bg-[var(--shop-brand)] p-4 text-sm text-white"><p className="font-semibold">Need a Custom Design?</p><p className="mt-1 text-xs text-white/80">Tell us what you want, we&apos;ll bring it to life.</p><Link href="/contact" className="mt-4 block rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-[var(--shop-brand)]">Request Custom Order →</Link></div></aside>
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap gap-2"><label className="flex min-h-11 min-w-48 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-400 shadow-sm"><span>⌕</span><input aria-label={`Search in ${shop.name}`} placeholder={`Search in ${shop.name}...`} className="w-full outline-none" /></label><select aria-label="Filter by size" className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option>All Sizes</option></select><select aria-label="Filter by colour" className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option>All Colours</option></select></div>
          {featured.length ? <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{featured.map((p) => <ProductCard key={p.id} product={p} />)}</ul> : <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">This shop has not published any featured designs yet. <Link href="/products" className="font-medium underline">See everything in the shop</Link>.</p>}
        </div>
        <aside className="hidden space-y-4 xl:block"><div className="rounded-2xl bg-cyan/10 p-4 text-sm"><h2 className="font-semibold text-[var(--shop-brand)]">Why Shop with Us?</h2><ul className="mt-4 grid gap-3 text-slate-700"><li>✓ Premium Quality</li><li>✓ Affordable Prices</li><li>✓ Fast Delivery</li><li>✓ Secure Payments</li><li>✓ Trusted service</li></ul></div><div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm"><h2 className="font-semibold text-[var(--shop-brand)]">Customer Reviews</h2><p className="mt-4 text-slate-500">Reviews from {shop.name} customers will appear here.</p></div></aside>
      </section>
      <section className="border-t border-slate-200 bg-white"><div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 text-center text-sm sm:grid-cols-4 sm:px-8"><div><strong className="block text-[var(--shop-brand)]">◇ Secure & Trusted</strong><span className="text-xs text-slate-500">Your data is safe</span></div><div><strong className="block text-[var(--shop-brand)]">▣ Fast Delivery</strong><span className="text-xs text-slate-500">Across Nigeria</span></div><div><strong className="block text-[var(--shop-brand)]">♧ 24/7 Support</strong><span className="text-xs text-slate-500">We&apos;re here to help</span></div><div><strong className="block text-[var(--shop-brand)]">◇ 100% Authentic</strong><span className="text-xs text-slate-500">Premium fabrics</span></div></div></section>
    </ShopShell>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold" style={{ color: "var(--shop-brand)" }}>{title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

export function ShopAbout({ shop }: { shop: PublicShop }) {
  const empty = !shop.description && !shop.vision && !shop.mission;
  return (
    <ShopShell shop={shop}>
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <h1 className="text-3xl font-semibold" style={{ color: "var(--shop-brand)" }}>About {shop.name}</h1>
        {empty ? <p className="text-slate-600">This shop has not added its story yet.</p> : null}
        <Block title="Our story" text={shop.description} />
        <Block title="Vision" text={shop.vision} />
        <Block title="Mission" text={shop.mission} />
      </div>
    </ShopShell>
  );
}

export function ShopContact({ shop }: { shop: PublicShop }) {
  const c = shop.contact;
  const place = [c.address, c.city, c.state].filter(Boolean).join(", ");
  const wa = shop.social.whatsapp.replace(/\D/g, "");
  const socials = [
    ["Instagram", shop.social.instagram], ["Facebook", shop.social.facebook], ["TikTok", shop.social.tiktok],
    ...(wa ? [["WhatsApp", `https://wa.me/${wa}`]] : []),
  ].filter(([, url]) => url) as [string, string][];
  const hasPolicies = Object.values(shop.policies).some(Boolean);
  const noContact = !c.email && !c.phone && !place && !socials.length;
  return (
    <ShopShell shop={shop}>
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <h1 className="text-3xl font-semibold" style={{ color: "var(--shop-brand)" }}>Contact {shop.name}</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
          {noContact ? <p>This shop has not added contact details yet.</p> : null}
          <dl className="grid gap-2">
            {place ? <div><dt className="font-medium">Address</dt><dd>{place}</dd></div> : null}
            {c.phone ? <div><dt className="font-medium">Phone</dt><dd><a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="underline">{c.phone}</a></dd></div> : null}
            {c.email ? <div><dt className="font-medium">Email</dt><dd><a href={`mailto:${c.email}`} className="underline">{c.email}</a></dd></div> : null}
          </dl>
          {socials.length ? (
            <ul className="mt-3 flex flex-wrap gap-3">
              {socials.map(([label, url]) => <li key={label}><a href={url} target="_blank" rel="noopener noreferrer" className="font-medium underline">{label}</a></li>)}
            </ul>
          ) : null}
        </div>
        {hasPolicies ? <h2 className="pt-4 text-xl font-semibold" style={{ color: "var(--shop-brand)" }}>Shop policies</h2> : null}
        <Block title="Delivery and collection" text={shop.policies.delivery} />
        <Block title="Payments" text={shop.policies.payment} />
        <Block title="Returns" text={shop.policies.returns} />
        <Block title="Alterations" text={shop.policies.alterations} />
      </div>
    </ShopShell>
  );
}
