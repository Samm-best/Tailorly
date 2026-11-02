"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api } from "@/lib/client-api";
import { ManageShell } from "../shell";

type Cat = { id: string; name: string; slug: string; description: string; isActive: boolean };

export default function CategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const r = await api<{ categories: Cat[] }>("/api/v1/shop/categories");
    if (r.ok) setCats(r.data.categories);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await api("/api/v1/shop/categories", { body: { name } });
    if (r.ok) { setName(""); await load(); } else setError(r.error.message);
  }
  async function toggle(c: Cat) {
    const r = await api(`/api/v1/shop/categories/${c.id}`, { method: "PATCH", body: { isActive: !c.isActive } });
    if (!r.ok) setError(r.error.message); else await load();
  }
  async function remove(c: Cat) {
    if (!window.confirm(`Delete the category "${c.name}"?`)) return;
    const r = await api(`/api/v1/shop/categories/${c.id}`, { method: "DELETE" });
    if (!r.ok) setError(r.error.message); else await load();
  }

  return (
    <ManageShell title="Categories">
      <div className="space-y-4">
        {error ? <Alert kind="error">{error}</Alert> : null}
        <Card title="Add a category">
          <form onSubmit={add} className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1"><Field label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} /></div>
            <Button type="submit">Add</Button>
          </form>
        </Card>
        <Card title="Your categories">
          {cats.length === 0 ? <p className="text-sm text-slate-600">No categories yet.</p> : (
            <ul className="divide-y divide-slate-200">
              {cats.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className={c.isActive ? "" : "text-slate-400"}>{c.name} <span className="text-xs text-slate-500">/{c.slug}{c.isActive ? "" : " (hidden)"}</span></span>
                  <span className="flex gap-2"><Button variant="ghost" onClick={() => toggle(c)}>{c.isActive ? "Hide" : "Show"}</Button><Button variant="danger" onClick={() => remove(c)}>Delete</Button></span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </ManageShell>
  );
}
