import { effectivePrice, priceRange, productState, variantState, type StockState } from "@/catalogue/availability";

type RawVariant = { _id: unknown; label: string; options?: { size?: string; color?: string; fabric?: string }; sku?: string; price?: number; stock: number };
type RawProduct = {
  _id: unknown; name: string; slug: string; description: string; kind: string; categoryId?: unknown;
  images: { url: string; publicId: string; alt?: string }[]; basePrice: number; compareAtPrice?: number;
  status: string; featured: boolean; tags: string[]; trackStock: boolean; lowStockThreshold: number; variants: RawVariant[];
  createdAt?: Date; updatedAt?: Date;
};

export type PublicVariant = { id: string; label: string; options: { size: string; color: string; fabric: string }; price: number; state: StockState };
export type PublicProduct = {
  id: string; slug: string; name: string; description: string; kind: string; categoryId: string | null;
  images: { url: string; alt: string }[]; price: { min: number; max: number }; compareAtPrice: number | null;
  featured: boolean; tags: string[]; state: StockState; variants: PublicVariant[];
};

/** Public shape: exact stock counts, SKUs, createdBy and publicIds are never exposed to shoppers. */
export function toPublicProduct(p: RawProduct): PublicProduct {
  return {
    id: String(p._id), slug: p.slug, name: p.name, description: p.description, kind: p.kind,
    categoryId: p.categoryId ? String(p.categoryId) : null,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt || p.name })),
    price: priceRange(p), compareAtPrice: p.compareAtPrice ?? null, featured: p.featured, tags: p.tags,
    state: productState(p, p.lowStockThreshold),
    variants: p.variants.map((v) => ({
      id: String(v._id), label: v.label,
      options: { size: v.options?.size ?? "", color: v.options?.color ?? "", fabric: v.options?.fabric ?? "" },
      price: effectivePrice(p.basePrice, v), state: variantState(p.trackStock, v.stock, p.lowStockThreshold),
    })),
  };
}

/** Owner/manager shape: includes exact stock, SKUs and status. */
export function toManageProduct(p: RawProduct) {
  return {
    id: String(p._id), slug: p.slug, name: p.name, description: p.description, kind: p.kind,
    categoryId: p.categoryId ? String(p.categoryId) : null, images: p.images, basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice ?? null, status: p.status, featured: p.featured, tags: p.tags,
    trackStock: p.trackStock, lowStockThreshold: p.lowStockThreshold,
    state: productState(p, p.lowStockThreshold),
    variants: p.variants.map((v) => ({
      id: String(v._id), label: v.label, size: v.options?.size ?? "", color: v.options?.color ?? "",
      fabric: v.options?.fabric ?? "", sku: v.sku ?? "", price: v.price ?? null, stock: v.stock,
    })),
    updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null,
  };
}

export function variantLabel(o: { size?: string; color?: string; fabric?: string }): string {
  const parts = [o.size, o.color, o.fabric].filter(Boolean);
  return parts.length ? parts.join(" / ") : "Standard";
}
