"use client";

import Link from "next/link";
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { api } from "@/lib/client-api";
import { AppearanceControl } from "@/components/theme";
import { FASHION_MEDIA } from "@/site/media";

export function Button({ variant = "primary", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-navy text-white shadow-sm hover:bg-navy-dark hover:shadow-md",
    ghost: "border border-slate-300 text-slate-800 hover:bg-slate-50",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  }[variant];
  return (
    <button
      {...p}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    />
  );
}

export function Field({ label, error, hint, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = p.id ?? p.name;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-800">{label}</label>
      <input
        {...p}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/30 aria-[invalid=true]:border-red-500"
      />
      {hint && !error ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {error ? <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function Alert({ kind, children }: { kind: "error" | "success" | "info"; children: ReactNode }) {
  const cls = { error: "bg-red-50 text-red-800 border-red-200", success: "bg-emerald-50 text-emerald-800 border-emerald-200", info: "bg-sky-50 text-sky-800 border-sky-200" }[kind];
  return <div role={kind === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>{children}</div>;
}

export function Card({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-navy">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function BrandMark({ light = false }: { light?: boolean } = {}) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 font-semibold ${light ? "text-white" : "text-navy"}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="4" y="4" width="24" height="6" rx="1.5" fill={light ? "#ffffff" : "#173D78"} />
        <rect x="13" y="4" width="6" height="24" rx="1.5" fill={light ? "#ffffff" : "#173D78"} />
        <circle cx="22.5" cy="22" r="2.2" fill="none" stroke="#21B8C9" strokeWidth="1.8" />
        <path d="M22.5 24.2c0 2-2 3-4 2.2" fill="none" stroke="#21B8C9" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      Tailorly
    </Link>
  );
}

/** Shows which shop the visitor is on (from the trusted host) so the context is never ambiguous. */
export function useShopContext() {
  const [shop, setShop] = useState<{ name: string; slug: string } | null>(null);
  useEffect(() => {
    api<{ kind: string; name?: string; slug?: string }>("/api/v1/tenant-context").then((r) => {
      if (r.ok && r.data.kind === "tenant" && r.data.name && r.data.slug) setShop({ name: r.data.name, slug: r.data.slug });
    });
  }, []);
  return shop;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const shop = useShopContext();
  return (
    <main className="auth-page min-h-screen">
      <div className="auth-layout mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="auth-form-side flex flex-col justify-center px-5 py-8 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex items-center justify-between">
              <BrandMark />
              <AppearanceControl compact />
            </div>
            <div className="auth-card animate-rise-in rounded-3xl border p-6 sm:p-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-cyan/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-dark"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan" /> Tailorly account</div>
              {shop ? <p className="mb-4 rounded-xl border border-cyan/20 bg-cyan/10 px-3 py-2 text-sm text-navy">You are on <strong>{shop.name}</strong>. Your Tailorly account works on every shop.</p> : null}
              <h1 className="text-3xl font-semibold tracking-tight text-navy">{title}</h1>
              {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
              <div className="mt-6">{children}</div>
            </div>
            <p className="mt-5 text-center text-xs text-slate-500">By continuing, you agree to our <Link href="/terms" className="font-medium text-navy underline">Terms</Link> and <Link href="/privacy" className="font-medium text-navy underline">Privacy Policy</Link>.</p>
            <p className="mt-3 text-center text-xs text-slate-500">Powered by SammyNex Technology</p>
          </div>
        </section>
        <aside className="auth-showcase relative min-h-[18rem] overflow-hidden lg:min-h-0">
          <img src={FASHION_MEDIA.tailorAtWork} alt="Tailor working in a fashion studio" className="image-motion absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-navy/85 via-navy/35 to-cyan/35" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-16">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">Made in Africa. Made for you.</span>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight xl:text-6xl">Wear your story.</h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-blue-50">Connect with Nigerian designers creating Ankara, Aso-ebi, Agbada and contemporary African fashion.</p>
            <div className="mt-7 flex items-center gap-3 text-sm text-blue-100"><span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40">T</span><span>Tailorly<br /><span className="text-xs text-cyan-100">Your style, beautifully made.</span></span></div>
          </div>
        </aside>
      </div>
    </main>
  );
}
