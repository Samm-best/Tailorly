import { describe, expect, it } from "vitest";
import { isValidSlug, normalizeHost, resolveHost } from "@/tenancy/host";

describe("normalizeHost", () => {
  it("lowercases, strips port and trailing dot", () => {
    expect(normalizeHost("RoyalStitches.Tailorly.com:3000")).toBe("royalstitches.tailorly.com");
    expect(normalizeHost("tailorly.com.")).toBe("tailorly.com");
  });
  it("rejects malformed hosts", () => {
    for (const bad of ["", null, undefined, "a..b", "exa mple.com", "evil.com/path", "a@b.com", ".x.com"]) {
      expect(normalizeHost(bad as string)).toBeNull();
    }
  });
});

describe("resolveHost", () => {
  const root = "tailorly.com";
  it("maps root and www to root", () => {
    expect(resolveHost("tailorly.com", root)).toEqual({ kind: "root" });
    expect(resolveHost("www.tailorly.com:443", root)).toEqual({ kind: "root" });
  });
  it("maps a tenant subdomain to its slug", () => {
    expect(resolveHost("royal-stitches.tailorly.com", root)).toEqual({ kind: "tenant", slug: "royal-stitches" });
  });
  it("works for localhost development", () => {
    expect(resolveHost("royalstitches.localhost:3000", "localhost")).toEqual({ kind: "tenant", slug: "royalstitches" });
    expect(resolveHost("localhost:3000", "localhost")).toEqual({ kind: "root" });
    expect(resolveHost("127.0.0.1:3000", "localhost")).toEqual({ kind: "root" });
  });
  it("never treats reserved names, nested labels or foreign domains as tenants", () => {
    expect(resolveHost("admin.tailorly.com", root).kind).toBe("unknown");
    expect(resolveHost("api.tailorly.com", root).kind).toBe("unknown");
    expect(resolveHost("a.b.tailorly.com", root).kind).toBe("unknown");
    expect(resolveHost("royal.tailorly.com.evil.com", root).kind).toBe("unknown");
    expect(resolveHost("eviltailorly.com", root).kind).toBe("unknown");
  });
});

describe("isValidSlug", () => {
  it("accepts normal slugs and rejects bad ones", () => {
    expect(isValidSlug("royal-stitches")).toBe(true);
    for (const bad of ["-a", "a-", "A", "a_b", "www", "login", "x".repeat(41)]) expect(isValidSlug(bad)).toBe(false);
  });
});
