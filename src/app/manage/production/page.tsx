"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card } from "@/components/ui";
import { api } from "@/lib/client-api";
import { ManageShell } from "../shell";

type Job = { id: string; stage: string; notes?: string; dueAt?: string };
const stages = ["order_received", "measurement_confirmed", "fabric_selection", "cutting", "sewing", "fitting", "quality_inspection", "ready_for_collection", "delivered"];
export default function ProductionPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  async function load() { const r = await api<{ jobs: Job[] }>("/api/v1/shop/production"); if (r.ok) setJobs(r.data.jobs); else setError(r.error.message); }
  useEffect(() => { void load(); }, []);
  async function advance(job: Job) {
    const next = stages[stages.indexOf(job.stage) + 1]; if (!next) return;
    const r = await api(`/api/v1/shop/production/${job.id}`, { method: "PATCH", body: { stage: next } });
    if (r.ok) void load(); else setError(r.error.message);
  }
  return <ManageShell title="Production"><div className="space-y-4">{error ? <Alert kind="error">{error}</Alert> : null}{!jobs.length ? <Card><p className="text-sm text-slate-600">No production jobs yet. Create one from a paid order.</p></Card> : jobs.map((job) => <Card key={job.id} title={job.stage.replaceAll("_", " ")}><p className="text-sm text-slate-600">{job.notes || "No notes"}</p><Button className="mt-3" onClick={() => void advance(job)} disabled={job.stage === stages.at(-1)}>Move to next stage</Button></Card>)}</div></ManageShell>;
}
