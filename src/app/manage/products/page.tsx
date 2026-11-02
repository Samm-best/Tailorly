"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Card } from "@/components/ui";
import { formatNaira } from "@/catalogue/money";
import { api } from "@/lib/client-api";
import { ManageShell } from "../shell";

type Row = { id: string; name: string; status: string; basePrice: number; state: string; featured: boolean; variants: { stock: number }[]; kind: string };
type List = { items: Row[]; total: number; page: number; pageSize: number };
const STATE_LABEL: Record<string, string> = { in_stock: "In stock", low_stock: "Low stock", out_of_stock: "Out of stock" };

export default function ProductsAdminPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<List | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    api<List>(`/api/v1/shop/products?${params}`).then((r) => (r.ok ? setData(r.data) : setError(r.error.message)));
  }, [status, q, page]);

  return (
    <ManageShell title="Products">
      <div className="space-y-4">
        {error ? <Alert kind="error">{error}</Alert> : null}
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="pq">Search</label>
          <input id="pq" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search products" className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3" />
          <label className="sr-only" htmlFor="ps">Status</label>
          <select id="ps" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">Active (draft + published)</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option>
          </select>
          <Link href="/manage/products/new" className="inline-flex min-h-11 items-center rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-dark">New product</Link>
        </div>
        <Card>
          {!data ? <p className="text-sm text-slate-600">Loading...</p> : data.items.length === 0 ? <p className="text-sm text-slate-600">No products found.</p> : (
            <ul className="divide-y divide-slate-200">
              {data.items.map((p) => (
                <li key={p.id}>
                  <Link href={`/manage/products/${p.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-slate-50">
                    <span className="font-medium text-slate-900">{p.name}{p.featured ? " *" : ""}</span>
                    <span className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span>{formatNaira(p.basePrice)}</span>
                      <span>{p.kind === "custom_service" ? "Service" : STATE_LABEL[p.state] ?? p.state}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{p.status}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {data && data.total > data.pageSize ? (
          <div className="flex items-center justify-center gap-3 text-sm">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="min-h-11 rounded-lg border border-slate-300 px-4 disabled:opacity-50">Previous</button>
            <span>Page {page} of {Math.ceil(data.total / data.pageSize)}</span>
            <button disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)} className="min-h-11 rounded-lg border border-slate-300 px-4 disabled:opacity-50">Next</button>
          </div>
        ) : null}
      </div>
    </ManageShell>
  );
}
