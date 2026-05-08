import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../server/db.js';
import User from '../../server/models/User.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAuth } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { userId: callerId, is_admin: callerIsAdmin } = requireAuth(req);
    if (!callerIsAdmin) return res.status(403).json({ error: 'Admin access required' });

    const { userId, is_admin } = req.body as { userId: string; is_admin: boolean };
    if (!userId || is_admin === undefined) {
      return res.status(400).json({ error: 'userId and is_admin are required' });
    }

    if (userId === callerId) {
      return res.status(400).json({ error: 'You cannot change your own admin role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { is_admin },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    console.error('[api/auth/update-role]', err);
    return res.status(500).json({ error: message });
  }
}
