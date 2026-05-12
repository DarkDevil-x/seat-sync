import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import dbConnect from '../../db.js';
import Booking from '../../models/Booking.js';
import BookingSeat from '../../models/BookingSeat.js';
import { setCorsHeaders } from '../_utils/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await dbConnect();

  const { bookingId } = req.query as { bookingId: string };

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(200).json({ valid: false, reason: 'NOT_FOUND' });
  }

  try {
    // GET - just check status without modifying
    if (req.method === 'GET') {
      const booking = await Booking.findById(bookingId)
        .populate('event_id', 'title date location price category image_url is_free')
        .lean();

      if (!booking) {
        return res.status(200).json({ valid: false, reason: 'NOT_FOUND' });
      }

      const bookingSeatRecords = await BookingSeat.find({ booking_id: bookingId })
        .populate('seat_id', 'row number')
        .lean();

      const seats = bookingSeatRecords.map((bs: any) => ({
        row: bs.seat_id?.row,
        number: bs.seat_id?.number,
      }));

      return res.status(200).json({
        valid: true,
        reason: booking.checked_in ? 'ALREADY_USED' : 'SUCCESS',
        booking: {
          _id: booking._id,
          event: booking.event_id,
          seats,
          total_price: booking.total_price,
          checked_in: booking.checked_in,
          checked_in_at: booking.checked_in_at,
          created_at: booking.created_at,
        },
      });
    }

    // POST - mark as checked in with race condition handling
    if (req.method === 'POST') {
      const result = await Booking.findOneAndUpdate(
        { _id: bookingId, checked_in: false },
        { $set: { checked_in: true, checked_in_at: new Date() } },
        { new: true }
      )
        .populate('event_id', 'title date location price category image_url is_free')
        .lean();

      if (!result) {
        // Either not found or already checked in
        const existing = await Booking.findById(bookingId).lean();
        if (!existing) {
          return res.status(200).json({ valid: false, reason: 'NOT_FOUND' });
        }
        // Already checked in
        return res.status(200).json({
          valid: false,
          reason: 'ALREADY_USED',
          checkedInAt: existing.checked_in_at,
        });
      }

      const bookingSeatRecords = await BookingSeat.find({ booking_id: bookingId })
        .populate('seat_id', 'row number')
        .lean();

      const seats = bookingSeatRecords.map((bs: any) => ({
        row: bs.seat_id?.row,
        number: bs.seat_id?.number,
      }));

      return res.status(200).json({
        valid: true,
        reason: 'SUCCESS',
        booking: {
          _id: result._id,
          event: result.event_id,
          seats,
          total_price: result.total_price,
          checked_in: result.checked_in,
          checked_in_at: result.checked_in_at,
          created_at: result.created_at,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[api/validate]', err);
    return res.status(500).json({ error: message });
  }
}
