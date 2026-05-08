import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import dbConnect from '../../db';
import Seat from '../../models/Seat';
import BookingSeat from '../../models/BookingSeat';
import Booking from '../../models/Booking';
import { setCorsHeaders } from '../_utils/cors';
import { requireAdmin } from '../_utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    requireAdmin(req);
    const { seatIds, seat_type, label, forceStatus } = req.body as {
      seatIds: string[];
      seat_type?: 'standard' | 'vip' | 'blocked';
      label?: string | null;
      forceStatus?: 'available' | 'reserved' | 'booked';
    };

    if (!seatIds?.length) {
      return res.status(400).json({ error: 'seatIds array is required' });
    }

    const update: Record<string, unknown> = {};
    if (seat_type !== undefined) update.seat_type = seat_type;
    if (label !== undefined) update.label = label;

    let cancelledBookings = 0;
    let deletedBookingSeats = 0;

    if (forceStatus === 'available') {
      // ── When resetting a seat to available, we must:
      // 1. Delete BookingSeat junction rows for these seats
      // 2. For any Booking that now has NO remaining seats → cancel it
      // 3. Update the seat itself
      update.status = 'available';
      update.heldBy = null;
      update.heldUntil = null;
      update.seat_type = seat_type ?? 'standard';

      // Find which bookings referenced these seats
      const bookingSeats = await BookingSeat.find({ seat_id: { $in: seatIds } }).lean();
      const bookingIds = [...new Set(bookingSeats.map((bs: any) => String(bs.booking_id)))];

      // Delete the junction rows
      const delResult = await BookingSeat.deleteMany({ seat_id: { $in: seatIds } });
      deletedBookingSeats = delResult.deletedCount ?? 0;

      // For each affected booking, check if it still has any remaining seats
      for (const bookingId of bookingIds) {
        const remaining = await BookingSeat.countDocuments({ booking_id: new mongoose.Types.ObjectId(bookingId) });
        if (remaining === 0) {
          // No seats left → cancel the booking
          await Booking.findByIdAndUpdate(bookingId, { $set: { status: 'cancelled' } });
          cancelledBookings++;
        }
      }
    } else if (forceStatus) {
      update.status = forceStatus;
    } else if (seat_type === 'blocked') {
      update.status = 'reserved';
      update.heldBy = null;
      update.heldUntil = null;
    }

    const result = await Seat.updateMany({ _id: { $in: seatIds } }, { $set: update });

    return res.status(200).json({
      modified: result.modifiedCount,
      cancelledBookings,
      deletedBookingSeats,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    if (message === 'Admin access required') return res.status(403).json({ error: message });
    console.error('[api/admin/seat-type]', err);
    return res.status(500).json({ error: message });
  }
}
