import { Types } from "mongoose";
import { connectDb } from "@/db/mongoose";
import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { isTenantImage } from "@/catalogue/images";
import { Tenant } from "@/tenants/models";
import { toPublicShop, type PublicShop } from "@/storefront/serialize";
import { flattenProfilePatch, type ShopProfileUpdate } from "@/storefront/schemas";

const DIRECTORY_PAGE_SIZE = 12;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Public profile of an ACTIVE shop only. Drafts, suspended and archived shops are invisible. */
export async function getPublicShop(tenantId: string): Promise<PublicShop | null> {
  await connectDb();
  const row = await Tenant.findOne({ _id: new Types.ObjectId(tenantId), status: "active" }).lean();
  return row ? toPublicShop(row) : null;
}

export type ShopCard = Pick<PublicShop, "slug" | "name" | "tagline" | "logoUrl" | "brandColor" | "verified"> & { city: string; state: string };

export async function listPublicShops(f: { q?: string; page: number }) {
  await connectDb();
  const filter: Record<string, unknown> = { status: "active" };
  if (f.q) filter.name = { $regex: escapeRegex(f.q), $options: "i" };
  const [rows, total] = await Promise.all([
    Tenant.find(filter).sort({ name: 1 }).skip((f.page - 1) * DIRECTORY_PAGE_SIZE).limit(DIRECTORY_PAGE_SIZE).lean(),
    Tenant.countDocuments(filter),
  ]);
  const items: ShopCard[] = rows.map((r) => {
    const s = toPublicShop(r);
    return { slug: s.slug, name: s.name, tagline: s.tagline, logoUrl: s.logoUrl, brandColor: s.brandColor, verified: s.verified, city: s.contact.city, state: s.contact.state };
  });
  return { items, total, page: f.page, pageSize: DIRECTORY_PAGE_SIZE };
}

export async function updateShopProfile(tenantId: string, patch: ShopProfileUpdate): Promise<PublicShop> {
  await connectDb();
  const { name, logo, ...profilePatch } = patch;
  const { $set, $unset } = flattenProfilePatch(profilePatch);

  if (name !== undefined) $set.name = name;
  if (logo === null) {
    $unset["profile.logoUrl"] = 1;
    $unset["profile.logoPublicId"] = 1;
  } else if (logo) {
    const cloud = getEnv().CLOUDINARY_CLOUD_NAME;
    if (!cloud) throw new AppError("NOT_CONFIGURED", "Image uploads are not configured yet.");
    if (!isTenantImage(logo, tenantId, cloud, "branding")) {
      throw new AppError("VALIDATION_ERROR", "That logo was not uploaded through your shop and cannot be used.");
    }
    $set["profile.logoUrl"] = logo.url;
    $set["profile.logoPublicId"] = logo.publicId;
  }

  const update: Record<string, unknown> = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;
  if (!Object.keys(update).length) throw new AppError("VALIDATION_ERROR", "Nothing to update.");

  const row = await Tenant.findOneAndUpdate({ _id: new Types.ObjectId(tenantId), status: "active" }, update, { new: true }).lean();
  if (!row) throw new AppError("NOT_FOUND", "Shop not found.");
  return toPublicShop(row);
}
