import { describe, expect, it } from "vitest";
import { isValidEmail, normalizeEmail, safeRedirectPath, validatePassword } from "@/auth/identity";

describe("email", () => {
  it("normalizes case, spaces and unicode forms", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
    expect(normalizeEmail("ada@example.com")).toBe(normalizeEmail("ADA@EXAMPLE.COM"));
  });
  it("validates shape", () => {
    expect(isValidEmail("ada@example.com")).toBe(true);
    for (const bad of ["", "ada", "ada@", "@example.com", "ada@example", "a b@example.com", "ada@@example.com"]) {
      expect(isValidEmail(bad)).toBe(false);
    }
  });
});

describe("validatePassword", () => {
  it("accepts a reasonable password", () => {
    expect(validatePassword("river-stone-42")).toEqual({ ok: true });
  });
  it("rejects short, letterless, common and email-derived passwords", () => {
    expect(validatePassword("short1").ok).toBe(false);
    expect(validatePassword("1234567890123").ok).toBe(false);
    expect(validatePassword("Password123").ok).toBe(false);
    expect(validatePassword("adaobi-rocks-99", "adaobi@example.com").ok).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("allows only same-site relative paths", () => {
    expect(safeRedirectPath("/account")).toBe("/account");
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "", null]) {
      expect(safeRedirectPath(bad)).toBe("/account");
    }
  });
});
