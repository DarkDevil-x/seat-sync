import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db.js';
import Seat from '../../models/Seat.js';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAdmin } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    requireAdmin(req);
    const { eventId } = req.query as { eventId?: string };
    if (!eventId) return res.status(400).json({ error: 'eventId query param is required' });

    const [seats, bookings] = await Promise.all([
      Seat.find({ event_id: eventId }).lean(),
      Booking.find({ event_id: eventId }).lean(),
    ]);

    const total_seats    = seats.length;
    const available_seats = seats.filter((s) => s.status === 'available').length;
    const booked_seats   = seats.filter((s) => s.status === 'booked').length;
    const reserved_seats = seats.filter((s) => s.status === 'reserved').length;
    const vip_seats      = seats.filter((s) => s.seat_type === 'vip').length;
    const blocked_seats  = seats.filter((s) => s.seat_type === 'blocked').length;

    const confirmed   = bookings.filter((b) => b.status === 'confirmed');
    const cancelled   = bookings.filter((b) => b.status === 'cancelled');
    const revenue     = confirmed.reduce((sum, b) => sum + b.total_price, 0);
    const checked_in  = bookings.filter((b) => (b as any).checked_in === true).length;
    const occupancy_pct = total_seats > 0 ? Math.round((booked_seats / total_seats) * 100) : 0;

    // Bookings per day (last 14 days) for trend chart
    const now = Date.now();
    const trend: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(now - i * 86400000);
      const label = `${day.getMonth() + 1}/${day.getDate()}`;
      const count = confirmed.filter((b) => {
        const d = new Date((b as any).created_at);
        return d.toDateString() === day.toDateString();
      }).length;
      trend.push({ date: label, count });
    }

    // Most active users for this event (top 5)
    const userCount: Record<string, number> = {};
    for (const b of confirmed) {
      const uid = String(b.user_id);
      userCount[uid] = (userCount[uid] || 0) + 1;
    }
    const topIds = Object.entries(userCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
    const topUsers = await User.find({ _id: { $in: topIds } })
      .select('first_name last_name email student_id course')
      .lean();

    const most_active_users = topUsers.map((u) => ({
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
      email: u.email,
      student_id: (u as any).student_id ?? null,
      course: (u as any).course ?? null,
      bookings: userCount[String(u._id)] || 0,
    }));

    return res.status(200).json({
      total_seats,
      available_seats,
      booked_seats,
      reserved_seats,
      vip_seats,
      blocked_seats,
      total_bookings: bookings.length,
      confirmed_bookings: confirmed.length,
      cancelled_bookings: cancelled.length,
      revenue,
      checked_in,
      occupancy_pct,
      booking_trend: trend,
      most_active_users,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    if (message === 'Admin access required') return res.status(403).json({ error: message });
    console.error('[api/admin/analytics]', err);
    return res.status(500).json({ error: message });
  }
}
