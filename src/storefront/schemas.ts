import { z } from "zod";

const blank = z.literal("");
const hex = z.union([z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a colour like #173D78"), blank]);
const phone = z.union([z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number"), blank]);
const httpsUrl = z.union([
  z.string().trim().max(200).url().refine((u) => u.startsWith("https://"), "Link must start with https://"),
  blank,
]);
const text = (max: number) => z.string().trim().max(max);

/** Owner/manager edits to the public shop profile. "" clears a field. Nothing here can touch status, slug or verification. */
export const shopProfileUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    tagline: text(140).optional(),
    description: text(2000).optional(),
    vision: text(600).optional(),
    mission: text(600).optional(),
    brandColor: hex.optional(),
    accentColor: hex.optional(),
    logo: z.object({ url: z.string().url().max(500), publicId: z.string().min(1).max(200) }).nullable().optional(),
    contact: z
      .object({
        email: z.union([z.string().trim().email().max(200), blank]).optional(),
        phone: phone.optional(),
        address: text(300).optional(),
        city: text(100).optional(),
        state: text(100).optional(),
      })
      .strict()
      .optional(),
    policies: z
      .object({ delivery: text(1500).optional(), returns: text(1500).optional(), payment: text(1500).optional(), alterations: text(1500).optional() })
      .strict()
      .optional(),
    social: z
      .object({ instagram: httpsUrl.optional(), facebook: httpsUrl.optional(), tiktok: httpsUrl.optional(), whatsapp: phone.optional() })
      .strict()
      .optional(),
  })
  .strict();

export const shopDirectoryQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export const signUploadSchema = z.object({ area: z.enum(["products", "branding", "custom-orders", "profile"]) }).strict();

export type ShopProfileUpdate = z.infer<typeof shopProfileUpdateSchema>;

/** Flattens nested patch objects into Mongo dotted paths. "" -> unset, so owners can clear a field. */
export function flattenProfilePatch(patch: Omit<ShopProfileUpdate, "name" | "logo">): { $set: Record<string, string>; $unset: Record<string, 1> } {
  const $set: Record<string, string> = {};
  const $unset: Record<string, 1> = {};
  const walk = (value: unknown, path: string) => {
    if (value === undefined) return;
    if (value !== null && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
      return;
    }
    if (typeof value === "string") {
      if (value === "") $unset[path] = 1;
      else $set[path] = value;
    }
  };
  walk(patch, "profile");
  return { $set, $unset };
}
