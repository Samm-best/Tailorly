"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Alert, AuthShell, Button, Field } from "@/components/ui";
import { api, fieldErrors } from "@/lib/client-api";

export default function RegisterPage() {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 10) score++;
    if (/[A-Za-z]/.test(password) && /\d/.test(password)) score++;
    if (/[^A-Za-z\d]/.test(password)) score++;
    return score;
  }, [password]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErrors({}); setFormError(null);
    const r = await api<{ message: string }>("/api/v1/auth/register", {
      body: { fullName: f.get("fullName"), email: f.get("email"), phone: f.get("phone"), password: f.get("password"), confirmPassword: f.get("confirmPassword"), termsAccepted: f.get("termsAccepted") === "on" },
    });
    setBusy(false);
    if (r.ok) setMessage(r.data.message);
    else { setErrors(fieldErrors(r.error)); setFormError(r.error.message); }
  }

  if (message) {
    return (
      <AuthShell title="Check your email">
        <Alert kind="success">{message}</Alert>
        <p className="mt-4 text-sm"><Link href="/login" className="font-medium text-navy underline">Go to sign in</Link></p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="One account for every Tailorly shop.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && !Object.keys(errors).length ? <Alert kind="error">{formError}</Alert> : null}
        <Field label="Full name" name="fullName" autoComplete="name" required error={errors.fullName} />
        <Field label="Email address" name="email" type="email" autoComplete="email" required error={errors.email} />
        <Field label="Phone number" name="phone" type="tel" autoComplete="tel" required error={errors.phone} hint="Use an international format where possible." />
        <div className="relative">
          <Field label="Password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} hint="At least 10 characters with a letter and a number." />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-8 text-xs font-semibold text-navy">{showPassword ? "Hide" : "Show"}</button>
          {password ? <div className="mt-2 flex gap-1" aria-label={`Password strength: ${strength} of 3`}><span className={`h-1.5 flex-1 rounded-full ${strength > 0 ? "bg-rose-400" : "bg-slate-200"}`} /><span className={`h-1.5 flex-1 rounded-full ${strength > 1 ? "bg-amber-400" : "bg-slate-200"}`} /><span className={`h-1.5 flex-1 rounded-full ${strength > 2 ? "bg-emerald-500" : "bg-slate-200"}`} /></div> : null}
        </div>
        <div className="relative">
          <Field label="Confirm password" name="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password" required error={errors.confirmPassword} />
          <button type="button" onClick={() => setShowConfirm((value) => !value)} className="absolute right-3 top-8 text-xs font-semibold text-navy">{showConfirm ? "Hide" : "Show"}</button>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" name="termsAccepted" required className="mt-1 size-4" /> <span>I agree to the <Link href="/terms" className="font-medium text-navy underline">Terms</Link> and <Link href="/privacy" className="font-medium text-navy underline">Privacy Policy</Link>.</span></label>
        <Button type="submit" disabled={busy} className="auth-submit w-full rounded-xl bg-gradient-to-r from-navy to-[#245aa5]">{busy ? "Creating account..." : "Create account →"}</Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">Already registered? <Link href="/login" className="font-semibold text-cyan-dark hover:text-navy">Sign in</Link></p>
    </AuthShell>
  );
}
