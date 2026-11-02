import { MarketingShell, PageHeading, Section } from "@/components/site";

export default function PrivacyPage() {
  return <MarketingShell><PageHeading eyebrow="Tailorly" title="Privacy policy" intro="How Tailorly handles account and tailoring information." /><Section><div className="space-y-5 text-sm leading-7 text-slate-600"><p>We use your account details to provide authentication, shop access, orders, messages and support. Your measurements and custom-order details are private by default and are shared with a shop only when you choose to do so.</p><p>Email verification confirms control of an email address. It is not shop approval or identity verification. You can manage basic profile details from your account settings.</p></div></Section></MarketingShell>;
}
