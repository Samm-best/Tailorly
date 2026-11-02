"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui";
import { api } from "@/lib/client-api";
import { ProfileSection, type PublicUser } from "../sections";

type Me = { user: PublicUser };

export default function ProfilePage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Me>("/api/v1/auth/me").then((result) => {
      if (result.ok) setUser(result.data.user);
      else if (result.error.code === "UNAUTHENTICATED") window.location.assign("/login?next=/account/profile");
      else setError(result.error.message);
    }).catch(() => setError("We could not load your profile. Please try again."));
  }, []);

  if (error) return <main className="mx-auto max-w-md px-4 py-16"><Alert kind="error">{error}</Alert></main>;
  if (!user) return <main className="min-h-screen bg-slate-50 px-4 py-16 text-center text-sm text-slate-600">Loading your profile...</main>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/account" className="text-sm font-semibold text-cyan-dark">← Back to dashboard</Link>
        <h1 className="mt-6 text-2xl font-semibold text-navy">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your personal information and account preferences.</p>
        <div className="mt-6">
          <ProfileSection user={user} onUpdated={setUser} />
        </div>
      </div>
    </main>
  );
}
