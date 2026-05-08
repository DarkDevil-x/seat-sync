import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import dbConnect from '../../server/db.js';
import Booking from '../../server/models/Booking.js';
import BookingSeat from '../../server/models/BookingSeat.js';
import Seat from '../../server/models/Seat.js';
import User from '../../server/models/User.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAdmin } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { userId: adminId } = requireAdmin(req);
    const { eventId, seatIds, targetUserEmail, totalPrice, booking_note } = req.body as {
      eventId: string;
      seatIds: string[];
      targetUserEmail?: string;
      totalPrice?: number;
      booking_note?: string;
    };

    if (!eventId || !seatIds?.length) {
      return res.status(400).json({ error: 'eventId and seatIds are required' });
    }

    // Resolve target user
    let bookForUserId = adminId;
    if (targetUserEmail) {
      const targetUser = await User.findOne({ email: targetUserEmail.toLowerCase().trim() }).lean();
      if (!targetUser) return res.status(404).json({ error: `No user found with email: ${targetUserEmail}` });
      bookForUserId = String(targetUser._id);
    }

    // Check for seats already booked (confirmed status)
    const existingSeats = await BookingSeat.find({ seat_id: { $in: seatIds } })
      .populate({ path: 'booking_id', match: { status: 'confirmed' } })
      .lean();
    const alreadyBooked = existingSeats.filter((bs: any) => bs.booking_id !== null);
    if (alreadyBooked.length > 0) {
      return res.status(409).json({ error: `${alreadyBooked.length} seat(s) are already booked by another user` });
    }

    const seats = await Seat.find({ _id: { $in: seatIds } }).lean();
    if (seats.length !== seatIds.length) {
      return res.status(400).json({ error: 'One or more seat IDs are invalid' });
    }
    const price = totalPrice ?? seats.reduce((sum, s) => sum + s.price, 0);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const [booking] = await Booking.create(
        [{ event_id: eventId, user_id: bookForUserId, total_price: price, status: 'confirmed', booking_note: booking_note || 'Admin booking' }],
        { session }
      );
      await BookingSeat.insertMany(
        seatIds.map((seatId) => ({ booking_id: booking._id, seat_id: seatId })),
        { session }
      );
      await Seat.updateMany(
        { _id: { $in: seatIds } },
        { $set: { status: 'booked', heldBy: null, heldUntil: null } },
        { session }
      );
      await session.commitTransaction();
      return res.status(201).json({ success: true, booking_id: booking._id.toString(), seats_booked: seatIds.length });
    } catch (txErr) {
      await session.abortTransaction();
      throw txErr;
    } finally {
      session.endSession();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    if (message === 'Admin access required') return res.status(403).json({ error: message });
    console.error('[api/admin/booking]', err);
    return res.status(500).json({ error: message });
  }
}
