import type { Metadata } from "next";
import Link from "next/link";
import { ctaGhost, ctaPrimary, InfoCard, MarketingShell, PageHeading, Section } from "@/components/site";
import { requireRootPage } from "@/lib/page-context";

export const metadata: Metadata = { title: "Get started", description: "Create a Tailorly account or tell us about your tailoring shop." };

export default async function GetStartedPage() {
  await requireRootPage();
  return (
    <MarketingShell>
      <PageHeading eyebrow="Get started" title="How would you like to use Tailorly?" />
      <Section>
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard title="I want to find a tailor">
            <p>Create a free account and browse independent tailoring shops.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/register" className={ctaPrimary}>Create account</Link>
              <Link href="/shops" className={ctaGhost}>Explore shops</Link>
            </div>
          </InfoCard>
          <InfoCard title="I am a tailor or designer">
            <p>Shop applications are opening gradually. Tell us about your business and we will be in touch.</p>
            <div className="mt-4"><Link href="/contact?topic=shop_interest" className={ctaPrimary}>Create your shop</Link></div>
          </InfoCard>
        </div>
      </Section>
    </MarketingShell>
  );
}
