import { describe, expect, it } from "vitest";
import { productInputSchema, productUpdateSchema, stockAdjustSchema } from "@/catalogue/schemas";

describe("product input", () => {
  it("applies safe defaults and always has at least one variant", () => {
    const p = productInputSchema.parse({ name: "Senator Suit", basePrice: 3_500_000 });
    expect(p.status).toBe("draft");
    expect(p.variants).toHaveLength(1);
    expect(p.variants[0]!.stock).toBe(0);
    expect(p.trackStock).toBe(true);
  });
  it("rejects float prices, negative stock and duplicate variants", () => {
    expect(productInputSchema.safeParse({ name: "Suit", basePrice: 10.5 }).success).toBe(false);
    expect(productInputSchema.safeParse({ name: "Suit", basePrice: 100, variants: [{ size: "M", stock: -1 }] }).success).toBe(false);
    expect(productInputSchema.safeParse({ name: "Suit", basePrice: 100, variants: [{ size: "M" }, { size: "m" }] }).success).toBe(false);
  });
  it("cannot be given a tenantId, createdBy or slug by the client", () => {
    for (const key of ["tenantId", "createdBy", "slug", "currency"]) {
      expect(productInputSchema.safeParse({ name: "Suit", basePrice: 100, [key]: "x" }).success).toBe(false);
      expect(productUpdateSchema.safeParse({ [key]: "x" }).success).toBe(false);
    }
  });
  it("requires compare-at above price", () => {
    expect(productInputSchema.safeParse({ name: "Suit", basePrice: 100, compareAtPrice: 100 }).success).toBe(false);
    expect(productInputSchema.safeParse({ name: "Suit", basePrice: 100, compareAtPrice: 150 }).success).toBe(true);
  });
});

describe("stock adjustment", () => {
  it("needs a non-zero integer change and a known reason", () => {
    const base = { variantId: "64b0000000000000000000a1", reason: "restock" };
    expect(stockAdjustSchema.safeParse({ ...base, delta: 5 }).success).toBe(true);
    expect(stockAdjustSchema.safeParse({ ...base, delta: 0 }).success).toBe(false);
    expect(stockAdjustSchema.safeParse({ ...base, delta: 1.5 }).success).toBe(false);
    expect(stockAdjustSchema.safeParse({ ...base, delta: 1, reason: "sale" }).success).toBe(false);
  });
});
