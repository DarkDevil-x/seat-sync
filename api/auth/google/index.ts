/**
 * GET /api/auth/google
 * Redirects the user to Google's OAuth 2.0 consent page.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../../_utils/cors';

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl   = process.env.APP_URL || 'http://localhost:8080';

  if (!clientId) {
    return res.status(503).json({ error: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID to .env' });
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
    prompt:        'select_account',
  });

  return res.status(302).setHeader('Location', `https://accounts.google.com/o/oauth2/v2/auth?${params}`).end();
}
