import { MarketingShell, PageHeading, Section } from "@/components/site";

export default function TermsPage() {
  return <MarketingShell><PageHeading eyebrow="Tailorly" title="Terms of service" intro="The terms that guide your use of Tailorly." /><Section><div className="space-y-5 text-sm leading-7 text-slate-600"><p>Tailorly connects customers with independent tailoring businesses. Shop owners remain responsible for their own products, prices, fulfilment and policies.</p><p>Use accurate account information, keep your password private, and do not misuse the platform or another person's data.</p></div></Section></MarketingShell>;
}
