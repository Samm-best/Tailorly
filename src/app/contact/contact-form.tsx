"use client";

import { useState } from "react";
import { Alert, Button, Field } from "@/components/ui";
import { api, fieldErrors } from "@/lib/client-api";

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "support", label: "I need help" },
  { value: "shop_interest", label: "I want to open a shop" },
] as const;

export function ContactForm({ initialTopic }: { initialTopic: (typeof TOPICS)[number]["value"] }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topic, setTopic] = useState<string>(initialTopic);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(null); setErrors({});
    const r = await api("/api/v1/contact", {
      body: {
        topic, name: f.get("name"), email: f.get("email"), phone: f.get("phone") || "",
        businessName: f.get("businessName") || "", message: f.get("message"), website: f.get("website") || "",
      },
    });
    setBusy(false);
    if (r.ok) setDone(true);
    else { setError(r.error.message); setErrors(fieldErrors(r.error)); }
  }

  if (done) return <Alert kind="success">Thank you. Your message has been received and the Tailorly team will reply by email.</Alert>;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error ? <Alert kind="error">{error}</Alert> : null}
      <div>
        <label htmlFor="topic" className="mb-1 block text-sm font-medium text-slate-800">What is this about?</label>
        <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-base">
          {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <Field label="Your name" name="name" autoComplete="name" required error={errors.name} />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
      <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" error={errors.phone} />
      {topic === "shop_interest" ? <Field label="Business name" name="businessName" error={errors.businessName} /> : null}
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-slate-800">Message</label>
        <textarea id="message" name="message" required rows={5} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/30" />
        {errors.message ? <p role="alert" className="mt-1 text-xs text-red-600">{errors.message}</p> : null}
      </div>
      {/* Honeypot: hidden from people and screen readers; bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px]"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <Button type="submit" disabled={busy}>{busy ? "Sending..." : "Send message"}</Button>
    </form>
  );
}
