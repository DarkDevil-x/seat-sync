import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../server/db';
import Booking from '../../server/models/Booking';
import BookingSeat from '../../server/models/BookingSeat';
import { setCorsHeaders } from '../_utils/cors';
import { requireAuth } from '../_utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { userId } = requireAuth(req);
    const { id } = req.query as { id: string };

    // Scoped to the authenticated user so users cannot access each other's bookings
    const booking = await Booking.findOne({ _id: id, user_id: userId })
      .populate('event_id')
      .lean() as Record<string, unknown> | null;

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const bookingSeats = await BookingSeat.find({ booking_id: id })
      .populate('seat_id')
      .lean();

    return res.status(200).json({
      ...booking,
      event: booking.event_id,
      booking_seats: bookingSeats.map((bs) => ({ seat: bs.seat_id })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    console.error('[api/bookings/[id]]', err);
    return res.status(500).json({ error: message });
  }
}
