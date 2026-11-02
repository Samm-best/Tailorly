import type { Metadata } from "next";
import Link from "next/link";
import { ctaGhost, ctaPrimary, InfoCard, MarketingShell, Section } from "@/components/site";
import { listFeaturedProducts, listPublicCategories } from "@/catalogue/service";
import { getPageContext } from "@/lib/page-context";
import { FASHION_MEDIA } from "@/site/media";
import { ShopHome } from "./shop-pages";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getPageContext();
  if (ctx.kind === "shop") {
    return { title: ctx.shop.name, description: ctx.shop.tagline || ctx.shop.description.slice(0, 150) || `Shop at ${ctx.shop.name}` };
  }
  return { title: "Tailorly - Discover Tailors. Find Your Style. Get It Made.", description: "One Tailorly account, many independent tailoring shops." };
}

export default async function Home() {
  const ctx = await getPageContext();
  if (ctx.kind === "shop") {
    const [featured, categories] = await Promise.all([listFeaturedProducts(ctx.shop.id), listPublicCategories(ctx.shop.id)]);
    return <ShopHome shop={ctx.shop} featured={featured} categories={categories} />;
  }
  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#eefbfc] via-white to-[#edf3ff]">
        <div className="hero-glow animate-pulse-glow -left-24 top-12" aria-hidden="true" />
        <div className="hero-glow animate-pulse-glow -right-32 bottom-0 bg-navy" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:py-24 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative z-10 animate-rise-in">
            <span className="inline-flex rounded-full bg-cyan/15 px-4 py-2 text-sm font-semibold text-navy">Nigerian fashion. Digitally connected.</span>
            <h1 aria-label="Discover Tailors. Find Your Style. Get It Made." className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-navy sm:text-6xl">Discover tailors.<br /><span className="text-cyan-dark">Find your style.</span><br />Get it made.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Explore trusted tailors, request custom designs, track your orders and experience premium fashion from independent businesses.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shops" className={ctaPrimary}>Explore Shops</Link>
            <Link href="/for-tailors" className={ctaGhost}>Create Your Shop</Link>
          </div>
          </div>
          <div className="fashion-card animate-rise-in-delay animate-float relative z-10 min-h-72 overflow-hidden border-0 bg-navy p-3 shadow-2xl sm:min-h-[30rem]">
            <img src={FASHION_MEDIA.hero} alt="Nigerian fashion market showcase" className="image-motion h-full min-h-72 w-full rounded-[1.35rem] object-cover opacity-90 sm:min-h-[29rem]" />
            <div className="absolute inset-3 rounded-[1.35rem] bg-gradient-to-t from-navy via-navy/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 text-white"><p className="text-sm font-semibold uppercase tracking-wider text-cyan-100">From Lagos studios to your wardrobe.</p><p className="mt-3 text-3xl font-semibold">Designed here. Made for you.</p><p className="mt-2 max-w-md text-sm leading-6 text-blue-100">Meet independent Nigerian designers creating modern native looks, occasionwear and everyday pieces.</p></div>
          </div>
        </div>
      </section>
      <Section title="Why Tailorly"><div className="animate-stagger grid gap-4 sm:grid-cols-3"><InfoCard title="Discover">Explore independent fashion businesses and find a style that feels like you.</InfoCard><InfoCard title="Request">Connect with tailors for custom-made outfits and share your requirements securely.</InfoCard><InfoCard title="Stay in control">Manage orders, measurements and sewing progress from one account.</InfoCard></div></Section>
      <section className="fashion-panel">
        <Section title="Style that feels like you">
          <div className="animate-stagger grid gap-5 md:grid-cols-3">
            {FASHION_MEDIA.styleCards.map(({ src: image, alt }, index) => {
              const copy = [
                ["Ankara statement looks", "Bold prints, fitted silhouettes and expressive colour for standout everyday style."],
                ["Modern native tailoring", "Clean senator styles, agbada-inspired layers and sharp contemporary cuts."],
                ["Sky-blue occasionwear", "Polished native silhouettes with a calm, modern finish for celebrations."],
                ["Contemporary statement dresses", "Confident colour, sculptural detail and expressive silhouettes for special moments."],
                ["Runway colour and texture", "Discover bold fabrics and considered details from Nigeria’s emerging fashion scene."],
                ["Bespoke fitting", "Work directly with a tailor to shape the fabric, fit and finish around you."],
              ][index];
              return (
              <article key={alt} className="fashion-card fashion-card--soft interactive-lift group">
                <img src={image} alt={alt} className="image-motion fashion-image h-56 w-full object-cover" />
                <div className="p-5"><h3 className="text-lg font-semibold text-navy">{copy[0]}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy[1]}</p></div>
              </article>
              );
            })}
          </div>
        </Section>
      </section>
      <section className="bg-[#f3f8fc]"><Section title="How Tailorly works"><div className="animate-stagger grid gap-4 sm:grid-cols-5">{["Discover a shop", "Explore designs", "Request your look", "Pay securely", "Track progress"].map((step, index) => <div key={step} className="fashion-step interactive-lift rounded-2xl border p-4 text-center"><span className="mx-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan font-semibold text-navy shadow-sm">{index + 1}</span><p className="mt-3 text-sm font-semibold text-navy">{step}</p></div>)}</div></Section></section>
      <Section><div className="grid gap-5 md:grid-cols-2"><div className="relative overflow-hidden rounded-[1.5rem] bg-navy p-7 text-white shadow-xl shadow-navy/10"><div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan/25 blur-2xl" /><h2 className="relative text-2xl font-semibold">For Customers</h2><p className="relative mt-2 text-blue-100">Find trusted tailors, request custom designs and track your orders.</p><Link href="/shops" className={`${ctaGhost} relative mt-6 border-white/30 text-white hover:bg-white/10`}>Start Shopping</Link></div><div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-cyan/20 to-[#fff0e8] p-7 text-navy shadow-xl shadow-cyan/10"><div className="absolute -bottom-12 -right-8 h-40 w-40 rounded-full border-[18px] border-white/40" /><h2 className="relative text-2xl font-semibold">For Tailors & Shop Owners</h2><p className="relative mt-2 text-slate-700">Create your online presence and grow your business with Tailorly.</p><Link href="/get-started" className={`${ctaPrimary} relative mt-6`}>Create Your Shop</Link></div></div></Section>
    </MarketingShell>
  );
}
