import { beforeEach, describe, expect, it } from "vitest";
import { hitRateLimit, resetRateLimits } from "@/lib/rate-limit";

beforeEach(() => resetRateLimits());

describe("hitRateLimit", () => {
  it("allows up to the limit then blocks with a retry hint", () => {
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(hitRateLimit("t", "k", 3, 60_000, t).allowed).toBe(true);
    const blocked = hitRateLimit("t", "k", 3, 60_000, t);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
  it("tracks keys and limiter names independently and resets after the window", () => {
    const t = 5_000_000;
    hitRateLimit("a", "k", 1, 1000, t);
    expect(hitRateLimit("a", "k", 1, 1000, t).allowed).toBe(false);
    expect(hitRateLimit("a", "other", 1, 1000, t).allowed).toBe(true);
    expect(hitRateLimit("b", "k", 1, 1000, t).allowed).toBe(true);
    expect(hitRateLimit("a", "k", 1, 1000, t + 1001).allowed).toBe(true);
  });
});
