"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui";
import { api } from "@/lib/client-api";
import { formatNaira } from "@/catalogue/money";
import { ManageShell } from "./shell";
import { ImageRotator } from "@/components/image-rotator";
import { FASHION_MEDIA } from "@/site/media";

type Product = { id: string; name: string; basePrice: number; status: string };
type Order = { id: string; total: number; status: string; items: { name: string }[] };
type Job = { id: string; stage: string };

export default function ManageHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([
      api<{ items: Product[] }>("/api/v1/shop/products?page=1"),
      api<{ orders: Order[] }>("/api/v1/shop/orders/manage"),
      api<{ jobs: Job[] }>("/api/v1/shop/production"),
    ]).then(([productResult, orderResult, jobResult]) => {
      if (productResult.ok) setProducts(productResult.data.items);
      if (orderResult.ok) setOrders(orderResult.data.orders);
      if (jobResult.ok) setJobs(jobResult.data.jobs);
      const failed = [productResult, orderResult, jobResult].find((result) => !result.ok);
      if (failed && !failed.ok) setError(failed.error.message);
    }).catch(() => setError("Could not load shop metrics."));
  }, []);
  const revenue = orders.filter((order) => order.status === "paid" || order.status === "processing" || order.status === "completed").reduce((sum, order) => sum + order.total, 0);
  return (
    <ManageShell title="Dashboard">
      {error ? <Alert kind="error">{error}</Alert> : null}
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-navy text-white shadow-xl shadow-navy/10">
        <ImageRotator images={FASHION_MEDIA.shopDashboard} label="Shop management inspiration" className="absolute inset-y-0 right-0 hidden w-2/5 sm:block" imageClassName="h-full w-full object-cover opacity-[0.45]" />
        <div className="relative z-10 max-w-xl px-6 py-7 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Your craft, beautifully presented</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Build a storefront customers remember.</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-blue-100">Keep your catalogue, orders and production work moving while Tailorly gives your business a polished digital presence.</p>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Products" value={products.length} icon="▣" />
        <Metric label="Total Orders" value={orders.length} icon="▤" />
        <Metric label="Revenue" value={formatNaira(revenue)} icon="₦" />
        <Metric label="In Production" value={jobs.length} icon="✂" />
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-navy">Recent Orders</h2><Link href="/manage/operations" className="text-sm font-semibold text-cyan-dark">View all →</Link></div>{orders.length ? <div className="mt-4 divide-y divide-slate-100">{orders.slice(0, 6).map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p className="font-medium text-navy">{order.items[0]?.name ?? "Order"}</p><p className="text-xs text-slate-500">{formatNaira(order.total)}</p></div><span className="rounded-full bg-cyan/10 px-3 py-1 text-xs capitalize text-cyan-dark">{order.status.replaceAll("_", " ")}</span></div>)}</div> : <Empty text="No orders yet. Orders will appear here after customers check out." />}</section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-navy">Quick Actions</h2><div className="mt-4 grid gap-3"><Action href="/manage/products/new" label="Add New Product" /><Action href="/manage/products" label="Manage Products" /><Action href="/manage/production" label="View Production" /><Action href="/manage/profile" label="Edit Storefront" /></div></section>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-navy">Top Products</h2>{products.length ? <div className="mt-4 divide-y divide-slate-100">{products.slice(0, 5).map((product) => <div key={product.id} className="flex items-center justify-between py-3 text-sm"><span>{product.name}</span><span className="font-semibold text-navy">{formatNaira(product.basePrice)}</span></div>)}</div> : <Empty text="Add products to start building your catalogue." />}</section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-navy">Production Overview</h2>{jobs.length ? <div className="mt-4 divide-y divide-slate-100">{jobs.slice(0, 5).map((job) => <div key={job.id} className="flex items-center justify-between py-3 text-sm"><span>Job {job.id.slice(-6)}</span><span className="capitalize text-slate-500">{job.stage.replaceAll("_", " ")}</span></div>)}</div> : <Empty text="Production jobs created from paid orders will appear here." />}</section></div>
    </ManageShell>
  );
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan/15 text-lg font-bold text-navy">{icon}</span><p className="mt-4 text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-navy">{value}</p></div>;
}
function Action({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-navy hover:bg-cyan/10">{label}<span>›</span></Link>;
}
function Empty({ text }: { text: string }) {
  return <p className="py-8 text-sm text-slate-500">{text}</p>;
}
