import { describe, expect, it } from "vitest";
import { effectivePrice, priceRange, productState, variantState } from "@/catalogue/availability";
import { isTenantImage, signUploadParams, tenantFolder } from "@/catalogue/images";
import { formatNaira, koboToNairaString, parseNairaToKobo } from "@/catalogue/money";
import { toPublicProduct, variantLabel } from "@/catalogue/serialize";
import { slugify, uniqueSlug } from "@/catalogue/slug";

describe("money", () => {
  it("parses naira to integer kobo without float error", () => {
    expect(parseNairaToKobo("12,500")).toBe(1_250_000);
    expect(parseNairaToKobo("0.1")).toBe(10);
    expect(parseNairaToKobo("19.99")).toBe(1999);
    for (const bad of ["", "-5", "1e5", "12.345", "abc", "1,2,3x"]) expect(parseNairaToKobo(bad)).toBeNull();
  });
  it("formats", () => {
    expect(formatNaira(1_250_000)).toBe("\u20A612,500");
    expect(formatNaira(1999)).toBe("\u20A619.99");
    expect(koboToNairaString(1_250_000)).toBe("12500");
    expect(koboToNairaString(1999)).toBe("19.99");
  });
});

describe("slug", () => {
  it("slugifies", () => {
    expect(slugify("Ankara Dress & Wrapper!")).toBe("ankara-dress-and-wrapper");
    expect(slugify("  Crème Brûlée  ")).toBe("creme-brulee");
    expect(slugify("???")).toBe("item");
  });
  it("finds a free slug", async () => {
    const taken = new Set(["suit", "suit-2"]);
    expect(await uniqueSlug("suit", async (s) => taken.has(s))).toBe("suit-3");
    expect(await uniqueSlug("agbada", async (s) => taken.has(s))).toBe("agbada");
  });
});

describe("availability", () => {
  it("derives stock state", () => {
    expect(variantState(true, 0, 3)).toBe("out_of_stock");
    expect(variantState(true, 3, 3)).toBe("low_stock");
    expect(variantState(true, 4, 3)).toBe("in_stock");
    expect(variantState(false, 0, 3)).toBe("in_stock");
  });
  it("is out of stock only when every variant is", () => {
    const p = { basePrice: 100, trackStock: true, variants: [{ stock: 0 }, { stock: 9 }] };
    expect(productState(p, 3)).toBe("in_stock");
    expect(productState({ ...p, variants: [{ stock: 0 }, { stock: 0 }] }, 3)).toBe("out_of_stock");
    expect(productState({ ...p, variants: [{ stock: 0 }, { stock: 2 }] }, 3)).toBe("low_stock");
  });
  it("uses variant price overrides", () => {
    expect(effectivePrice(100, { price: 150 })).toBe(150);
    expect(effectivePrice(100, {})).toBe(100);
    expect(priceRange({ basePrice: 100, trackStock: true, variants: [{ stock: 1 }, { stock: 1, price: 250 }] })).toEqual({ min: 100, max: 250 });
  });
});

describe("tenant-scoped images", () => {
  const cloud = "demo";
  const tenant = "64b0000000000000000000a1";
  const other = "64b0000000000000000000b2";
  const good = { publicId: `${tenantFolder(tenant, "products")}/abc`, url: `https://res.cloudinary.com/${cloud}/image/upload/v1/${tenantFolder(tenant, "products")}/abc.jpg` };
  it("accepts an image from the shop's own folder", () => expect(isTenantImage(good, tenant, cloud, "products")).toBe(true));
  it("rejects another shop's folder, wrong area, wrong host, wrong cloud, traversal", () => {
    expect(isTenantImage(good, other, cloud, "products")).toBe(false);
    expect(isTenantImage(good, tenant, cloud, "branding")).toBe(false);
    expect(isTenantImage({ ...good, url: good.url.replace("res.cloudinary.com", "evil.com") }, tenant, cloud, "products")).toBe(false);
    expect(isTenantImage(good, tenant, "someone-else", "products")).toBe(false);
    expect(isTenantImage({ ...good, publicId: `${tenantFolder(tenant, "products")}/../../x` }, tenant, cloud, "products")).toBe(false);
    expect(isTenantImage({ ...good, url: "http://res.cloudinary.com/demo/image/upload/x" }, tenant, cloud, "products")).toBe(false);
    expect(isTenantImage({ ...good, url: "https://u:p@res.cloudinary.com/demo/image/upload/x" }, tenant, cloud, "products")).toBe(false);
  });
  it("rejects a URL that points at another shop's file but embeds this shop's public id", () => {
    const mine = `${tenantFolder(tenant, "products")}/abc`;
    const theirs = `${tenantFolder(other, "products")}/secret`;
    const crafted = { publicId: mine, url: `https://res.cloudinary.com/${cloud}/image/upload/v1/${theirs}.jpg/${mine}` };
    expect(isTenantImage(crafted, tenant, cloud, "products")).toBe(false);
    expect(isTenantImage({ publicId: mine, url: `https://res.cloudinary.com/${cloud}/image/upload/${theirs}.jpg` }, tenant, cloud, "products")).toBe(false);
    expect(isTenantImage({ publicId: mine, url: `https://res.cloudinary.com/${cloud}/image/upload/${mine}/../../x.jpg` }, tenant, cloud, "products")).toBe(false);
  });
  it("accepts the same public id with and without a version segment or extension", () => {
    const id = `${tenantFolder(tenant, "products")}/abc`;
    for (const path of [`${id}`, `${id}.webp`, `v1700000000/${id}.png`]) {
      expect(isTenantImage({ publicId: id, url: `https://res.cloudinary.com/${cloud}/image/upload/${path}` }, tenant, cloud, "products")).toBe(true);
    }
  });
  it("signs like Cloudinary (documented example)", () => {
    // From Cloudinary docs: timestamp=1315060510, public_id=sample, secret abcd => known sha1
    expect(signUploadParams({ timestamp: 1315060510, public_id: "sample" }, "abcd")).toBe("c3470533147774275dd37996cc4d0e68fd03cd4f");
  });
});

describe("public product shape", () => {
  const raw = {
    _id: "1", name: "Agbada", slug: "agbada", description: "d", kind: "ready_made", images: [{ url: "https://x/y.jpg", publicId: "secret/id" }],
    basePrice: 5000, status: "published", featured: false, tags: [], trackStock: true, lowStockThreshold: 3,
    variants: [{ _id: "v1", label: "M", options: { size: "M" }, sku: "SKU-1", stock: 7 }],
  };
  it("never exposes exact stock, sku, publicId or status", () => {
    const json = JSON.stringify(toPublicProduct(raw));
    expect(json).not.toMatch(/SKU-1|secret\/id|"stock"|"status"|createdBy/);
    expect(toPublicProduct(raw).variants[0]!.state).toBe("in_stock");
  });
  it("labels variants", () => {
    expect(variantLabel({ size: "M", color: "Blue" })).toBe("M / Blue");
    expect(variantLabel({})).toBe("Standard");
  });
});
