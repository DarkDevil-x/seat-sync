import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db';
import User from '../../models/User';
import { signToken } from '../_utils/auth';
import { setCorsHeaders } from '../_utils/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { email, password, first_name, last_name, student_id, phone_number } = req.body as {
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
      student_id?: string;
      phone_number?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const user = await User.create({ email, password, first_name, last_name, student_id, phone_number });

    const token = signToken({ userId: user._id.toString(), email: user.email, is_admin: user.is_admin });

    const userObj = user.toObject() as Record<string, unknown>;
    delete userObj.password;

    return res.status(201).json({ token, user: userObj });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[api/auth/register]', err);
    return res.status(500).json({ error: message });
  }
}
