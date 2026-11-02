"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api, fieldErrors } from "@/lib/client-api";
import { readableTextOn } from "@/storefront/branding";
import { uploadImage } from "@/lib/upload-client";
import { ManageShell } from "../shell";

type Shop = {
  name: string; tagline: string; description: string; vision: string; mission: string; logoUrl: string; brandColor: string; accentColor: string;
  contact: { email: string; phone: string; address: string; city: string; state: string };
  policies: { delivery: string; returns: string; payment: string; alterations: string };
  social: { instagram: string; facebook: string; tiktok: string; whatsapp: string };
};

export default function StorefrontSettingsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [logo, setLogo] = useState<{ url: string; publicId: string } | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { api<{ shop: Shop }>("/api/v1/shop/profile").then((r) => r.ok && setShop(r.data.shop)); }, []);
  if (!shop) return <ManageShell title="Storefront"><p className="text-sm text-slate-600">Loading...</p></ManageShell>;

  const text = <K extends keyof Shop>(k: K, v: Shop[K]) => { setShop({ ...shop, [k]: v }); setSaved(false); };
  const nested = <G extends "contact" | "policies" | "social">(g: G, k: keyof Shop[G], v: string) => { setShop({ ...shop, [g]: { ...shop[g], [k]: v } }); setSaved(false); };
  const brand = /^#[0-9a-fA-F]{6}$/.test(shop.brandColor) ? shop.brandColor : "#173D78";
  const accent = /^#[0-9a-fA-F]{6}$/.test(shop.accentColor) ? shop.accentColor : "#21B8C9";

  async function onLogo(file: File | undefined) {
    if (!file) return;
    setUploading(true); setError(null);
    const r = await uploadImage(file, "branding");
    setUploading(false);
    if (r.ok) { setLogo(r.data); setShop((s) => (s ? { ...s, logoUrl: r.data.url } : s)); setSaved(false); } else setError(r.error.message);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setBusy(true); setError(null); setErrors({}); setSaved(false);
    const r = await api<{ shop: Shop }>("/api/v1/shop/profile", {
      method: "PATCH",
      body: {
        name: shop.name, tagline: shop.tagline, description: shop.description, vision: shop.vision, mission: shop.mission,
        brandColor: shop.brandColor, accentColor: shop.accentColor, contact: shop.contact, policies: shop.policies, social: shop.social,
        ...(logo !== undefined ? { logo } : {}),
      },
    });
    setBusy(false);
    if (r.ok) { setShop(r.data.shop); setLogo(undefined); setSaved(true); } else { setError(r.error.message); setErrors(fieldErrors(r.error)); }
  }

  const area = (id: string, label: string, value: string, onChange: (v: string) => void, rows = 3) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-800">{label}</label>
      <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
    </div>
  );

  return (
    <ManageShell title="Storefront">
      <form onSubmit={save} className="space-y-4" noValidate>
        {error ? <Alert kind="error">{error}</Alert> : null}
        {saved ? <Alert kind="success">Saved. Your storefront is updated.</Alert> : null}
        <Card title="Identity">
          <div className="space-y-3">
            <Field label="Shop name" value={shop.name} onChange={(e) => text("name", e.target.value)} required error={errors.name} />
            <Field label="Tagline" value={shop.tagline} onChange={(e) => text("tagline", e.target.value)} error={errors.tagline} />
            {area("desc", "About your shop", shop.description, (v) => text("description", v), 4)}
            {area("vision", "Vision", shop.vision, (v) => text("vision", v))}
            {area("mission", "Mission", shop.mission, (v) => text("mission", v))}
            <div className="flex items-center gap-4">
              {shop.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logoUrl} alt="Current logo" className="image-motion h-16 w-16 rounded-lg object-cover" />
              ) : <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">No logo</span>}
              <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50">
                {uploading ? "Uploading..." : "Upload logo"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(e) => { void onLogo(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              {shop.logoUrl ? <button type="button" className="text-sm text-red-700 underline" onClick={() => { setLogo(null); setShop({ ...shop, logoUrl: "" }); }}>Remove</button> : null}
            </div>
          </div>
        </Card>
        <Card title="Colours">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Main colour" value={shop.brandColor} placeholder="#173D78" onChange={(e) => text("brandColor", e.target.value)} error={errors.brandColor} hint="Hex code such as #173D78. Leave empty for the Tailorly default." />
            <Field label="Accent colour" value={shop.accentColor} placeholder="#21B8C9" onChange={(e) => text("accentColor", e.target.value)} error={errors.accentColor} />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: brand, color: readableTextOn(brand) }}>
            <span>{shop.name || "Your shop"}</span>
            <span className="rounded-lg px-3 py-1" style={{ background: accent, color: readableTextOn(accent) }}>Preview</span>
          </div>
        </Card>
        <Card title="Contact details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email" type="email" value={shop.contact.email} onChange={(e) => nested("contact", "email", e.target.value)} error={errors["contact.email"]} />
            <Field label="Phone" value={shop.contact.phone} onChange={(e) => nested("contact", "phone", e.target.value)} error={errors["contact.phone"]} />
            <Field label="Address" value={shop.contact.address} onChange={(e) => nested("contact", "address", e.target.value)} />
            <Field label="City" value={shop.contact.city} onChange={(e) => nested("contact", "city", e.target.value)} />
            <Field label="State" value={shop.contact.state} onChange={(e) => nested("contact", "state", e.target.value)} />
          </div>
        </Card>
        <Card title="Social links">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Instagram link" placeholder="https://instagram.com/..." value={shop.social.instagram} onChange={(e) => nested("social", "instagram", e.target.value)} error={errors["social.instagram"]} />
            <Field label="Facebook link" placeholder="https://facebook.com/..." value={shop.social.facebook} onChange={(e) => nested("social", "facebook", e.target.value)} error={errors["social.facebook"]} />
            <Field label="TikTok link" placeholder="https://tiktok.com/@..." value={shop.social.tiktok} onChange={(e) => nested("social", "tiktok", e.target.value)} error={errors["social.tiktok"]} />
            <Field label="WhatsApp number" value={shop.social.whatsapp} onChange={(e) => nested("social", "whatsapp", e.target.value)} error={errors["social.whatsapp"]} />
          </div>
        </Card>
        <Card title="Policies">
          <div className="space-y-3">
            {area("p1", "Delivery and collection", shop.policies.delivery, (v) => nested("policies", "delivery", v))}
            {area("p2", "Payments", shop.policies.payment, (v) => nested("policies", "payment", v))}
            {area("p3", "Returns", shop.policies.returns, (v) => nested("policies", "returns", v))}
            {area("p4", "Alterations", shop.policies.alterations, (v) => nested("policies", "alterations", v))}
          </div>
        </Card>
        <Button type="submit" disabled={busy || uploading}>{busy ? "Saving..." : "Save storefront"}</Button>
      </form>
    </ManageShell>
  );
}
