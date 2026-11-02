import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, PageHeading, Section } from "@/components/site";
import { requireRootPage } from "@/lib/page-context";

export const metadata: Metadata = { title: "FAQ & help centre", description: "Answers to common questions about Tailorly accounts, shops and privacy." };

const faqs: [string, string][] = [
  ["Do I need a different account for each tailor?", "No. One Tailorly account works on every shop. Each shop only sees your activity with that shop."],
  ["Will one shop see my orders with another shop?", "No. Orders, messages and payments belong to the shop where they were made."],
  ["Who can see my measurements?", "Measurements belong to you. Sharing them with a shop is explicit and limited to that shop."],
  ["How do I open a shop on Tailorly?", "Shop applications are opening gradually. Use the form on the For Tailors page to tell us about your business."],
  ["How much does it cost?", "Plans and pricing have not been announced yet."],
  ["Can I buy things yet?", "Yes. On a shop storefront, add a published design to your cart and continue to secure Paystack checkout."],
  ["I did not get my verification email.", "Check your spam folder, then use the resend option on the sign-in page. If it still does not arrive, contact us."],
];

export default async function FaqPage() {
  await requireRootPage();
  return (
    <MarketingShell>
      <PageHeading eyebrow="Help centre" title="Frequently asked questions" />
      <Section>
        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {faqs.map(([q, a]) => (
            <details key={q} className="group p-4">
              <summary className="cursor-pointer list-none font-medium text-navy marker:hidden">{q}</summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-600">Still stuck? <Link href="/contact?topic=support" className="font-medium text-navy underline">Contact support</Link>.</p>
      </Section>
    </MarketingShell>
  );
}
