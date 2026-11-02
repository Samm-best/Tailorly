import type { Metadata } from "next";
import Link from "next/link";
import { ctaPrimary, InfoCard, MarketingShell, PageHeading, Section } from "@/components/site";
import { requireRootPage } from "@/lib/page-context";

export const metadata: Metadata = { title: "For tailors", description: "Open your own branded tailoring shop online with Tailorly." };

export default async function ForTailorsPage() {
  await requireRootPage();
  return (
    <MarketingShell>
      <PageHeading eyebrow="For tailors and fashion designers" title="Your own shop, without building a website" intro="Tailorly gives each tailoring business its own branded online shop, catalogue and customer relationships." />
      <Section>
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard title="Your brand">Your own address, name, logo and colours. Customers see your shop, not ours.</InfoCard>
          <InfoCard title="Your catalogue">Photos, prices, sizes, colours, fabrics and stock for every product and service.</InfoCard>
          <InfoCard title="Your data stays yours">Products, customers, orders and staff are kept separate from every other shop.</InfoCard>
          <InfoCard title="Built for sewing work">Custom requests, quotes, measurements and production stages are on the roadmap.</InfoCard>
        </div>
      </Section>
      <Section>
        <p className="mb-4 text-sm text-slate-600">Shop applications are opening gradually. Leave your details and the Tailorly team will contact you. Plans and pricing have not been announced yet.</p>
        <Link href="/contact?topic=shop_interest" className={ctaPrimary}>Tell us about your shop</Link>
      </Section>
    </MarketingShell>
  );
}
