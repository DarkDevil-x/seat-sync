import type { VercelResponse } from '@vercel/node';

export function setCorsHeaders(res: VercelResponse): void {
  // On Vercel, ALLOWED_ORIGIN should be set to the production URL.
  // Default to '*' so it works even if unset.
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Set Cache-Control for public read-only responses (events list, event detail).
 * max-age=60: browser caches for 60s.
 * s-maxage=120: CDN/reverse-proxy caches for 2min.
 * stale-while-revalidate=300: serve stale while refreshing in background.
 */
export function setPublicCache(res: VercelResponse, maxAgeSeconds = 60): void {
  res.setHeader(
    'Cache-Control',
    `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds * 2}, stale-while-revalidate=300`
  );
}

/** Private responses (auth, user-specific data) must never be cached by CDN. */
export function setNoCache(res: VercelResponse): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
}
