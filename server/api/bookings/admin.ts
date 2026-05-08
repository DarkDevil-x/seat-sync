import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db';
import Booking from '../../models/Booking';
import User from '../../models/User';
import { setCorsHeaders } from '../_utils/cors';
import { requireAdmin } from '../_utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    requireAdmin(req);

    const { eventId, page = '1', limit = '50' } = req.query;
    const filter: Record<string, unknown> = {};
    if (eventId) filter.event_id = eventId;

    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('event_id', 'title is_free')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    const typedBookings = bookings as unknown as Array<{
      _id: unknown;
      event_id: { _id: unknown; title: string; is_free: boolean } | null;
      user_id: unknown;
      total_price: number;
      status: string;
      created_at: Date;
    }>;

    // Batch-load all users in one query – no N+1
    const userIds = [...new Set(typedBookings.map((b) => String(b.user_id)))];
    const users = await User.find({ _id: { $in: userIds } })
      .select('first_name last_name email')
      .lean() as Array<{ _id: unknown; first_name: string | null; last_name: string | null; email: string }>;
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    // Shape response to match the Supabase join format the JSX already expects:
    // booking.events?.title   booking.profiles?.first_name / last_name / email
    const result = typedBookings.map((b) => {
      const u = userMap.get(String(b.user_id));
      const ev = b.event_id as { _id: unknown; title: string; is_free: boolean } | null;
      return {
        id: String(b._id),
        event_id: ev ? String(ev._id) : null,
        user_id: String(b.user_id),
        total_price: b.total_price,
        is_free: ev?.is_free ?? false,
        status: b.status,
        created_at: b.created_at,
        events: ev ? { title: ev.title, is_free: ev.is_free } : null,
        profiles: u ? { first_name: u.first_name, last_name: u.last_name, email: u.email } : null,
      };
    });

    return res.status(200).json({
      data: result,
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
    console.error('[api/bookings/admin]', err);
    return res.status(500).json({ error: message });
  }
}
