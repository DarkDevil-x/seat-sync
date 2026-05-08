import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../db.js';
import Booking from '../models/Booking.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAuth } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { is_admin } = requireAuth(req);
    if (!is_admin) return res.status(403).json({ error: 'Admin access required' });

    const { bookingId, status } = req.body as { bookingId: string; status: string };
    if (!bookingId || !status) {
      return res.status(400).json({ error: 'bookingId and status are required' });
    }

    const valid = ['confirmed', 'pending', 'cancelled', 'refunded'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    return res.status(200).json(booking);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    console.error('[api/bookings/status]', err);
    return res.status(500).json({ error: message });
  }
}
