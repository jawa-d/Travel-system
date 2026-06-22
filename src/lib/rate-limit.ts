type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function removeExpiredBuckets(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function rateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  removeExpiredBuckets(now);
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count += 1;
  return { ok: true, remaining: limit - current.count, retryAfter: 0 };
}

export function checkRateLimit(key: string, limit: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) return { ok: true, retryAfter: 0 };
  if (current.count < limit) return { ok: true, retryAfter: 0 };
  return { ok: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}
