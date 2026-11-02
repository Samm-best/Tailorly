import type { Metadata } from "next";
import { MarketingShell, PageHeading, Section } from "@/components/site";
import { getPageContext } from "@/lib/page-context";
import { ShopContact } from "../shop-pages";
import { ContactForm } from "./contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getPageContext();
  return ctx.kind === "shop" ? { title: `Contact ${ctx.shop.name}` } : { title: "Contact Tailorly", description: "Get in touch with the Tailorly team." };
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const ctx = await getPageContext();
  if (ctx.kind === "shop") return <ShopContact shop={ctx.shop} />;
  const { topic } = await searchParams;
  const initial = topic === "support" || topic === "shop_interest" ? topic : "general";
  return (
    <MarketingShell>
      <PageHeading eyebrow="Contact us" title="Talk to the Tailorly team" intro="Questions, support or interested in opening a shop? Send us a message." />
      <Section><div className="max-w-xl"><ContactForm initialTopic={initial} /></div></Section>
    </MarketingShell>
  );
}
