import { describe, expect, it } from "vitest";
import { cartInputSchema, customOrderInputSchema, measurementInputSchema } from "@/orders/schemas";

describe("measurements and custom orders", () => {
  it("requires explicit sharing for a measurement profile", () => {
    const result = measurementInputSchema.parse({ name: "Wedding", values: { chest: 92 } });
    expect(result.sharing).toBe("private");
    expect(measurementInputSchema.safeParse({ name: "Empty", values: {} }).success).toBe(false);
  });
  it("rejects client-controlled tenant and status fields", () => {
    expect(customOrderInputSchema.safeParse({ title: "Kaftan", description: "Blue", tenantId: "x", status: "accepted" }).success).toBe(false);
  });
});

describe("cart input", () => {
  it("accepts bounded quantities and rejects invalid identifiers", () => {
    const base = { productId: "64b0000000000000000000a1", variantId: "64b0000000000000000000a2" };
    expect(cartInputSchema.safeParse({ items: [{ ...base, quantity: 2 }] }).success).toBe(true);
    expect(cartInputSchema.safeParse({ items: [{ ...base, quantity: 0 }] }).success).toBe(false);
    expect(cartInputSchema.safeParse({ items: [{ ...base, quantity: 101 }] }).success).toBe(false);
  });
});
