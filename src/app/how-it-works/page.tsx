import type { Metadata } from "next";
import Link from "next/link";
import { ctaPrimary, InfoCard, MarketingShell, PageHeading, Section } from "@/components/site";
import { requireRootPage } from "@/lib/page-context";

export const metadata: Metadata = { title: "How Tailorly works", description: "How customers and tailoring shops use Tailorly, from sign-up to a finished outfit." };

export default async function HowItWorksPage() {
  await requireRootPage();
  return (
    <MarketingShell>
      <PageHeading eyebrow="How it works" title="From idea to finished outfit" intro="Tailorly connects customers with independent tailors. Each shop has its own branded page, catalogue and orders." />
      <Section title="For customers">
        <ol className="grid gap-4 sm:grid-cols-2">
          <li><InfoCard title="1. Create one account">One Tailorly account works on every shop. Verify your email and you are ready.</InfoCard></li>
          <li><InfoCard title="2. Find a shop">Browse the shop directory or open a tailor&apos;s own address.</InfoCard></li>
          <li><InfoCard title="3. Choose a design">Pick a ready-made piece, add it to your cart, or send the shop a custom sewing request.</InfoCard></li>
          <li><InfoCard title="4. Track your order">Follow progress from cutting to collection, receive updates, schedule fittings and coordinate delivery.</InfoCard></li>
        </ol>
      </Section>
      <Section title="For tailors and designers">
        <ol className="grid gap-4 sm:grid-cols-2">
          <li><InfoCard title="1. Open your shop">Get your own address such as yourshop.tailorly.com with your name, logo and colours.</InfoCard></li>
          <li><InfoCard title="2. Add your work">List products with photos, sizes, colours, fabrics and stock.</InfoCard></li>
          <li><InfoCard title="3. Receive orders">Customers order from your page. Your data stays separate from every other shop.</InfoCard></li>
          <li><InfoCard title="4. Run the business">Track production stages, communicate with customers, schedule fittings and coordinate delivery from your shop workspace.</InfoCard></li>
        </ol>
      </Section>
      <Section><Link href="/get-started" className={ctaPrimary}>Get started</Link></Section>
    </MarketingShell>
  );
}
