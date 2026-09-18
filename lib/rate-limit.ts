// Fixed-window, in-memory rate limiter for the public API routes.
//
// LIMITATION: state lives in the process, so on Vercel each serverless
// instance keeps its own counters and a cold start resets them. It blunts
// casual abuse and accidental double-submits; it is not a substitute for a
// shared store (Upstash/Redis) or a WAF rule if this site is ever targeted.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Stops the map growing without bound on a long-lived instance.
const MAX_KEYS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    if (buckets.size >= MAX_KEYS) {
      for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
      if (buckets.size >= MAX_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client address. Spoofable, so only ever used for throttling. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "local";
}
