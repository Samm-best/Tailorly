"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, AuthShell, Button, Field } from "@/components/ui";
import { api, fieldErrors } from "@/lib/client-api";

export default function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    setBusy(true); setError(null); setErrors({});
    const r = await api<{ message: string }>("/api/v1/auth/forgot-password", { body: { email } });
    setBusy(false);
    if (r.ok) setMessage(r.data.message);
    else { setError(r.error.message); setErrors(fieldErrors(r.error)); }
  }

  return (
    <AuthShell title="Reset your password" subtitle="We will email you a link if the account exists.">
      {message ? <Alert kind="success">{message}</Alert> : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && !errors.email ? <Alert kind="error">{error}</Alert> : null}
          <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Sending..." : "Send reset link"}</Button>
        </form>
      )}
      <p className="mt-4 text-sm"><Link href="/login" className="font-medium text-navy underline">Back to sign in</Link></p>
    </AuthShell>
  );
}
