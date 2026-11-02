"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { koboToNairaString, parseNairaToKobo } from "@/catalogue/money";
import { api, fieldErrors } from "@/lib/client-api";
import { uploadImage } from "@/lib/upload-client";
import { ManageShell } from "../../shell";

type VariantRow = { id?: string; size: string; color: string; fabric: string; sku: string; price: string; stock: string };
type Img = { url: string; publicId: string; alt?: string };
type Form = {
  name: string; description: string; kind: "ready_made" | "custom_service"; categoryId: string; price: string; compareAt: string;
  status: "draft" | "published" | "archived"; featured: boolean; tags: string; trackStock: boolean; lowStock: string; images: Img[]; variants: VariantRow[];
};
type Cat = { id: string; name: string };
type ServerVariant = { id: string; size: string; color: string; fabric: string; sku: string; price: number | null; stock: number; label: string };
type ServerProduct = {
  id: string; name: string; description: string; kind: Form["kind"]; categoryId: string | null; images: Img[]; basePrice: number; compareAtPrice: number | null;
  status: Form["status"]; featured: boolean; tags: string[]; trackStock: boolean; lowStockThreshold: number; variants: ServerVariant[];
};
type Movement = { id: string; variantId: string; delta: number; balanceAfter: number; reason: string; note: string; at: string };

const blankVariant = (): VariantRow => ({ size: "", color: "", fabric: "", sku: "", price: "", stock: "0" });
const blankForm = (): Form => ({
  name: "", description: "", kind: "ready_made", categoryId: "", price: "", compareAt: "", status: "draft", featured: false,
  tags: "", trackStock: true, lowStock: "3", images: [], variants: [blankVariant()],
});

function toForm(p: ServerProduct): Form {
  return {
    name: p.name, description: p.description, kind: p.kind, categoryId: p.categoryId ?? "", price: koboToNairaString(p.basePrice),
    compareAt: p.compareAtPrice ? koboToNairaString(p.compareAtPrice) : "", status: p.status, featured: p.featured, tags: p.tags.join(", "),
    trackStock: p.trackStock, lowStock: String(p.lowStockThreshold), images: p.images,
    variants: p.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, fabric: v.fabric, sku: v.sku, price: v.price === null ? "" : koboToNairaString(v.price), stock: String(v.stock) })),
  };
}

/** Converts the form into the API payload. Returns an error string when a money/number field is invalid. */
function toPayload(f: Form): { payload: Record<string, unknown> } | { error: string } {
  const base = parseNairaToKobo(f.price);
  if (base === null) return { error: "Enter a valid price, for example 12500 or 12,500.50." };
  let compareAtPrice: number | null | undefined = f.compareAt.trim() ? parseNairaToKobo(f.compareAt) : null;
  if (compareAtPrice === null && f.compareAt.trim()) return { error: "Enter a valid compare-at price." };
  if (!f.compareAt.trim()) compareAtPrice = undefined;
  const variants = [];
  for (const v of f.variants) {
    const price = v.price.trim() ? parseNairaToKobo(v.price) : undefined;
    if (v.price.trim() && price === null) return { error: "A variant price is not valid." };
    const stock = Number(v.stock || 0);
    if (!Number.isInteger(stock) || stock < 0) return { error: "Stock must be a whole number, zero or more." };
    variants.push({ ...(v.id ? { id: v.id } : {}), size: v.size, color: v.color, fabric: v.fabric, sku: v.sku, ...(price !== undefined ? { price } : {}), stock });
  }
  return {
    payload: {
      name: f.name, description: f.description, kind: f.kind, categoryId: f.categoryId || null, images: f.images, basePrice: base,
      ...(compareAtPrice !== undefined ? { compareAtPrice } : {}), status: f.status, featured: f.featured,
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean), trackStock: f.trackStock, lowStockThreshold: Number(f.lowStock || 0), variants,
    },
  };
}

export default function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const [form, setForm] = useState<Form>(blankForm());
  const [cats, setCats] = useState<Cat[]>([]);
  const [history, setHistory] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      api<{ categories: Cat[] }>("/api/v1/shop/categories"),
      isNew ? Promise.resolve(null) : api<{ product: ServerProduct; stockHistory: Movement[] }>(`/api/v1/shop/products/${id}`),
    ]);
    if (c.ok) setCats(c.data.categories);
    if (p) {
      if (p.ok) { setForm(toForm(p.data.product)); setHistory(p.data.stockHistory); } else setError(p.error.message);
    }
    setLoading(false);
  }, [id, isNew]);
  useEffect(() => { void load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setErrors({}); setSaved(false);
    const built = toPayload(form);
    if ("error" in built) { setError(built.error); return; }
    setSaving(true);
    const r = isNew
      ? await api<{ product: ServerProduct }>("/api/v1/shop/products", { body: built.payload })
      : await api<{ product: ServerProduct }>(`/api/v1/shop/products/${id}`, { method: "PATCH", body: built.payload });
    setSaving(false);
    if (!r.ok) { setError(r.error.message); setErrors(fieldErrors(r.error)); return; }
    if (isNew) window.location.assign(`/manage/products/${r.data.product.id}`);
    else { setForm(toForm(r.data.product)); setSaved(true); }
  }

  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setError(null);
    const next = [...form.images];
    for (const file of Array.from(files)) {
      if (next.length >= 8) { setError("A product can have up to 8 images."); break; }
      const r = await uploadImage(file, "products");
      if (r.ok) next.push({ ...r.data, alt: form.name }); else { setError(r.error.message); break; }
    }
    set("images", next);
    setUploading(false);
  }

  async function archive() {
    if (!window.confirm("Archive this product? It will disappear from your shop.")) return;
    const r = await api(`/api/v1/shop/products/${id}`, { method: "DELETE" });
    if (r.ok) window.location.assign("/manage/products"); else setError(r.error.message);
  }

  async function adjust(variantId: string, delta: number, reason: string, note: string) {
    setError(null);
    const r = await api<{ product: ServerProduct }>(`/api/v1/shop/products/${id}/stock`, { body: { variantId, delta, reason, note: note || undefined } });
    if (!r.ok) { setError(r.error.message); return false; }
    await load();
    return true;
  }

  if (loading) return <ManageShell title="Product"><p className="text-sm text-slate-600">Loading...</p></ManageShell>;

  const upd = (i: number, patch: Partial<VariantRow>) => set("variants", form.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  return (
    <ManageShell title={isNew ? "New product" : "Edit product"}>
      <form onSubmit={save} className="space-y-4" noValidate>
        {error ? <Alert kind="error">{error}</Alert> : null}
        {saved ? <Alert kind="success">Saved.</Alert> : null}
        <Card title="Details">
          <div className="space-y-3">
            <Field label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} required error={errors.name} />
            <div>
              <label htmlFor="desc" className="mb-1 block text-sm font-medium text-slate-800">Description</label>
              <textarea id="desc" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="kind" className="mb-1 block text-sm font-medium">Type</label>
                <select id="kind" value={form.kind} onChange={(e) => set("kind", e.target.value as Form["kind"])} className="min-h-11 w-full rounded-lg border border-slate-300 px-3">
                  <option value="ready_made">Ready-made product</option><option value="custom_service">Custom service</option>
                </select>
              </div>
              <div>
                <label htmlFor="cat" className="mb-1 block text-sm font-medium">Category</label>
                <select id="cat" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 px-3">
                  <option value="">None</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Field label="Price (NGN)" inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} required error={errors.basePrice} />
              <Field label="Compare-at price (optional)" inputMode="decimal" value={form.compareAt} onChange={(e) => set("compareAt", e.target.value)} hint="Shown struck through. Must be higher than the price." error={errors.compareAtPrice} />
              <Field label="Tags (comma separated)" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium">Status</label>
                <select id="status" value={form.status} onChange={(e) => set("status", e.target.value as Form["status"])} className="min-h-11 w-full rounded-lg border border-slate-300 px-3">
                  <option value="draft">Draft (hidden)</option><option value="published">Published</option><option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} /> Feature on the shop home page</label>
          </div>
        </Card>

        <Card title="Photos">
          <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {form.images.map((img, i) => (
              <li key={img.publicId} className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt || form.name} className="image-motion aspect-square w-full rounded-lg object-cover" />
                <button type="button" onClick={() => set("images", form.images.filter((_, idx) => idx !== i))} className="text-xs text-red-700 underline">Remove</button>
              </li>
            ))}
          </ul>
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50">
            {uploading ? "Uploading..." : "Add photos"}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={uploading || form.images.length >= 8} onChange={(e) => { void addImages(e.target.files); e.target.value = ""; }} />
          </label>
          <p className="mt-2 text-xs text-slate-500">JPG, PNG or WebP, up to 5 MB each, up to 8 photos. Photos are saved with the product.</p>
        </Card>

        <Card title="Options and stock" action={<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.trackStock} onChange={(e) => set("trackStock", e.target.checked)} /> Track stock</label>}>
          <p className="mb-3 text-xs text-slate-500">Leave size, colour and fabric empty for a single standard item. {isNew ? "Opening stock is set here." : "Existing stock is changed with the stock tool below so every change is recorded."}</p>
          <div className="space-y-3">
            {form.variants.map((v, i) => (
              <fieldset key={v.id ?? `n${i}`} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-6">
                <legend className="px-1 text-xs text-slate-500">Variant {i + 1}</legend>
                <Field label="Size" value={v.size} onChange={(e) => upd(i, { size: e.target.value })} />
                <Field label="Colour" value={v.color} onChange={(e) => upd(i, { color: e.target.value })} />
                <Field label="Fabric" value={v.fabric} onChange={(e) => upd(i, { fabric: e.target.value })} />
                <Field label="SKU" value={v.sku} onChange={(e) => upd(i, { sku: e.target.value })} />
                <Field label="Own price" inputMode="decimal" value={v.price} onChange={(e) => upd(i, { price: e.target.value })} />
                <Field label="Stock" inputMode="numeric" value={v.stock} disabled={Boolean(v.id)} onChange={(e) => upd(i, { stock: e.target.value })} />
                {form.variants.length > 1 ? <button type="button" onClick={() => set("variants", form.variants.filter((_, idx) => idx !== i))} className="text-left text-xs text-red-700 underline sm:col-span-6">Remove variant</button> : null}
              </fieldset>
            ))}
            {errors.variants ? <p role="alert" className="text-xs text-red-600">{errors.variants}</p> : null}
            <Button type="button" variant="ghost" onClick={() => set("variants", [...form.variants, blankVariant()])} disabled={form.variants.length >= 50}>Add variant</Button>
            <Field label="Low-stock warning at" inputMode="numeric" value={form.lowStock} onChange={(e) => set("lowStock", e.target.value)} />
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || uploading}>{saving ? "Saving..." : isNew ? "Create product" : "Save changes"}</Button>
          <Link href="/manage/products" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50">Back to products</Link>
          {!isNew && form.status !== "archived" ? <Button type="button" variant="danger" onClick={archive}>Archive</Button> : null}
        </div>
      </form>

      {!isNew && form.trackStock ? <StockTool variants={form.variants} history={history} onAdjust={adjust} /> : null}
    </ManageShell>
  );
}

function StockTool({ variants, history, onAdjust }: {
  variants: VariantRow[]; history: Movement[]; onAdjust: (variantId: string, delta: number, reason: string, note: string) => Promise<boolean>;
}) {
  const existing = variants.filter((v) => v.id);
  const [variantId, setVariantId] = useState(existing[0]?.id ?? "");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("restock");
  const [note, setNote] = useState("");
  const label = (v: VariantRow) => [v.size, v.color, v.fabric].filter(Boolean).join(" / ") || "Standard";
  const nameOf = (id: string) => { const v = existing.find((x) => x.id === id); return v ? label(v) : "Removed variant"; };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(delta);
    if (!Number.isInteger(n) || n === 0) return;
    if (await onAdjust(variantId, n, reason, note)) { setDelta(""); setNote(""); }
  }
  if (!existing.length) return null;
  return (
    <div className="mt-6 space-y-4">
      <Card title="Adjust stock">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="sv" className="mb-1 block text-sm font-medium">Variant</label>
            <select id="sv" value={variantId} onChange={(e) => setVariantId(e.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 px-3">
              {existing.map((v) => <option key={v.id} value={v.id}>{label(v)} (now {v.stock})</option>)}
            </select>
          </div>
          <Field label="Change (+/-)" inputMode="numeric" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="e.g. 10 or -2" />
          <div>
            <label htmlFor="sr" className="mb-1 block text-sm font-medium">Reason</label>
            <select id="sr" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 px-3">
              <option value="restock">Restock</option><option value="correction">Correction</option><option value="damaged">Damaged</option>
            </select>
          </div>
          <Field label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="sm:col-span-4"><Button type="submit">Record change</Button></div>
        </form>
      </Card>
      <Card title="Recent stock changes">
        {history.length === 0 ? <p className="text-sm text-slate-600">No changes yet.</p> : (
          <ul className="divide-y divide-slate-200 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{nameOf(h.variantId)}: <strong>{h.delta > 0 ? `+${h.delta}` : h.delta}</strong> ({h.reason}) {h.note ? `- ${h.note}` : ""}</span>
                <span className="text-slate-500">balance {h.balanceAfter} - {new Date(h.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
