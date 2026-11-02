import type { Metadata } from "next";
import { InfoCard, MarketingShell, PageHeading, Section } from "@/components/site";
import { requireRootPage } from "@/lib/page-context";

export const metadata: Metadata = { title: "Features & benefits", description: "What Tailorly offers customers and tailoring shops, and what is available today." };

const available = [
  ["One account, many shops", "Register once and use the same login on every shop."],
  ["Branded shop pages", "Each shop controls its name, logo, colours, contact details and policies."],
  ["Product catalogue", "Photos, prices, categories, size/colour/fabric variants and stock levels."],
  ["Private by design", "Each shop's records are separated from every other shop."],
  ["Custom orders and quotes", "Submit a custom sewing request, attach approved reference images, and accept a shop quote."],
  ["Measurement Passport", "Keep measurement profiles private and explicitly share them with a specific shop."],
  ["Checkout with Paystack", "Add published designs to your cart, reserve stock, and pay securely with Paystack."],
  ["Production tracking", "Follow sewing stages from order received through quality inspection and delivery."],
  ["Messages and appointments", "Message a shop, request fittings, and receive appointment notifications."],
  ["Delivery tracking", "Follow delivery status and tracking details for your shop order."],
];
const planned = [
  ["Deposits and balances", "Support for staged payments, balances, receipts and reconciliation."],
  ["Real-time communication", "Live Socket.IO updates and provider-backed notifications."],
  ["Staff and reports", "Roles, permissions, inventory and business reports."],
];

export default async function FeaturesPage() {
  await requireRootPage();
  return (
    <MarketingShell>
      <PageHeading eyebrow="Features & benefits" title="What Tailorly does" intro="We list what is working today separately from what is coming, so you always know where things stand." />
      <Section title="Available now">
        <div className="grid gap-4 sm:grid-cols-2">{available.map(([t, d]) => <InfoCard key={t!} title={t!}>{d}</InfoCard>)}</div>
      </Section>
      <Section title="Coming next">
        <div className="grid gap-4 sm:grid-cols-2">{planned.map(([t, d]) => <InfoCard key={t!} title={t!}>{d}</InfoCard>)}</div>
      </Section>
    </MarketingShell>
  );
}
