import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db';
import User from '../../models/User';
import { setCorsHeaders } from '../_utils/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const admin = await User.findOne({ is_admin: true }).select('_id').lean();
    return res.status(200).json({ adminExists: admin !== null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[api/auth/check-admin]', err);
    return res.status(500).json({ error: message });
  }
}
