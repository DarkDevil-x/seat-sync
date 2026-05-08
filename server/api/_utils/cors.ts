import type { VercelResponse } from '@vercel/node';

export function setCorsHeaders(res: VercelResponse): void {
  // On Vercel, ALLOWED_ORIGIN should be set to the production URL.
  // Default to '*' so it works even if unset.
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}
