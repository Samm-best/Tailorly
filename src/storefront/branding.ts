export const DEFAULT_BRAND = "#173D78"; // Tailorly navy
export const DEFAULT_ACCENT = "#21B8C9"; // Tailorly cyan

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value);
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a #rrggbb colour. */
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** Picks white or near-black text, whichever has the higher contrast on the given background. */
export function readableTextOn(hex: string): "#ffffff" | "#0f172a" {
  const l = luminance(hex);
  const contrastWhite = 1.05 / (l + 0.05);
  const contrastDark = (l + 0.05) / (luminance("#0f172a") + 0.05);
  return contrastWhite >= contrastDark ? "#ffffff" : "#0f172a";
}

export type ShopTheme = { brand: string; accent: string; onBrand: string; onAccent: string };

/** Shop colours with safe fallbacks. Only validated hex values ever reach a style attribute. */
export function resolveTheme(profile?: { brandColor?: string; accentColor?: string } | null): ShopTheme {
  const brand = isHexColor(profile?.brandColor) ? profile!.brandColor! : DEFAULT_BRAND;
  const accent = isHexColor(profile?.accentColor) ? profile!.accentColor! : DEFAULT_ACCENT;
  return { brand, accent, onBrand: readableTextOn(brand), onAccent: readableTextOn(accent) };
}
