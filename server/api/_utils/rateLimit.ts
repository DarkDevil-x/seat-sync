/**
 * Lightweight in-memory rate limiter for the long-lived Render process.
 * Uses a sliding window counter per IP address.
 *
 * Usage:
 *   const limited = rateLimit(ip, { scope: 'login', windowMs: 60_000, max: 10 });
 *   if (limited) return res.status(429).json({ error: 'Too many requests' });
 *
 * `scope` gives each endpoint its own counter. Without it every caller shared
 * a single per-IP bucket, so a burst of failed logins immediately locked new
 * signups out ("Too many registration attempts" on a first-ever attempt), and
 * whichever endpoint created the bucket also imposed its window on the other.
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
  options: { scope: string; windowMs: number; max: number }
): boolean {
  const { scope, windowMs, max } = options;
  const now = Date.now();
  const key = `${scope}:${ip}`;

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
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
