"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, AuthShell, Button, Field } from "@/components/ui";
import { safeRedirectPath } from "@/auth/identity";
import { api, fieldErrors } from "@/lib/client-api";

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErrors({}); setError(null);
    const r = await api("/api/v1/auth/login", { body: { email: f.get("email"), password: f.get("password") } });
    if (r.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(safeRedirectPath(next));
      return;
    }
    setBusy(false);
    setErrors(fieldErrors(r.error));
    setError({ code: r.error.code, message: r.error.message });
  }

  return (
    <AuthShell title="Sign in" subtitle="Use your Tailorly email and password.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? <Alert kind="error">{error.message}</Alert> : null}
        <Field label="Email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <div className="relative">
          <Field label="Password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required error={errors.password} />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-8 text-xs font-semibold text-navy">{showPassword ? "Hide" : "Show"}</button>
        </div>
        <Button type="submit" disabled={busy} className="auth-submit w-full rounded-xl bg-gradient-to-r from-navy to-[#245aa5]">{busy ? "Signing in..." : "Sign in →"}</Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/forgot-password" className="font-medium text-cyan-dark hover:text-navy">Forgot password?</Link>
        <Link href="/register" className="rounded-full bg-cyan/10 px-3 py-1 font-semibold text-navy transition hover:bg-cyan/20">Create account</Link>
      </div>
    </AuthShell>
  );
}
