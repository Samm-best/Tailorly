export type VariantLike = { stock: number; price?: number | null };
export type ProductLike = { basePrice: number; trackStock: boolean; variants: VariantLike[] };

export type StockState = "in_stock" | "low_stock" | "out_of_stock";

/** Single source of truth for "can this be bought?" - Phase 7 checkout must reuse it. */
export function variantState(trackStock: boolean, stock: number, lowThreshold: number): StockState {
  if (!trackStock) return "in_stock";
  if (stock <= 0) return "out_of_stock";
  return stock <= lowThreshold ? "low_stock" : "in_stock";
}

export function productState(p: ProductLike, lowThreshold: number): StockState {
  if (!p.trackStock) return "in_stock";
  const states = p.variants.map((v) => variantState(true, v.stock, lowThreshold));
  if (states.length === 0 || states.every((s) => s === "out_of_stock")) return "out_of_stock";
  return states.includes("in_stock") ? "in_stock" : "low_stock";
}

export function effectivePrice(basePrice: number, variant: { price?: number | null }): number {
  return typeof variant.price === "number" ? variant.price : basePrice;
}

export function priceRange(p: ProductLike): { min: number; max: number } {
  const prices = p.variants.length ? p.variants.map((v) => effectivePrice(p.basePrice, v)) : [p.basePrice];
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
