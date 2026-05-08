import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db.js';
import Booking from '../../models/Booking.js';
import Seat from '../../models/Seat.js';
import BookingSeat from '../../models/BookingSeat.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAuth } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { userId } = requireAuth(req);
    const { bookingId } = req.body as { bookingId: string };
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });

    const booking = await Booking.findOne({ _id: bookingId, user_id: userId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking is already cancelled' });

    // Check 24-hour rule
    const { default: EventModel } = await import('../../server/models/Event');
    const event = await EventModel.findById(booking.event_id);
    if (event) {
      const hoursUntilEvent = (new Date(event.date).getTime() - Date.now()) / 36e5;
      if (hoursUntilEvent < 24) {
        return res.status(400).json({ error: 'Cannot cancel within 24 hours of event' });
      }
    }

    booking.status = 'cancelled';
    await booking.save();

    // Release seats back to available
    const bookingSeats = await BookingSeat.find({ booking_id: bookingId });
    for (const bs of bookingSeats) {
      await Seat.findByIdAndUpdate(bs.seat_id, { status: 'available' });
    }

    return res.status(200).json({ message: 'Booking cancelled', booking });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    console.error('[api/bookings/cancel]', err);
    return res.status(500).json({ error: message });
  }
}
