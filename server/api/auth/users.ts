import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db.js';
import User from '../../models/User.js';
import Booking from '../../models/Booking.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAdmin } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    requireAdmin(req);

    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const skip = (pageNum - 1) * limitNum;

    const [users, bookingCounts, total] = await Promise.all([
      User.find({}).select('-password').skip(skip).limit(limitNum).lean(),
      Booking.aggregate([
        { $group: { _id: '$user_id', count: { $sum: 1 } } },
      ]),
      User.countDocuments({}),
    ]);

    const countMap = new Map((bookingCounts as Array<{ _id: unknown; count: number }>).map((b) => [String(b._id), b.count]));

    // Normalise _id → id and attach booking_count
    const normalized = users.map((u) => ({
      ...u,
      id: String((u as any)._id),
      booking_count: countMap.get(String((u as any)._id)) ?? 0,
    }));

    return res.status(200).json({
      data: normalized,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    if (message === 'Admin access required') return res.status(403).json({ error: message });
    console.error('[api/auth/users]', err);
    return res.status(500).json({ error: message });
  }
}
