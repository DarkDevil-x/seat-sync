import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import dbConnect from '../../db.js';
import Booking from '../../models/Booking.js';
import Seat from '../../models/Seat.js';
import BookingSeat from '../../models/BookingSeat.js';
import Event from '../../models/Event.js';
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
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: 'Invalid bookingId' });
    }

    const booking = await Booking.findOne({ _id: bookingId, user_id: userId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // 24-hour cancellation policy
    const event = await Event.findById(booking.event_id).select('date').lean();
    if (event) {
      const hoursUntilEvent =
        (new Date((event as { date: Date }).date).getTime() - Date.now()) / 36e5;
      if (hoursUntilEvent < 24) {
        return res.status(400).json({ error: 'Cannot cancel within 24 hours of event' });
      }
    }

    // Cancel + release seats atomically. Old code did findByIdAndUpdate per
    // seat (N+1) with no transaction — a mid-loop failure left the booking
    // cancelled but seats still flagged 'booked', so they couldn't be re-sold.
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      booking.status = 'cancelled';
      await booking.save({ session });

      const bookingSeats = await BookingSeat.find({ booking_id: bookingId })
        .select('seat_id')
        .session(session)
        .lean();
      const seatIds = bookingSeats.map((bs) =>
        String((bs as { seat_id: unknown }).seat_id),
      );

      if (seatIds.length > 0) {
        await Seat.updateMany(
          { _id: { $in: seatIds } } as any,
          { $set: { status: 'available', heldBy: null, heldUntil: null } },
          { session }
        );
      }

      await session.commitTransaction();
    } catch (txErr) {
      await session.abortTransaction();
      throw txErr;
    } finally {
      session.endSession();
    }

    return res.status(200).json({ message: 'Booking cancelled', booking });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    console.error('[api/bookings/cancel]', err);
    return res.status(500).json({ error: message });
  }
}
