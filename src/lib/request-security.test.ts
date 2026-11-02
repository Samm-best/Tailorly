import { describe, expect, it } from "vitest";
import { checkSameOrigin, getClientIp } from "@/lib/request-security";

const base = { method: "POST", origin: null, host: "shop.tailorly.com", secFetchSite: null };

describe("checkSameOrigin", () => {
  it("always allows safe methods", () => {
    expect(checkSameOrigin({ ...base, method: "GET", origin: "https://evil.com" })).toBe(true);
  });
  it("accepts matching origin and rejects foreign or malformed origin", () => {
    expect(checkSameOrigin({ ...base, origin: "https://shop.tailorly.com" })).toBe(true);
    expect(checkSameOrigin({ ...base, origin: "https://evil.com" })).toBe(false);
    expect(checkSameOrigin({ ...base, origin: "https://other.tailorly.com" })).toBe(false);
    expect(checkSameOrigin({ ...base, origin: "not a url" })).toBe(false);
  });
  it("falls back to Sec-Fetch-Site, then allows header-less non-browser clients", () => {
    expect(checkSameOrigin({ ...base, secFetchSite: "cross-site" })).toBe(false);
    expect(checkSameOrigin({ ...base, secFetchSite: "same-origin" })).toBe(true);
    expect(checkSameOrigin(base)).toBe(true);
  });
});

describe("getClientIp", () => {
  it("uses the first forwarded address", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
