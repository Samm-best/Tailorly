"use client";

import { useEffect, useState, type ReactNode } from "react";

type ThemeMode = "light" | "dark" | "system";
type Accent = "blue" | "cyan" | "purple" | "green" | "rose" | "amber";

const STORAGE_KEY = "tailorly-appearance";

function applyAppearance(mode: ThemeMode, accent: Accent) {
  const root = document.documentElement;
  const resolved = mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;
  root.dataset.theme = resolved;
  root.dataset.accent = accent;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance] = useState<{ mode: ThemeMode; accent: Accent }>(() => {
    if (typeof window === "undefined") return { mode: "system", accent: "blue" };
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { mode?: ThemeMode; accent?: Accent };
        return { mode: parsed.mode ?? "system", accent: parsed.accent ?? "blue" };
      }
    } catch {
      // Preferences are optional; the provider supplies the safe default.
    }
    return { mode: "system", accent: "blue" };
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) applyAppearance(appearance.mode, appearance.accent);
      else applyAppearance("system", "blue");
    } catch {
      applyAppearance("system", "blue");
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) applyAppearance("system", "blue");
      else {
        const parsed = JSON.parse(saved) as { mode?: ThemeMode; accent?: Accent };
        if ((parsed.mode ?? "system") === "system") applyAppearance("system", parsed.accent ?? "blue");
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [appearance.accent, appearance.mode]);

  useEffect(() => {
    applyAppearance(appearance.mode, appearance.accent);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
  }, [appearance]);

  return <>{children}</>;
}

export function AppearanceControl({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [appearance, setAppearance] = useState<{ mode: ThemeMode; accent: Accent }>(() => {
    if (typeof window === "undefined") return { mode: "system", accent: "blue" };
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as { mode: ThemeMode; accent: Accent };
    } catch {
      // Preferences are optional; the provider supplies the safe default.
    }
    return { mode: "system", accent: "blue" };
  });

  function update(next: Partial<typeof appearance>) {
    setAppearance((current) => ({ ...current, ...next }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...appearance, ...next }));
    applyAppearance(next.mode ?? appearance.mode, next.accent ?? appearance.accent);
  }

  return (
    <div className="relative">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-cyan hover:text-navy ${compact ? "px-2" : ""}`}>
        <span aria-hidden="true">◐</span>{compact ? <span className="sr-only">Appearance</span> : "Appearance"}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <p className="text-sm font-semibold text-navy">Personalise Tailorly</p>
          <label className="mt-3 block text-xs font-medium text-slate-500">Theme mode<select value={appearance.mode} onChange={(event) => update({ mode: event.target.value as ThemeMode })} className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800"><option value="light">Light mode</option><option value="dark">Night mode</option><option value="system">System default</option></select></label>
          <fieldset className="mt-3"><legend className="text-xs font-medium text-slate-500">Accent colour</legend><div className="mt-2 grid grid-cols-3 gap-2">{(["blue", "cyan", "purple", "green", "rose", "amber"] as Accent[]).map((accent) => <button key={accent} type="button" aria-label={`${accent} accent`} aria-pressed={appearance.accent === accent} onClick={() => update({ accent })} className={`h-8 rounded-lg border-2 ${appearance.accent === accent ? "border-navy" : "border-transparent"}`} style={{ background: accent === "blue" ? "#173d78" : `var(--${accent}-accent, ${accent === "cyan" ? "#21b8c9" : accent === "purple" ? "#9b8cff" : accent === "green" ? "#37c98b" : accent === "rose" ? "#f07f9a" : "#e7ad45"})` }}><span className="sr-only">{accent}</span></button>)}</div></fieldset>
        </div>
      ) : null}
    </div>
  );
}
