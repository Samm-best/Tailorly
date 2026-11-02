import { z } from "zod";
import { objectId } from "@/customers/schemas";

const text = (max: number) => z.string().trim().min(1).max(max);
const measurementValue = z.number().finite().positive().max(1000);

export const measurementInputSchema = z.object({
  name: text(80),
  values: z.record(z.string().trim().min(1).max(40), measurementValue).refine((v) => Object.keys(v).length > 0, "Add at least one measurement."),
  notes: z.string().trim().max(500).optional(),
  sharing: z.enum(["private", "shared"]).default("private"),
}).strict();

export const customOrderInputSchema = z.object({
  title: text(140),
  description: text(5000),
  measurementProfileId: objectId.optional(),
  referenceImages: z.array(z.object({ url: z.string().url().max(500), publicId: text(200) }).strict()).max(5).default([]),
}).strict();

export const quoteInputSchema = z.object({
  amount: z.number().int().positive().max(1_000_000_000),
  note: z.string().trim().max(1000).optional(),
  expiresAt: z.coerce.date().optional(),
}).strict();

export const cartItemSchema = z.object({ productId: objectId, variantId: objectId, quantity: z.number().int().min(1).max(100) }).strict();
export const cartInputSchema = z.object({ items: z.array(cartItemSchema).max(50) }).strict();
export const checkoutSchema = z.object({ idempotencyKey: z.string().trim().min(16).max(100) }).strict();
