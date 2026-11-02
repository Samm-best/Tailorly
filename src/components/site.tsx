import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BrandMark } from "@/components/ui";
import { AppearanceControl } from "@/components/theme";
import { resolveTheme } from "@/storefront/branding";
import type { PublicShop } from "@/storefront/serialize";

const cta = "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0";
export const ctaPrimary = `${cta} bg-navy text-white hover:bg-navy-dark`;
export const ctaGhost = `${cta} border border-slate-300 text-slate-800 hover:bg-slate-50`;

const MAIN_NAV = [
  { href: "/shops", label: "Explore Shops" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-tailors", label: "For tailors" },
  { href: "/features", label: "Features" },
  { href: "/faq", label: "FAQ" },
];

const socialLinks = [
  { label: "Facebook", short: "f", href: "https://www.facebook.com/profile.php?id=100084962060976" },
  { label: "TikTok", short: "♪", href: "https://vm.tiktok.com/ZS9yfppPt1ma8-gQy6h/" },
  { label: "X", short: "𝕏", href: "https://x.com/sammybest2025" },
  { label: "GitHub", short: "⌘", href: "https://github.com/Samm-best" },
];

/** Frame for every page on the main Tailorly website (root domain). */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="marketing-header sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <BrandMark className="shrink-0" />
          <nav aria-label="Main" className="relative z-40 hidden flex-wrap gap-1 text-sm md:flex">
            {MAIN_NAV.map((n) => (
              <Link key={n.href} href={n.href} className="nav-link whitespace-nowrap rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-navy">{n.label}</Link>
            ))}
            <details className="relative">
              <summary className="cursor-pointer list-none whitespace-nowrap rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-navy">About <span aria-hidden="true">⌄</span></summary>
              <div className="absolute left-0 top-full z-50 mt-1 min-w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <Link href="/about" className="block rounded-lg px-3 py-2 hover:bg-cyan/10 hover:text-navy">About Tailorly</Link>
                <Link href="/about/founder" className="block rounded-lg px-3 py-2 hover:bg-cyan/10 hover:text-navy">Meet the Founder</Link>
              </div>
            </details>
          </nav>
          <details className="mobile-nav relative z-50 shrink-0 md:hidden">
            <summary aria-label="Open navigation menu" className="mobile-nav-trigger inline-flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border-2 border-navy bg-white text-navy shadow-sm transition hover:border-cyan hover:bg-cyan/10 [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Open navigation menu</span><span aria-hidden="true" className="text-xl leading-none">☰</span>
            </summary>
            <div className="mobile-nav-menu absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-xl">
              {MAIN_NAV.map((n) => <Link key={n.href} href={n.href} className="block rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-cyan/10 hover:text-navy">{n.label}</Link>)}
              <div className="my-1 border-t border-slate-100" />
              <Link href="/about" className="block rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-cyan/10 hover:text-navy">About Tailorly</Link>
              <Link href="/about/founder" className="block rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-cyan/10 hover:text-navy">Meet the Founder</Link>
            </div>
          </details>
          <div className="header-actions flex shrink-0 items-center gap-1.5 sm:gap-2">
            <AppearanceControl compact />
            <Link href="/login" className={`${ctaGhost} header-action`}>Sign in</Link>
            <Link href="/get-started" className={`${ctaPrimary} header-action`}>Get started</Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="relative overflow-hidden bg-navy text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandMark light />
            <p className="mt-4 max-w-xs text-sm leading-6 text-blue-100">Your Tailoring Business, Digitally Connected.</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-blue-100/80">Discover trusted fashion designers, explore unique styles, order custom-made outfits and connect with talented tailors — all in one place.</p>
          </div>
          <FooterColumn title="Explore Tailorly" links={[
            ["/", "Home"], ["/shops", "Explore Shops"], ["/shops", "Discover Designs"], ["/how-it-works", "How It Works"], ["/faq", "FAQs"],
          ]} />
          <FooterColumn title="About" links={[["/about", "About Tailorly"], ["/about/founder", "Meet the Founder"], ["/for-tailors", "Create Your Shop"], ["/get-started", "Become a Tailorly Partner"], ["/login", "Shop Owner Login"]]} />
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan">Customer Support</h2>
            <div className="mt-4 grid gap-2 text-sm text-blue-100">
              <Link href="/contact" className="hover:text-cyan">Help Centre & Contact Us</Link>
              <Link href="/account/orders" className="hover:text-cyan">Track Your Order</Link>
              <Link href="/faq" className="hover:text-cyan">Frequently Asked Questions</Link>
              <a href="https://wa.me/2347031830569" target="_blank" rel="noopener noreferrer" className="hover:text-cyan">WhatsApp Support</a>
              <a href="tel:+2347031830569" className="hover:text-cyan">+234 703 183 0569</a>
            </div>
            <div className="mt-6 flex gap-2">
              {socialLinks.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-sm font-semibold transition hover:border-cyan hover:bg-cyan hover:text-navy">{social.short}</a>)}
            </div>
          </div>
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-blue-100 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 Tailorly. All Rights Reserved.</span>
            <span>Powered by <a href="https://sammynex.netlify.app/" target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-cyan">SammyNex Technology</a></span>
          </div>
        </div>
      </footer>
      <a href="https://wa.me/2347031830569" target="_blank" rel="noopener noreferrer" aria-label="Chat with Tailorly on WhatsApp" className="whatsapp-float fixed bottom-4 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-white transition hover:scale-105 sm:bottom-5 sm:right-5">
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="currentColor"><path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5Zm0 17.2a7.6 7.6 0 0 1-3.9-1.1l-.3-.2-2.8.8.8-2.7-.2-.3A7.6 7.6 0 1 1 12 19.7Zm4.2-5.7c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.6.1l-.7.9c-.1.1-.3.2-.5.1a6.1 6.1 0 0 1-3.1-2.7c-.2-.3 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.6c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.1s.9 2.4 1 2.5a9.3 9.3 0 0 0 3.6 3.4c1.3.6 1.8.7 2.1.7.3 0 1.1-.4 1.3-.8.2-.4.2-.8.2-.8s-.2-.1-.4-.2Z" /></svg>
      </a>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return <div><h2 className="text-sm font-semibold uppercase tracking-wider text-cyan">{title}</h2><nav aria-label={title} className="mt-4 grid gap-2 text-sm text-blue-100">{links.map(([href, label]) => <Link key={href + label} href={href} className="hover:text-cyan">{label}</Link>)}</nav></div>;
}

export function PageHeading({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <section className="bg-gradient-to-b from-cyan/10 via-white to-transparent">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-cyan-dark">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-semibold text-navy sm:text-4xl">{title}</h1>
        {intro ? <p className="mt-4 max-w-2xl text-lg text-slate-600">{intro}</p> : null}
      </div>
    </section>
  );
}

export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      {title ? <h2 className="mb-4 text-xl font-semibold text-navy">{title}</h2> : null}
      {children}
    </section>
  );
}

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fashion-card fashion-card--soft p-5">
      <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan/15 text-sm font-bold text-navy">✦</span>
      <h3 className="font-semibold text-navy">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
    </div>
  );
}

/* ---------------- shop storefront shell ---------------- */

const SHOP_NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function shopThemeStyle(shop: Pick<PublicShop, "brandColor" | "accentColor">): CSSProperties {
  const t = resolveTheme({ brandColor: shop.brandColor, accentColor: shop.accentColor });
  return {
    "--shop-brand": t.brand, "--shop-accent": t.accent, "--shop-on-brand": t.onBrand, "--shop-on-accent": t.onAccent,
  } as CSSProperties;
}

export function ShopLogo({ shop, size = 40 }: { shop: Pick<PublicShop, "name" | "logoUrl">; size?: number }) {
  if (shop.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={shop.logoUrl} alt={`${shop.name} logo`} width={size} height={size} className="image-motion rounded-lg object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span aria-hidden="true" className="inline-flex items-center justify-center rounded-lg text-base font-bold" style={{ width: size, height: size, background: "var(--shop-accent)", color: "var(--shop-on-accent)" }}>
      {shop.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Frame for every page on a shop address. Shop colours only change this shell, never the Tailorly platform pages. */
export function ShopShell({ shop, children }: { shop: PublicShop; children: ReactNode }) {
  const whatsapp = shop.social.whatsapp.replace(/\D/g, "");
  return (
    <div className="flex min-h-screen flex-col" style={shopThemeStyle(shop)}>
      <div className="hidden bg-[var(--shop-brand)] px-4 py-2 text-center text-xs font-medium text-white sm:block">Welcome to {shop.name} — {shop.tagline || "Your style, our craft."}</div>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="inline-flex items-center gap-3 font-semibold">
            <ShopLogo shop={shop} />
            <span className="text-lg text-[var(--shop-brand)]">{shop.name}</span>
          </Link>
          <nav aria-label="Shop" className="order-3 flex w-full flex-wrap gap-1 text-sm md:order-none md:w-auto">
            {SHOP_NAV.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-[var(--shop-brand)]">{n.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <AppearanceControl compact />
            <Link href="/login" className="hidden min-h-11 items-center rounded-lg border border-slate-300 px-4 font-semibold text-slate-700 hover:bg-slate-50 sm:inline-flex">Sign in</Link>
            <Link href="/cart" className="inline-flex min-h-11 items-center rounded-lg px-4 font-semibold text-[var(--shop-brand)] hover:bg-slate-100">Cart</Link>
            <Link href="/account" className="inline-flex min-h-11 items-center rounded-lg px-4 font-semibold" style={{ background: "var(--shop-brand)", color: "var(--shop-on-brand)" }}>Account</Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      {whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={`Chat with ${shop.name} on WhatsApp`} className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-2xl text-white shadow-lg ring-4 ring-white transition hover:scale-105">⌕</a> : null}
      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <span>{shop.name}{shop.contact.city ? ` - ${shop.contact.city}` : ""}</span>
          <span>Powered by Tailorly</span>
        </div>
      </footer>
    </div>
  );
}

export function Pagination({ page, total, pageSize, hrefFor }: { page: number; total: number; pageSize: number; hrefFor: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3 text-sm">
      {page > 1 ? <Link href={hrefFor(page - 1)} className={ctaGhost}>Previous</Link> : null}
      <span className="text-slate-600">Page {page} of {pages}</span>
      {page < pages ? <Link href={hrefFor(page + 1)} className={ctaGhost}>Next</Link> : null}
    </nav>
  );
}
