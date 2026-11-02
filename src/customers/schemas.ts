import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

export const profileUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional(),
    phone: z.union([z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number"), z.literal("")]).optional(),
    marketingEmails: z.boolean().optional(),
    profileImage: z.object({ url: z.string().url().max(500), publicId: z.string().min(1).max(200) }).nullable().optional(),
  })
  .strict();

const addressBase = z.object({
  label: z.string().trim().min(1).max(40),
  recipientName: z.string().trim().min(2).max(100),
  phone: z.union([z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number"), z.literal("")]).optional(),
  line1: z.string().trim().min(3).max(200),
  line2: optionalText(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  country: z.string().trim().length(2).toUpperCase(),
  postalCode: optionalText(20),
  isDefault: z.boolean(),
});

export const addressSchema = addressBase.extend({
  country: z.string().trim().length(2).toUpperCase().default("NG"),
  isDefault: z.boolean().default(false),
});

// No defaults here: a PATCH must only change the fields the client actually sent.
export const addressUpdateSchema = addressBase.partial().strict();

export const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().datetime().optional(),
  unreadOnly: z.enum(["true", "false"]).default("false"),
});

export const markReadSchema = z
  .object({ ids: z.array(objectId).max(100).optional(), all: z.boolean().optional() })
  .refine((v) => v.all === true || (v.ids && v.ids.length > 0), "Provide ids or all: true");

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
  confirm: z.literal("DELETE"),
});

export { objectId };
