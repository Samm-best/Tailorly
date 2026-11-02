import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/auth/password";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse 42");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse 42", hash)).toBe(true);
    expect(await verifyPassword("wrong horse 42", hash)).toBe(false);
  });
  it("uses a fresh salt each time", async () => {
    expect(await hashPassword("same-password-1")).not.toBe(await hashPassword("same-password-1"));
  });
  it("rejects malformed stored hashes without throwing", async () => {
    for (const bad of ["", "plain", "scrypt$1$2", "bcrypt$a$b$c$d$e", "scrypt$x$8$1$AAAA$AAAA"]) {
      expect(await verifyPassword("anything", bad)).toBe(false);
    }
  });
});
