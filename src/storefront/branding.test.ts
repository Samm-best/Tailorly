import { describe, expect, it } from "vitest";
import { DEFAULT_ACCENT, DEFAULT_BRAND, isHexColor, readableTextOn, resolveTheme } from "@/storefront/branding";

describe("branding", () => {
  it("accepts only #rrggbb", () => {
    expect(isHexColor("#173D78")).toBe(true);
    for (const bad of ["173D78", "#fff", "#12345g", "red", "url(x)", "#173D78;color:red", "", null, undefined]) expect(isHexColor(bad)).toBe(false);
  });
  it("picks readable text colours", () => {
    expect(readableTextOn("#173D78")).toBe("#ffffff");
    expect(readableTextOn("#ffffff")).toBe("#0f172a");
    expect(readableTextOn("#FFD700")).toBe("#0f172a");
    expect(readableTextOn("#000000")).toBe("#ffffff");
  });
  it("falls back to Tailorly colours and never passes unsafe values through", () => {
    expect(resolveTheme(null)).toMatchObject({ brand: DEFAULT_BRAND, accent: DEFAULT_ACCENT });
    expect(resolveTheme({ brandColor: "red;background:url(x)", accentColor: "#ff00aa" })).toMatchObject({ brand: DEFAULT_BRAND, accent: "#ff00aa" });
  });
});
