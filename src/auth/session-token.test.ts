import { describe, expect, it } from "vitest";
import { generateToken, hashToken } from "@/auth/session-token";

describe("session tokens", () => {
  it("generates unique url-safe tokens", () => {
    const a = generateToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(a).not.toBe(generateToken());
  });
  it("hashes deterministically per secret and never equals the raw token", () => {
    const secret = "s".repeat(40);
    const t = generateToken();
    expect(hashToken(t, secret)).toBe(hashToken(t, secret));
    expect(hashToken(t, secret)).not.toBe(t);
    expect(hashToken(t, secret)).not.toBe(hashToken(t, "x".repeat(40)));
  });
});
