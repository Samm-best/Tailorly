import { describe, expect, it } from "vitest";
import { redact } from "@/lib/logger";

describe("redact", () => {
  it("masks sensitive keys at any depth", () => {
    const out = redact({ user: "ada", password: "x", nested: { sessionToken: "t", apiKey: "k", ok: 1 }, list: [{ authorization: "Bearer z" }] });
    expect(out).toEqual({
      user: "ada", password: "[redacted]", nested: { sessionToken: "[redacted]", apiKey: "[redacted]", ok: 1 }, list: [{ authorization: "[redacted]" }],
    });
  });
});
