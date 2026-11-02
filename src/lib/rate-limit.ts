import { AppError } from "@/lib/errors";

type Bucket = { count: number; resetAt: number };
const MAX_KEYS = 10_000;

const globalStore = globalThis as unknown as { __tailorlyLimiters?: Map<string, Map<string, Bucket>> };
const stores = (globalStore.__tailorlyLimiters ??= new Map());

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSec: number };

/**
 * Fixed-window, in-memory limiter. Good enough for one server instance and local work.
 * Serverless/multi-instance production needs a shared store (Redis) - see README.
 */
export function hitRateLimit(name: string, key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  if (store.size > MAX_KEYS) {
    for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
    if (store.size > MAX_KEYS) store.clear();
  }
  let bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }
  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export function consumeRateLimit(name: string, key: string, limit: number, windowMs: number): void {
  const r = hitRateLimit(name, key, limit, windowMs);
  if (!r.allowed) {
    throw new AppError("RATE_LIMITED", "Too many attempts. Please try again later.", { retryAfterSec: r.retryAfterSec });
  }
}

export function resetRateLimits(): void {
  stores.clear();
}
