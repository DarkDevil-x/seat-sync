import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db.js';
import User from '../../models/User.js';
import { requireAuth } from '../_utils/auth.js';
import { setCorsHeaders } from '../_utils/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { userId } = requireAuth(req);

    const user = await User.findById(userId).select('-password').lean() as Record<string, unknown> | null;
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Always include a string `id` field alongside `_id` for client compatibility
    return res.status(200).json({ ...user, id: String(user._id) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    console.error('[api/auth/me]', err);
    return res.status(500).json({ error: message });
  }
}
