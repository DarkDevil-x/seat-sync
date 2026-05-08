import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../_utils/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // JWT is stateless – the client is responsible for discarding the token.
  // If you add a token denylist in the future, invalidate it here.
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}
