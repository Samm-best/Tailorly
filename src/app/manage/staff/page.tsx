"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api } from "@/lib/client-api";
import { ManageShell } from "../shell";

type Permission = { id: string; label: string };
type Staff = { userId: string; fullName: string; email: string; role: string; permissions: string[] };
type Response = { staff: Staff[]; roles: string[]; permissions: string[] };

export default function StaffPage() {
  const [data, setData] = useState<Response | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  async function load() { const result = await api<Response>("/api/v1/shop/staff"); if (result.ok) setData(result.data); else setError(result.error.message); }
  useEffect(() => { void load(); }, []);
  async function assign(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    const result = await api("/api/v1/shop/staff", { method: "POST", body: { email, role } });
    setBusy(false); if (result.ok) { setEmail(""); void load(); } else setError(result.error.message);
  }
  async function remove(userId: string) {
    if (!window.confirm("Remove this person's access to the shop?")) return;
    const result = await api(`/api/v1/shop/staff/${userId}`, { method: "DELETE", body: {} });
    if (result.ok) void load(); else setError(result.error.message);
  }
  async function savePermissions(member: Staff) {
    const result = await api(`/api/v1/shop/staff/${member.userId}`, { method: "PATCH", body: { role: member.role, permissions: member.permissions } });
    if (result.ok) { setEditing(null); void load(); } else setError(result.error.message);
  }
  return <ManageShell title="Staff & permissions">
    <div className="space-y-5">
      {error ? <Alert kind="error">{error}</Alert> : null}
      <Card title="Assign staff">
        <form className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end" onSubmit={(event) => void assign(event)}>
          <Field label="Registered user email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label className="text-sm font-medium text-slate-800">Role<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3">{(data?.roles ?? ["manager", "tailor", "staff", "delivery"]).filter((item) => item !== "owner").map((item) => <option key={item}>{item}</option>)}</select></label>
          <Button type="submit" disabled={busy}>{busy ? "Assigning..." : "Assign"}</Button>
        </form>
        <p className="mt-3 text-xs text-slate-500">The person must have a Tailorly account. Their permissions apply only to this shop.</p>
      </Card>
      <Card title="Current staff">
        {!data?.staff.length ? <p className="text-sm text-slate-600">No staff members assigned.</p> : <div className="divide-y divide-slate-100">{data.staff.map((member) => <div key={member.userId} className="py-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium text-navy">{member.fullName}</p><p className="text-sm text-slate-500">{member.email} · {member.role}</p><p className="text-xs text-slate-500">{member.permissions.length} permissions enabled</p></div>{member.role !== "owner" ? <div className="flex gap-2"><Button variant="ghost" onClick={() => setEditing(editing === member.userId ? null : member.userId)}>{editing === member.userId ? "Close" : "Permissions"}</Button><Button variant="danger" onClick={() => void remove(member.userId)}>Remove</Button></div> : <span className="text-xs font-semibold text-cyan-dark">Owner</span>}</div>{editing === member.userId ? <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">{data.permissions.map((permission) => <label key={permission} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={member.permissions.includes(permission)} onChange={(event) => { const permissions = event.target.checked ? [...member.permissions, permission] : member.permissions.filter((item) => item !== permission); setData((current) => current ? { ...current, staff: current.staff.map((item) => item.userId === member.userId ? { ...item, permissions } : item) } : current); }} />{permission}</label>)}<Button className="sm:col-span-2" onClick={() => void savePermissions(member)}>Save permissions</Button></div> : null}</div>)}</div>}
      </Card>
    </div>
  </ManageShell>;
}
