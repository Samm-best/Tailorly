"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Alert, AuthShell } from "@/components/ui";
import { api } from "@/lib/client-api";

type State = { kind: "working" } | { kind: "ok" } | { kind: "error"; message: string };

export default function VerifyEmailPage() {
  const [state, setState] = useState<State>({ kind: "working" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // React strict mode runs effects twice; the token is single-use
    started.current = true;
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setState({ kind: "error", message: "This verification link is incomplete." }); return; }
    api("/api/v1/auth/verify-email", { body: { token } }).then((r) =>
      setState(r.ok ? { kind: "ok" } : { kind: "error", message: r.error.message }),
    );
  }, []);

  return (
    <AuthShell title="Email verification">
      {state.kind === "working" ? <p className="text-sm text-slate-600">Verifying your email...</p> : null}
      {state.kind === "ok" ? <Alert kind="success">Your email is verified. You can sign in now.</Alert> : null}
      {state.kind === "error" ? <Alert kind="error">{state.message} Sign in to request a new link.</Alert> : null}
      <p className="mt-4 text-sm"><Link href="/login" className="font-medium text-navy underline">Go to sign in</Link></p>
    </AuthShell>
  );
}
