export function slugify(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return base || "item";
}

/** Returns `base`, or `base-2`, `base-3`... the first one that `isTaken` says is free. */
export async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  let candidate = base;
  for (let i = 2; i < 200; i++) {
    if (!(await isTaken(candidate))) return candidate;
    candidate = `${base.slice(0, 74)}-${i}`;
  }
  return `${base.slice(0, 60)}-${Date.now().toString(36)}`;
}
