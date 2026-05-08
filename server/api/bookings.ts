import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import dbConnect from '../server/db.js';
import Booking from '../server/models/Booking.js';
import BookingSeat from '../server/models/BookingSeat.js';
import Seat from '../server/models/Seat.js';
import { setCorsHeaders } from './_utils/cors.js';
import { requireAuth } from './_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await dbConnect();

  try {
    const authUser = requireAuth(req);

    // GET /api/bookings?userId=xxx  – user bookings with event + seat details (no N+1)
    if (req.method === 'GET') {
      const targetUserId = (req.query.userId as string) || authUser.userId;

      const bookings = await Booking.find({ user_id: targetUserId })
        .populate('event_id')
        .sort({ created_at: -1 })
        .lean();

      const bookingIds = bookings.map((b) => (b as { _id: unknown })._id);
      const allBookingSeats = await BookingSeat.find({ booking_id: { $in: bookingIds } })
        .populate('seat_id')
        .lean();

      // Group seats by booking id in one pass – avoids N+1
      const seatsByBooking = new Map<string, unknown[]>();
      for (const bs of allBookingSeats) {
        const key = (bs.booking_id as mongoose.Types.ObjectId).toString();
        if (!seatsByBooking.has(key)) seatsByBooking.set(key, []);
        seatsByBooking.get(key)!.push({ seat: bs.seat_id });
      }

      const enriched = bookings.map((b) => ({
        ...b,
        event: (b as { event_id: unknown }).event_id,
        booking_seats: seatsByBooking.get((b as { _id: mongoose.Types.ObjectId })._id.toString()) ?? [],
      }));

      return res.status(200).json(enriched);
    }

    // POST /api/bookings  – atomic: verify holds → create booking → link seats → mark booked
    if (req.method === 'POST') {
      const { eventId, seatIds, totalPrice } = req.body as {
        eventId: string;
        seatIds: string[];
        totalPrice?: number;
      };

      if (!eventId || !seatIds || seatIds.length === 0) {
        return res.status(400).json({ error: 'eventId and seatIds are required' });
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const now = new Date();

        // Verify every seat is still held by this user within the time window
        const heldSeats = await Seat.find({
          _id: { $in: seatIds },
          heldBy: authUser.userId,
          status: 'reserved',
          heldUntil: { $gt: now },
        }).session(session);

        if (heldSeats.length !== seatIds.length) {
          await session.abortTransaction();
          return res.status(409).json({
            error: 'One or more seat holds have expired – please re-select your seats',
          });
        }

        const price = totalPrice ?? heldSeats.reduce((sum, s) => sum + s.price, 0);

        // Create the booking record
        const [booking] = await Booking.create(
          [{ event_id: eventId, user_id: authUser.userId, total_price: price, status: 'confirmed' }],
          { session }
        );

        // Create booking_seat junction rows
        await BookingSeat.insertMany(
          seatIds.map((seatId) => ({ booking_id: booking._id, seat_id: seatId })),
          { session }
        );

        // Mark seats as booked and clear hold fields
        await Seat.updateMany(
          { _id: { $in: seatIds } },
          { $set: { status: 'booked', heldBy: null, heldUntil: null } },
          { session }
        );

        await session.commitTransaction();

        const populated = await Booking.findById(booking._id).populate('event_id').lean();
        return res.status(201).json(populated);
      } catch (txErr) {
        await session.abortTransaction();
        throw txErr;
      } finally {
        session.endSession();
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    console.error('[api/bookings]', err);
    return res.status(500).json({ error: message });
  }
}
