// In-memory rate limiter (process-local). Good enough for a single-node
// deployment; swap for Redis if horizontally scaled.

const buckets = new Map();

// Periodic cleanup so inactive keys do not accumulate indefinitely.
if (typeof setInterval === 'function') {
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, 60_000);
  cleanup.unref?.();
}

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

// Extracts the best-effort client IP from a fetch Request or NextRequest.
export function getClientIp(req) {
  if (!req) return 'unknown';
  const get = (name) => {
    if (typeof req.headers?.get === 'function') return req.headers.get(name);
    return req.headers?.[name];
  };
  const forwarded = get('x-forwarded-for');
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  const real = get('x-real-ip');
  if (typeof real === 'string' && real.length > 0) return real;
  return 'unknown';
}
