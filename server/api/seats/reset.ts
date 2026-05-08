import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../db.js';
import Seat from '../models/Seat.js';
import Booking from '../models/Booking.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAuth } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { is_admin } = requireAuth(req);
    if (!is_admin) return res.status(403).json({ error: 'Admin access required' });

    const { eventId } = req.body as { eventId: string };
    if (!eventId) return res.status(400).json({ error: 'eventId is required' });

    // Cancel all active bookings for this event
    await Booking.updateMany(
      { event_id: eventId, status: { $in: ['confirmed', 'pending'] } },
      { status: 'cancelled' }
    );

    // Reset every seat to available and clear any holds
    const result = await Seat.updateMany(
      { event_id: eventId },
      {
        $set: { status: 'available' },
        $unset: { heldBy: 1, heldUntil: 1 },
      }
    );

    return res.status(200).json({
      message: 'All seats reset to available',
      seatsReset: result.modifiedCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    console.error('[api/seats/reset]', err);
    return res.status(500).json({ error: message });
  }
}
