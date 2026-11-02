"use client";

import { useEffect, useState } from "react";
import { Alert, BrandMark, Card } from "@/components/ui";
import { api } from "@/lib/client-api";

type Job = { id: string; stage: string; notes?: string };
export default function AccountProductionPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<{ jobs: Job[] }>("/api/v1/account/production").then((r) => { if (r.ok) setJobs(r.data.jobs); else if (r.error.code === "UNAUTHENTICATED") window.location.assign("/login?next=/account/production"); else setError(r.error.message); }); }, []);
  return <main className="mx-auto max-w-3xl space-y-5 px-4 py-8"><BrandMark /><h1 className="text-2xl font-semibold text-navy">Sewing progress</h1>{error ? <Alert kind="error">{error}</Alert> : null}{!jobs.length && !error ? <p className="text-sm text-slate-600">No active production jobs.</p> : jobs.map((job) => <Card key={job.id} title={job.stage.replaceAll("_", " ")}><p className="text-sm text-slate-600">{job.notes || "Your shop will add updates here."}</p></Card>)}</main>;
}
