import { z } from "zod";
import { objectId } from "@/customers/schemas";
import { PRODUCT_KINDS, PRODUCT_STATUSES } from "@/catalogue/constants";

const text = (max: number) => z.string().trim().max(max);
const kobo = z.number().int().min(0).max(1_000_000_000);

export const categoryInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: text(500).optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
export const categoryUpdateSchema = categoryInputSchema.partial().strict();

export const imageInputSchema = z.object({
  url: z.string().url().max(500),
  publicId: z.string().min(1).max(200),
  alt: text(140).optional(),
});

const optionField = text(40).optional().transform((v) => (v ? v : undefined));

export const variantInputSchema = z
  .object({
    id: objectId.optional(), // present = existing variant (its stock is kept); absent = new variant
    size: optionField,
    color: optionField,
    fabric: z.string().trim().max(60).optional().transform((v) => (v ? v : undefined)),
    sku: z.string().trim().max(60).optional().transform((v) => (v ? v : undefined)),
    price: kobo.optional(),
    stock: z.number().int().min(0).max(100_000).default(0), // initial stock for NEW variants only
  })
  .strict();

const productFields = {
  name: z.string().trim().min(2).max(140),
  description: text(5000).default(""),
  kind: z.enum(PRODUCT_KINDS).default("ready_made"),
  categoryId: objectId.nullable().optional(),
  images: z.array(imageInputSchema).max(8).default([]),
  basePrice: kobo,
  compareAtPrice: kobo.optional(),
  status: z.enum(PRODUCT_STATUSES).default("draft"),
  featured: z.boolean().default(false),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10).default([]),
  trackStock: z.boolean().default(true),
  lowStockThreshold: z.number().int().min(0).max(1000).default(3),
  variants: z.array(variantInputSchema).min(1).max(50).prefault([{}]), // no options given -> one "Standard" variant with 0 stock (parsed, so defaults apply)
};

function distinctOptions(v: { variants?: { size?: string; color?: string; fabric?: string }[] }): boolean {
  if (!v.variants) return true;
  const keys = v.variants.map((x) => `${x.size ?? ""}|${x.color ?? ""}|${x.fabric ?? ""}`.toLowerCase());
  return new Set(keys).size === keys.length;
}

export const productInputSchema = z
  .object(productFields)
  .strict()
  .refine(distinctOptions, { message: "Two variants have the same size, colour and fabric.", path: ["variants"] })
  .refine((v) => v.compareAtPrice === undefined || v.compareAtPrice > v.basePrice, { message: "Compare-at price must be higher than the price.", path: ["compareAtPrice"] });

export const productUpdateSchema = z
  .object({
    name: productFields.name.optional(),
    description: text(5000).optional(),
    kind: z.enum(PRODUCT_KINDS).optional(),
    categoryId: objectId.nullable().optional(),
    images: z.array(imageInputSchema).max(8).optional(),
    basePrice: kobo.optional(),
    compareAtPrice: kobo.nullable().optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
    featured: z.boolean().optional(),
    tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10).optional(),
    trackStock: z.boolean().optional(),
    lowStockThreshold: z.number().int().min(0).max(1000).optional(),
    variants: z.array(variantInputSchema).min(1).max(50).optional(),
  })
  .strict()
  .refine(distinctOptions, { message: "Two variants have the same size, colour and fabric.", path: ["variants"] });

export const stockAdjustSchema = z
  .object({
    variantId: objectId,
    delta: z.number().int().min(-100_000).max(100_000).refine((n) => n !== 0, "Change cannot be zero."),
    reason: z.enum(["restock", "correction", "damaged"]),
    note: text(300).optional(),
  })
  .strict();

export const manageListQuerySchema = z.object({
  status: z.enum(PRODUCT_STATUSES).optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export const publicListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().toLowerCase().max(80).optional(),
  kind: z.enum(PRODUCT_KINDS).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
