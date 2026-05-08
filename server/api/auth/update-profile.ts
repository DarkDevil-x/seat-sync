import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db';
import User from '../../models/User';
import { setCorsHeaders } from '../_utils/cors';
import { requireAuth } from '../_utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { userId } = requireAuth(req);
    const { first_name, last_name, avatar_url, student_id, course, phone_number } = req.body as {
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
      student_id?: string;
      course?: string;
      phone_number?: string;
    };

    const update: Record<string, unknown> = {};
    if (first_name !== undefined) update.first_name = first_name;
    if (last_name !== undefined) update.last_name = last_name;
    if (avatar_url !== undefined) update.avatar_url = avatar_url;
    if (student_id !== undefined) update.student_id = student_id;
    if (course !== undefined) update.course = course;
    if (phone_number !== undefined) update.phone_number = phone_number;

    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    console.error('[api/auth/update-profile]', err);
    return res.status(500).json({ error: message });
  }
}
