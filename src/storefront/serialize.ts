import type { TenantProfile } from "@/tenants/models";

/** Everything a visitor may see about a shop. Deliberately excludes owner ids, status internals and email of the owner account. */
export type PublicShop = {
  id: string;
  slug: string;
  name: string;
  verified: boolean;
  tagline: string;
  description: string;
  vision: string;
  mission: string;
  logoUrl: string;
  brandColor: string;
  accentColor: string;
  contact: { email: string; phone: string; address: string; city: string; state: string };
  policies: { delivery: string; returns: string; payment: string; alterations: string };
  social: { instagram: string; facebook: string; tiktok: string; whatsapp: string };
};

type ShopRow = { _id: unknown; slug: string; name: string; verifiedAt?: Date | null; profile?: TenantProfile | null };

export function toPublicShop(row: ShopRow): PublicShop {
  const p = row.profile ?? {};
  return {
    id: String(row._id),
    slug: row.slug,
    name: row.name,
    // A trust badge is shown only when platform staff actually recorded verification.
    verified: Boolean(row.verifiedAt),
    tagline: p.tagline ?? "",
    description: p.description ?? "",
    vision: p.vision ?? "",
    mission: p.mission ?? "",
    logoUrl: p.logoUrl ?? "",
    brandColor: p.brandColor ?? "",
    accentColor: p.accentColor ?? "",
    contact: {
      email: p.contact?.email ?? "", phone: p.contact?.phone ?? "", address: p.contact?.address ?? "",
      city: p.contact?.city ?? "", state: p.contact?.state ?? "",
    },
    policies: {
      delivery: p.policies?.delivery ?? "", returns: p.policies?.returns ?? "",
      payment: p.policies?.payment ?? "", alterations: p.policies?.alterations ?? "",
    },
    social: {
      instagram: p.social?.instagram ?? "", facebook: p.social?.facebook ?? "",
      tiktok: p.social?.tiktok ?? "", whatsapp: p.social?.whatsapp ?? "",
    },
  };
}
