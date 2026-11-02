"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, BrandMark } from "@/components/ui";
import { api } from "@/lib/client-api";
import { formatNaira } from "@/catalogue/money";

type Order = { id: string; total: number; status: string; items: { name: string; quantity: number }[]; createdAt?: string };
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ orders: Order[] }>("/api/v1/account/orders").then((result) => {
      if (result.ok) setOrders(result.data.orders);
      else if (result.error.code === "UNAUTHENTICATED") window.location.assign("/login?next=/account/orders");
      else setError(result.error.message);
    });
  }, []);
  return <main className="mx-auto max-w-3xl space-y-5 px-4 py-8"><BrandMark /><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold text-navy">Order history</h1><Link href="/account" className="text-sm font-medium underline">Back to account</Link></div>{error ? <Alert kind="error">{error}</Alert> : null}{!orders.length && !error ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">No orders yet.</p> : <ul className="space-y-3">{orders.map((order) => <li key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex justify-between gap-3"><strong>{formatNaira(order.total)}</strong><span className="text-sm capitalize text-slate-600">{order.status.replace("_", " ")}</span></div><p className="mt-2 text-sm text-slate-600">{order.items.map((item) => `${item.name} x ${item.quantity}`).join(", ")}</p></li>)}</ul>}</main>;
}
