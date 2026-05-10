import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db.js';
import User from '../../models/User.js';
import { signToken } from '../_utils/auth.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { rateLimit, getIp } from '../_utils/rateLimit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (rateLimit(getIp(req as any), { windowMs: 60_000, max: 10 })) {
    return res.status(429).json({ error: 'Too many login attempts. Please wait a minute.' });
  }

  await dbConnect();

  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // Select password explicitly since it has select:false in the schema
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ userId: user._id.toString(), email: user.email, is_admin: user.is_admin });

    const userObj = user.toObject() as unknown as Record<string, unknown>;
    delete userObj.password;

    return res.status(200).json({ token, user: userObj });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[api/auth/login]', err);
    return res.status(500).json({ error: message });
  }
}
