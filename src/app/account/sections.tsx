"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api, fieldErrors } from "@/lib/client-api";
import { uploadImage } from "@/lib/upload-client";

export type PublicUser = { id: string; email: string; fullName: string; phone: string; profileImage: { url: string; publicId: string } | null; emailVerified: boolean; preferences: { marketingEmails: boolean } };
export type Membership = { tenantId: string; slug: string; name: string; role: string };

const ROLE_LABEL: Record<string, string> = {
  owner: "Shop owner", manager: "Store manager", tailor: "Tailor / designer", staff: "Store staff", delivery: "Delivery", customer: "Customer",
};

/* ---------------- profile ---------------- */
export function ProfileSection({ user, onUpdated }: { user: PublicUser; onUpdated: (u: PublicUser) => void }) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  async function onImage(file: File | undefined) {
    if (!file) return;
    setUploading(true); setImageError(null);
    const uploaded = await uploadImage(file, "profile");
    if (!uploaded.ok) { setImageError(uploaded.error.message); setUploading(false); return; }
    const saved = await api<{ user: PublicUser }>("/api/v1/account/profile", { method: "PATCH", body: { profileImage: uploaded.data } });
    setUploading(false);
    if (saved.ok) onUpdated(saved.data.user);
    else setImageError(saved.error.message);
  }

  async function removeImage() {
    setImageError(null);
    const saved = await api<{ user: PublicUser }>("/api/v1/account/profile", { method: "PATCH", body: { profileImage: null } });
    if (saved.ok) onUpdated(saved.data.user);
    else setImageError(saved.error.message);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErrors({}); setMsg(null);
    const r = await api<{ user: PublicUser }>("/api/v1/account/profile", {
      method: "PATCH",
      body: { fullName: f.get("fullName"), phone: f.get("phone") ?? "", marketingEmails: f.get("marketingEmails") === "on" },
    });
    setBusy(false);
    if (r.ok) { onUpdated(r.data.user); setMsg({ kind: "success", text: "Profile saved." }); }
    else { setErrors(fieldErrors(r.error)); setMsg({ kind: "error", text: r.error.message }); }
  }

  return (
    <Card title="Profile">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-4">
          {user.profileImage ? <img src={user.profileImage.url} alt={`${user.fullName} profile`} className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-sm" /> : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan/20 text-2xl font-bold text-navy">{user.fullName.slice(0, 1).toUpperCase()}</span>}
          <div className="flex-1"><p className="text-sm font-semibold text-navy">Profile picture</p><p className="mt-1 text-xs text-slate-500">JPG, PNG or WebP up to 5 MB.</p><div className="mt-3 flex flex-wrap gap-3"><label className="inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold hover:bg-slate-100">{uploading ? "Uploading..." : "Upload picture"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(e) => { void onImage(e.target.files?.[0]); e.target.value = ""; }} /></label>{user.profileImage ? <button type="button" className="text-xs font-semibold text-red-700 underline" onClick={() => { void removeImage(); }}>Remove</button> : null}</div></div>
        </div>
        {imageError ? <Alert kind="error">{imageError}</Alert> : null}
        <Field label="Email" value={user.email} readOnly disabled hint={user.emailVerified ? "Verified" : "Not verified"} />
        <Field label="Full name" name="fullName" defaultValue={user.fullName} required error={errors.fullName} />
        <Field label="Phone (optional)" name="phone" type="tel" defaultValue={user.phone} error={errors.phone} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="marketingEmails" defaultChecked={user.preferences.marketingEmails} className="size-4" />
          Send me product news and offers
        </label>
        <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save profile"}</Button>
      </form>
      {!user.emailVerified ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-950">Email verification required</p><p className="mt-1 text-xs text-amber-900/80">We will send a secure, expiring link to your current address.</p><Button type="button" variant="ghost" className="mt-3" disabled={emailBusy} onClick={async () => { setEmailBusy(true); setEmailMsg(null); const r = await api<{ message: string }>("/api/v1/auth/resend-verification", { method: "POST", body: {} }); setEmailBusy(false); setEmailMsg(r.ok ? r.data.message : r.error.message); }}> {emailBusy ? "Sending..." : "Resend verification email"} </Button>{emailMsg ? <p className="mt-2 text-xs text-amber-900">{emailMsg}</p> : null}</div> : null}
      <EmailChangeForm user={user} onUpdated={onUpdated} />
    </Card>
  );
}

function EmailChangeForm({ user, onUpdated }: { user: PublicUser; onUpdated: (u: PublicUser) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage(null);
    const r = await api<{ email: string; message: string }>("/api/v1/auth/change-email", { method: "POST", body: { email: form.get("email"), password: form.get("password") } });
    setBusy(false);
    if (r.ok) { onUpdated({ ...user, email: r.data.email, emailVerified: false }); setMessage(r.data.message); event.currentTarget.reset(); }
    else setMessage(r.error.message);
  }
  return <form onSubmit={submit} className="mt-6 border-t border-slate-100 pt-5"><p className="text-sm font-semibold text-navy">Change email address</p><p className="mt-1 text-xs text-slate-500">A new verification link will be sent. Your current password is required.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="New email" name="email" type="email" required /><Field label="Current password" name="password" type="password" autoComplete="current-password" required /></div>{message ? <p className="mt-2 text-xs text-slate-600">{message}</p> : null}<Button type="submit" variant="ghost" className="mt-3" disabled={busy}>{busy ? "Updating..." : "Update email"}</Button></form>;
}

/* ---------------- shops ---------------- */
export function ShopsSection({ memberships, currentShop }: { memberships: Membership[]; currentShop: string | null }) {
  function shopUrl(slug: string) {
    const host = window.location.host.replace(/^www\./, "");
    const root = currentShop ? host.split(".").slice(1).join(".") : host;
    return `${window.location.protocol}//${slug}.${root}/account`;
  }
  return (
    <Card title="My shops">
      {memberships.length === 0 ? (
        <p className="text-sm text-slate-600">You have no shop relationships yet. Visit a shop and sign in there to connect your account with it.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {memberships.map((m) => (
            <li key={m.tenantId} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABEL[m.role] ?? m.role}{m.slug === currentShop ? " - you are here" : ""}</p>
              </div>
              {m.slug === currentShop ? null : <a href={shopUrl(m.slug)} className="text-sm font-medium text-navy underline">Open</a>}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-slate-500">Each shop keeps its own role for you. A role in one shop never applies in another.</p>
    </Card>
  );
}

/* ---------------- addresses ---------------- */
type Address = { id: string; label: string; recipientName: string; phone: string; line1: string; line2: string; city: string; state: string; country: string; postalCode: string; isDefault: boolean };

export function AddressesSection() {
  const [items, setItems] = useState<Address[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api<{ addresses: Address[] }>("/api/v1/account/addresses");
    if (r.ok) setItems(r.data.addresses); else setMsg(r.error.message);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setBusy(true); setErrors({}); setMsg(null);
    const r = await api("/api/v1/account/addresses", {
      body: {
        label: get("label"), recipientName: get("recipientName"), phone: get("phone"), line1: get("line1"), line2: get("line2"),
        city: get("city"), state: get("state"), country: get("country") || "NG", postalCode: get("postalCode"), isDefault: f.get("isDefault") === "on",
      },
    });
    setBusy(false);
    if (r.ok) { setAdding(false); await load(); }
    else { setErrors(fieldErrors(r.error)); setMsg(r.error.message); }
  }

  async function makeDefault(id: string) {
    const r = await api(`/api/v1/account/addresses/${id}`, { method: "PATCH", body: { isDefault: true } });
    if (r.ok) await load(); else setMsg(r.error.message);
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this address?")) return;
    const r = await api(`/api/v1/account/addresses/${id}`, { method: "DELETE" });
    if (r.ok) await load(); else setMsg(r.error.message);
  }

  return (
    <Card title="Addresses" action={<Button variant="ghost" onClick={() => { setAdding((v) => !v); setErrors({}); setMsg(null); }}>{adding ? "Cancel" : "Add address"}</Button>}>
      {msg ? <div className="mb-3"><Alert kind="error">{msg}</Alert></div> : null}
      {adding ? (
        <form onSubmit={onSubmit} className="mb-5 grid gap-3 sm:grid-cols-2" noValidate>
          <Field label="Label (e.g. Home)" name="label" required error={errors.label} />
          <Field label="Recipient name" name="recipientName" required error={errors.recipientName} />
          <div className="sm:col-span-2"><Field label="Address line 1" name="line1" required error={errors.line1} /></div>
          <div className="sm:col-span-2"><Field label="Address line 2 (optional)" name="line2" error={errors.line2} /></div>
          <Field label="City" name="city" required error={errors.city} />
          <Field label="State" name="state" required error={errors.state} />
          <Field label="Country code" name="country" defaultValue="NG" maxLength={2} error={errors.country} />
          <Field label="Postal code (optional)" name="postalCode" error={errors.postalCode} />
          <Field label="Phone (optional)" name="phone" type="tel" error={errors.phone} />
          <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="isDefault" className="size-4" /> Make default</label>
          <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save address"}</Button></div>
        </form>
      ) : null}
      {items === null ? <p className="text-sm text-slate-600">Loading...</p> : items.length === 0 ? (
        <p className="text-sm text-slate-600">No saved addresses yet. Add one to speed up delivery orders later.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
              <div className="text-sm">
                <p className="font-medium">{a.label}{a.isDefault ? <span className="ml-2 rounded bg-cyan/15 px-2 py-0.5 text-xs text-navy">Default</span> : null}</p>
                <p>{a.recipientName}</p>
                <p className="text-slate-600">{[a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(", ")}</p>
              </div>
              <div className="flex gap-2">
                {a.isDefault ? null : <Button variant="ghost" onClick={() => makeDefault(a.id)}>Set default</Button>}
                <Button variant="ghost" onClick={() => remove(a.id)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------------- notifications ---------------- */
type Note = { id: string; title: string; body: string; read: boolean; createdAt: string };

export function NotificationsSection() {
  const [items, setItems] = useState<Note[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (before?: string) => {
    const r = await api<{ notifications: Note[]; unreadCount: number; nextBefore: string | null }>(
      `/api/v1/account/notifications?limit=10${before ? `&before=${encodeURIComponent(before)}` : ""}`,
    );
    if (!r.ok) { setErr(r.error.message); return; }
    setItems((prev) => (before && prev ? [...prev, ...r.data.notifications] : r.data.notifications));
    setUnread(r.data.unreadCount);
    setNext(r.data.nextBefore);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function markAll() {
    const r = await api("/api/v1/account/notifications", { method: "PATCH", body: { all: true } });
    if (r.ok) { setItems((p) => p?.map((n) => ({ ...n, read: true })) ?? p); setUnread(0); } else setErr(r.error.message);
  }
  async function markOne(id: string) {
    const r = await api("/api/v1/account/notifications", { method: "PATCH", body: { ids: [id] } });
    if (r.ok) { setItems((p) => p?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? p); setUnread((u) => Math.max(0, u - 1)); }
  }

  return (
    <Card title={`Notifications${unread ? ` (${unread} new)` : ""}`} action={unread ? <Button variant="ghost" onClick={markAll}>Mark all read</Button> : undefined}>
      {err ? <Alert kind="error">{err}</Alert> : null}
      {items === null ? <p className="text-sm text-slate-600">Loading...</p> : items.length === 0 ? (
        <p className="text-sm text-slate-600">Nothing yet. Order updates, messages and appointment reminders will appear here.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 py-3">
              <div className={n.read ? "text-slate-600" : ""}>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm">{n.body}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {n.read ? null : <button onClick={() => markOne(n.id)} className="shrink-0 text-xs font-medium text-navy underline">Mark read</button>}
            </li>
          ))}
        </ul>
      )}
      {next ? <div className="mt-3"><Button variant="ghost" onClick={() => load(next)}>Load more</Button></div> : null}
    </Card>
  );
}

/* ---------------- sessions ---------------- */
type Sess = { id: string; current: boolean; userAgent: string; lastUsedAt: string };

export function SessionsSection() {
  const [items, setItems] = useState<Sess[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    const r = await api<{ sessions: Sess[] }>("/api/v1/auth/sessions");
    if (r.ok) setItems(r.data.sessions); else setErr(r.error.message);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function revoke(id: string) {
    const r = await api(`/api/v1/auth/sessions/${id}`, { method: "DELETE" });
    if (r.ok) await load(); else setErr(r.error.message);
  }
  return (
    <Card title="Signed-in devices">
      {err ? <Alert kind="error">{err}</Alert> : null}
      {items === null ? <p className="text-sm text-slate-600">Loading...</p> : (
        <ul className="divide-y divide-slate-100">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="line-clamp-1 font-medium">{s.userAgent}{s.current ? " (this device)" : ""}</p>
                <p className="text-xs text-slate-500">Last active {new Date(s.lastUsedAt).toLocaleString()}</p>
              </div>
              {s.current ? null : <Button variant="ghost" className="rounded-full border-cyan/30 text-cyan-dark hover:border-cyan hover:bg-cyan/10" onClick={() => revoke(s.id)}>Sign out</Button>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------------- privacy ---------------- */
type Summary = { counts: { addresses: number; notifications: number; activeSessions: number; shopRelationships: number }; categories: string[] };

export function PrivacySection() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    api<Summary>("/api/v1/account/privacy").then((r) => (r.ok ? setSummary(r.data) : setErr(r.error.message)));
  }, []);

  async function download() {
    const r = await api<unknown>("/api/v1/account/privacy?format=export");
    if (!r.ok) { setErr(r.error.message); return; }
    const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tailorly-my-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr(null);
    const r = await api("/api/v1/account/privacy", { method: "DELETE", body: { password: f.get("password"), confirm: f.get("confirm") } });
    if (r.ok) { window.location.assign("/"); return; }
    setBusy(false);
    setErr(r.error.message);
  }

  return (
    <Card title="Privacy and data">
      {err ? <Alert kind="error">{err}</Alert> : null}
      {summary ? (
        <>
          <p className="text-sm text-slate-600">We hold: {summary.categories.join("; ")}.</p>
          <p className="mt-2 text-sm">{summary.counts.addresses} addresses, {summary.counts.notifications} notifications, {summary.counts.activeSessions} active sessions, {summary.counts.shopRelationships} shop relationships.</p>
        </>
      ) : <p className="text-sm text-slate-600">Loading...</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={download}>Download my data</Button>
        <Button variant="ghost" onClick={() => setConfirming((v) => !v)}>{confirming ? "Cancel" : "Delete my account"}</Button>
      </div>
      {confirming ? (
        <form onSubmit={onDelete} className="mt-4 space-y-3 rounded-lg border border-red-200 bg-red-50 p-4" noValidate>
          <p className="text-sm text-red-800">This permanently erases your profile, addresses and notifications and signs you out everywhere. It cannot be undone.</p>
          <Field label="Your password" name="password" type="password" autoComplete="current-password" required />
          <Field label='Type DELETE to confirm' name="confirm" required />
          <Button type="submit" variant="danger" disabled={busy}>{busy ? "Deleting..." : "Permanently delete account"}</Button>
        </form>
      ) : null}
    </Card>
  );
}
