"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, BrandMark } from "@/components/ui";
import { api } from "@/lib/client-api";

type Overview = { totals: { tenants: number; users: number; products: number; orders: number }; recentTenants: { id: string; name: string; slug: string; status: string; createdAt: string }[] };

export default function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<Overview>("/api/v1/platform/overview").then((result) => {
      if (result.ok) setData(result.data);
      else if (result.error.code === "UNAUTHENTICATED") window.location.assign("/login?next=/admin");
      else setError(result.error.message);
    });
  }, []);
  if (error) return <main className="mx-auto max-w-md px-4 py-16"><Alert kind="error">{error}</Alert></main>;
  if (!data) return <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 px-4 py-16 text-center text-sm text-slate-600"><BrandMark /><span>Loading platform dashboard...</span></main>;
  return <div className="min-h-screen bg-[#f5f9fe]"><aside className="fixed inset-y-0 hidden w-64 bg-gradient-to-b from-[#06275b] to-[#0b438d] p-5 text-white lg:block"><BrandMark light /><p className="mt-1 text-xs text-blue-100">Platform administration</p><nav className="mt-10 grid gap-2">{["Dashboard", "All Tenants (Shops)", "Users & Roles", "Platform Admins", "Orders & Revenue", "Analytics & Reports", "Site Customization", "Support & Tickets", "System Settings"].map((item, index) => <Link key={item} href={index === 0 ? "/admin" : "#"} className={`dashboard-admin-link rounded-lg px-3 py-3 text-sm ${index === 0 ? "dashboard-admin-active font-semibold" : "text-blue-50 hover:bg-white/10"}`}>{item}</Link>)}</nav></aside><main className="lg:ml-64"><header className="dashboard-header border-t-4 border-cyan border-b border-slate-200 bg-white px-4 py-5 sm:px-8"><div className="mx-auto max-w-7xl">  <BrandMark className="lg:hidden" /><p className="mt-4 text-2xl font-semibold text-navy sm:text-3xl">Good morning, Super Admin! 👑</p><p className="mt-1 text-sm text-slate-600">Here&apos;s what&apos;s happening across the Tailorly platform today.</p></div></header><div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total Tenants (Shops)" value={data.totals.tenants} icon="▣" /><Metric label="Total Users" value={data.totals.users} icon="♧" /><Metric label="Published Products" value={data.totals.products} icon="₦" /><Metric label="Total Orders" value={data.totals.orders} icon="▤" /></section><div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-navy">Recent Tenants</h2>{data.recentTenants.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3">Shop</th><th className="pb-3">Slug</th><th className="pb-3">Status</th><th className="pb-3">Joined</th></tr></thead><tbody className="divide-y divide-slate-100">{data.recentTenants.map((tenant) => <tr key={tenant.id}><td className="py-3 font-medium text-navy">{tenant.name}</td><td className="py-3 text-slate-500">{tenant.slug}</td><td className="py-3 capitalize">{tenant.status.replace("_", " ")}</td><td className="py-3 text-slate-500">{new Date(tenant.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <p className="py-8 text-sm text-slate-500">No tenants have been created yet.</p>}</section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-navy">Quick Actions</h2><div className="mt-4 grid gap-3"><Link href="/get-started" className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-navy hover:bg-cyan/10">Add New Tenant →</Link><Link href="/shops" className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-navy hover:bg-cyan/10">View All Shops →</Link><Link href="/contact" className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-navy hover:bg-cyan/10">Support & Tickets →</Link></div></section></div></div></main></div>;
}

function Metric({ label, value, icon }: { label: string; value: number; icon: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan/15 text-lg font-bold text-navy">{icon}</span><p className="mt-4 text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-navy">{value.toLocaleString()}</p></div>;
}
