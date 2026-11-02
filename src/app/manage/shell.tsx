"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui";
import { AppearanceControl } from "@/components/theme";
import { api } from "@/lib/client-api";

type Shop = { name: string; slug: string };
type Access = { shop: Shop; role: string; permissions: string[]; emailVerified: boolean };

/** Friendly gate only. The real enforcement is on the server: every /api/v1/shop/* route checks membership and role for this shop. */
export function ManageShell({ title, children }: { title: string; children: ReactNode }) {
  const [state, setState] = useState<{ status: "loading" } | { status: "denied"; message: string } | { status: "ok"; access: Access }>({ status: "loading" });

  useEffect(() => {
    Promise.all([api<Omit<Access, "emailVerified">>("/api/v1/shop/profile"), api<{ user: { emailVerified: boolean } }>("/api/v1/auth/me")]).then(([r, me]) => {
      if (r.ok && r.data.shop) setState({ status: "ok", access: { ...r.data, emailVerified: me.ok && me.data.user.emailVerified } });
      else if (!r.ok && r.error.code === "UNAUTHENTICATED") window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      else if (!r.ok && r.error.code === "NOT_FOUND") setState({ status: "denied", message: "Shop management is only available on a shop address, for example yourshop.tailorly.com/manage." });
      else setState({ status: "denied", message: r.ok ? "Shop not found." : r.error.message });
    });
  }, []);

  if (state.status === "loading") return <main className="mx-auto max-w-4xl px-4 py-16 text-sm text-slate-600">Loading...</main>;
  if (state.status === "denied") return <main className="mx-auto max-w-md px-4 py-16"><Alert kind="error">{state.message}</Alert><p className="mt-4 text-sm"><Link href="/" className="underline">Back to the shop</Link></p></main>;

  const can = (permission: string) => state.access.role === "owner" || state.access.permissions.includes(permission);
  const nav = [
    ["/manage", "Overview", "orders.manage"],
    ["/manage/products", "Products", "catalogue.manage"],
    ["/manage/categories", "Categories", "catalogue.manage"],
    ["/manage/production", "Production", "production.view"],
    ["/manage/operations", "Operations", "orders.manage"],
    ["/manage/staff", "Staff", "staff.manage"],
    ["/manage/profile", "Storefront", "shop.manage"],
  ].filter((item) => can(item[2]));
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-dark">Shop management</p>
          <h1 className="text-2xl font-semibold text-navy">{state.access.shop.name}: {title}</h1>
        </div>
        <div className="flex items-center gap-2"><AppearanceControl compact /><Link href="/" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-navy transition hover:border-cyan">View storefront</Link></div>
      </header>
      <nav aria-label="Manage" className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {nav.map(([h, l], index) => <Link key={h} href={h} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition hover:bg-cyan/10 hover:text-navy ${index === 0 ? "bg-cyan/10 text-navy" : "text-slate-700"}`}>{l}</Link>)}
      </nav>
      {!state.access.emailVerified ? <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"><p className="text-sm"><strong>Email not verified.</strong> Verify your account before sensitive shop actions.</p><Link href="/account/profile" className="text-sm font-semibold underline">Verify email</Link></div> : null}
      {children}
    </div>
  );
}
