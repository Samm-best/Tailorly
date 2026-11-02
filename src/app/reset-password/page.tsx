"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AuthShell, Button, Field } from "@/components/ui";
import { api, fieldErrors } from "@/lib/client-api";

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // The token is read client-side to avoid exposing it in the server-rendered HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("confirm")) { setErrors({ confirm: "Passwords do not match." }); return; }
    setBusy(true); setError(null); setErrors({});
    const r = await api("/api/v1/auth/reset-password", { body: { token, password: f.get("password") } });
    setBusy(false);
    if (r.ok) setDone(true);
    else { setError(r.error.message); setErrors(fieldErrors(r.error)); }
  }

  if (token === null) return <AuthShell title="Choose a new password"><p className="text-sm text-slate-600">Loading...</p></AuthShell>;
  if (!token) {
    return (
      <AuthShell title="Link missing">
        <Alert kind="error">This reset link is incomplete.</Alert>
        <p className="mt-4 text-sm"><Link href="/forgot-password" className="font-medium text-navy underline">Request a new link</Link></p>
      </AuthShell>
    );
  }
  if (done) {
    return (
      <AuthShell title="Password updated">
        <Alert kind="success">Your password was changed and you were signed out everywhere.</Alert>
        <p className="mt-4 text-sm"><Link href="/login" className="font-medium text-navy underline">Sign in</Link></p>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && !errors.password ? <Alert kind="error">{error}</Alert> : null}
        <Field label="New password" name="password" type="password" autoComplete="new-password" required error={errors.password} hint="At least 10 characters with a letter and a number." />
        <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" required error={errors.confirm} />
        <Button type="submit" disabled={busy} className="auth-submit w-full">{busy ? "Saving..." : "Update password"}</Button>
      </form>
    </AuthShell>
  );
}
