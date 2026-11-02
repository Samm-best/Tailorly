import { describe, expect, it } from "vitest";
import { toPublicShop } from "@/storefront/serialize";
import { flattenProfilePatch, shopProfileUpdateSchema } from "@/storefront/schemas";

describe("public shop shape", () => {
  it("exposes only public fields and shows the badge only when verified", () => {
    const row = { _id: "1", slug: "royal", name: "Royal", ownerUserId: "secret-owner", status: "active", profile: { tagline: "Hi" } };
    const shop = toPublicShop(row as never);
    expect(JSON.stringify(shop)).not.toMatch(/secret-owner|ownerUserId|status/);
    expect(shop.verified).toBe(false);
    expect(toPublicShop({ ...row, verifiedAt: new Date() } as never).verified).toBe(true);
  });
});

describe("profile patch", () => {
  it("flattens nested fields and turns empty strings into unsets", () => {
    const { $set, $unset } = flattenProfilePatch({ tagline: "Made for you", contact: { phone: "", city: "Aba" }, social: { instagram: "https://instagram.com/x" } });
    expect($set).toEqual({ "profile.tagline": "Made for you", "profile.contact.city": "Aba", "profile.social.instagram": "https://instagram.com/x" });
    expect($unset).toEqual({ "profile.contact.phone": 1 });
  });
  it("rejects unsafe values and unknown keys (status, slug, verification cannot be set)", () => {
    expect(shopProfileUpdateSchema.safeParse({ brandColor: "red" }).success).toBe(false);
    expect(shopProfileUpdateSchema.safeParse({ social: { instagram: "javascript:alert(1)" } }).success).toBe(false);
    expect(shopProfileUpdateSchema.safeParse({ social: { instagram: "http://insecure.example" } }).success).toBe(false);
    for (const key of ["status", "slug", "verifiedAt", "ownerUserId", "tenantId"]) {
      expect(shopProfileUpdateSchema.safeParse({ [key]: "x" }).success).toBe(false);
    }
    expect(shopProfileUpdateSchema.safeParse({ brandColor: "#173D78", contact: { email: "" } }).success).toBe(true);
  });
});
