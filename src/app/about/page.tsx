import type { Metadata } from "next";
import Link from "next/link";
import { ctaGhost, ctaPrimary, InfoCard, MarketingShell, PageHeading, Section } from "@/components/site";
import { getPageContext } from "@/lib/page-context";
import { ShopAbout } from "../shop-pages";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getPageContext();
  return ctx.kind === "shop"
    ? { title: `About ${ctx.shop.name}`, description: ctx.shop.tagline || ctx.shop.description.slice(0, 150) || `About ${ctx.shop.name}` }
    : { title: "About Tailorly", description: "Tailorly helps independent tailors and fashion designers run their business online." };
}

export default async function AboutPage() {
  const ctx = await getPageContext();
  if (ctx.kind === "shop") return <ShopAbout shop={ctx.shop} />;
  return (
    <MarketingShell>
      <PageHeading eyebrow="About Tailorly" title="Your Tailoring Business, Digitally Connected." intro="Tailorly is a fashion and tailoring marketplace designed to bring customers and fashion professionals together through one convenient digital platform." />
      <Section><div className="space-y-4 text-slate-600 leading-7"><p>We make it easier for customers to discover fashion designers, explore available designs, request custom-made outfits and manage their tailoring experiences.</p><p>At the same time, Tailorly gives tailors and fashion business owners the opportunity to establish their online presence, showcase their work, connect with customers and manage their businesses digitally.</p></div></Section>
      <Section title="Our mission and vision"><div className="grid gap-4 sm:grid-cols-2"><InfoCard title="Our mission">To make discovering, accessing and managing tailoring services easier through technology while creating more opportunities for fashion professionals to grow their businesses.</InfoCard><InfoCard title="Our vision">To become a trusted digital destination connecting customers and fashion professionals across communities and beyond.</InfoCard></div></Section>
      <Section title="What Tailorly offers"><div className="grid gap-3 sm:grid-cols-2"><InfoCard title="For customers">Discover fashion shops, browse designs, request custom-made outfits, connect with tailors, manage orders, track sewing progress and save measurements securely.</InfoCard><InfoCard title="For businesses">Establish a digital storefront, showcase designs, communicate with customers and use organized tools to manage business operations.</InfoCard></div></Section>
      <Section title="Our values"><div className="flex flex-wrap gap-2">{["Trust and transparency", "Quality and craftsmanship", "Innovation through technology", "Customer experience", "Business growth", "Privacy and security"].map((value) => <span key={value} className="rounded-full bg-cyan/10 px-4 py-2 text-sm font-medium text-navy">{value}</span>)}</div></Section>
      <section className="bg-navy"><div className="mx-auto max-w-4xl px-4 py-12 text-center text-white"><h2 className="text-2xl font-semibold sm:text-3xl">Fashion Meets Technology.</h2><p className="mx-auto mt-3 max-w-2xl text-blue-100">Explore fashion, connect with talented designers and experience a more convenient way to get your outfits made.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/shops" className={ctaPrimary}>Explore Shops</Link><Link href="/get-started" className={`${ctaGhost} border-white/40 text-white hover:bg-white/10`}>Create Your Shop</Link></div></div></section>
    </MarketingShell>
  );
}
