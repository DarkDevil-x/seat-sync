import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import dbConnect from '../../db.js';
import Event from '../../models/Event.js';
import Seat from '../../models/Seat.js';
import Booking from '../../models/Booking.js';
import BookingSeat from '../../models/BookingSeat.js';
import { setCorsHeaders, setPublicCache } from '../_utils/cors.js';
import { requireAdmin } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await dbConnect();

  const { id } = req.query as { id: string };

  try {
    // GET /api/events/:id  – single event
    if (req.method === 'GET') {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid event id' });
      }
      const raw = await Event.findById(id).lean();
      if (!raw) return res.status(404).json({ error: 'Event not found' });
      const event = { ...(raw as any), id: (raw as any)._id.toString() };
      setPublicCache(res, 60);
      return res.status(200).json(event);
    }

    // PUT /api/events/:id  – update event (admin only)
    if (req.method === 'PUT') {
      requireAdmin(req);
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid event id' });
      }
      const raw = await Event.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      }).lean();
      if (!raw) return res.status(404).json({ error: 'Event not found' });
      const event = { ...(raw as any), id: (raw as any)._id.toString() };
      return res.status(200).json(event);
    }

    // DELETE /api/events/:id  – cascade delete (admin only). Old code only
    // removed the Event document, leaving orphaned Seats / Bookings /
    // BookingSeats. Users would still see tickets pointing at events that no
    // longer existed and seat queries would return rows with broken refs.
    if (req.method === 'DELETE') {
      requireAdmin(req);
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid event id' });
      }

      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const event = await Event.findByIdAndDelete(id).session(session);
        if (!event) {
          await session.abortTransaction();
          return res.status(404).json({ error: 'Event not found' });
        }

        // Collect booking ids first so we can remove their BookingSeat rows
        // alongside the bookings themselves.
        const bookings = await Booking.find({ event_id: id })
          .select('_id')
          .session(session)
          .lean();
        const bookingIds = bookings.map((b) => String((b as { _id: unknown })._id));

        await Promise.all([
          Seat.deleteMany({ event_id: id }).session(session),
          Booking.deleteMany({ event_id: id }).session(session),
          bookingIds.length
            ? BookingSeat.deleteMany({ booking_id: { $in: bookingIds } } as any).session(session)
            : Promise.resolve(),
        ]);

        await session.commitTransaction();
        return res.status(204).end();
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
    if (message === 'Admin access required') return res.status(403).json({ error: message });
    console.error('[api/events/[id]]', err);
    return res.status(500).json({ error: message });
  }
}
