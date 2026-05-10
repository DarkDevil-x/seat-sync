/**
 * Lightweight in-memory rate limiter for the long-lived Render process.
 * Uses a sliding window counter per IP address.
 *
 * Usage:
 *   const limited = rateLimit(req, { windowMs: 60_000, max: 10 });
 *   if (limited) return res.status(429).json({ error: 'Too many requests' });
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Prune stale entries every 5 minutes to prevent unbounded map growth
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (bucket.resetAt < now) store.delete(key);
  }
}, 5 * 60_000);

export function rateLimit(
  ip: string,
  options: { windowMs: number; max: number }
): boolean {
  const { windowMs, max } = options;
  const now = Date.now();

  const bucket = store.get(ip);
  if (!bucket || bucket.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > max;
}

export function getIp(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return first.trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
}
