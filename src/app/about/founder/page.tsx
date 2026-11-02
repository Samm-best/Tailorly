import type { Metadata } from "next";
import Link from "next/link";
import { ctaGhost, ctaPrimary, MarketingShell, Section } from "@/components/site";
import { requireRootPage } from "@/lib/page-context";
import { creator } from "@/site/creator";

export const metadata: Metadata = {
  title: "Meet the Founder",
  description: "Meet Onwe Samuel Onwe, founder of Tailorly and SammyNex Technology.",
};

const socialShort: Record<string, string> = { GitHub: "⌘", Facebook: "f", TikTok: "♪", X: "𝕏" };

export default async function FounderPage() {
  await requireRootPage();
  return (
    <MarketingShell>
      <section className="bg-gradient-to-br from-navy via-[#1d4b91] to-cyan/80 text-white">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 sm:py-20 md:grid-cols-[0.85fr_1.15fr]">
          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border-4 border-white/20 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={creator.photoUrl} alt={creator.name} className="image-motion aspect-[4/5] w-full object-cover object-top" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">Meet the Founder</p>
            <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{creator.name}</h1>
            <p className="mt-4 text-xl text-blue-100">{creator.role}</p>
            <p className="mt-6 max-w-xl leading-7 text-blue-50">Building practical digital solutions that help people discover, connect and grow.</p>
          </div>
        </div>
      </section>
      <Section title="About the founder">
        <div className="grid gap-8 md:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4 leading-7 text-slate-600">{creator.bio.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          <aside className="rounded-2xl border border-cyan/20 bg-cyan/5 p-6"><h2 className="font-semibold text-navy">Professional interests</h2><p className="mt-3 text-sm leading-6 text-slate-600">Technology, practical digital products and creating better ways for people and businesses to connect.</p></aside>
        </div>
      </Section>
      <Section title="A Message from the Founder">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500">The founder&apos;s message will be added here.</div>
      </Section>
      <Section title="More About My Work">
        <div className="rounded-2xl bg-navy p-7 text-white"><p className="max-w-2xl text-blue-100">Explore my technology interests, projects and other digital work through SammyNex Technology.</p><a href={creator.portfolioUrl} target="_blank" rel="noopener noreferrer" className={`${ctaGhost} mt-5 border-white/40 text-white hover:bg-white/10`}>Visit SammyNex Technology</a></div>
      </Section>
      <Section>
        <div className="flex flex-col gap-5 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold text-navy">Sammy — Learn • Build • Grow</p><p className="mt-1 text-sm text-slate-500">Founder of Tailorly | Powered by SammyNex Technology.</p></div>
          <div className="flex gap-2">{creator.socials.map((social) => <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 font-semibold text-navy transition hover:border-cyan hover:bg-cyan hover:text-white">{socialShort[social.label] ?? social.label.slice(0, 1)}</a>)}</div>
        </div>
      </Section>
      <section className="bg-cyan/10"><div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-8"><div><h2 className="text-xl font-semibold text-navy">Discover Tailorly</h2><p className="mt-1 text-sm text-slate-600">Fashion meets technology.</p></div><div className="flex gap-3"><Link href="/shops" className={ctaPrimary}>Explore Shops</Link><Link href="/about" className={ctaGhost}>About Tailorly</Link></div></div></section>
    </MarketingShell>
  );
}
