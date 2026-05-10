import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import dbConnect from '../../db.js';
import Booking from '../../models/Booking.js';
import BookingSeat from '../../models/BookingSeat.js';
import Seat from '../../models/Seat.js';
import User from '../../models/User.js';
import Event from '../../models/Event.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAdmin } from '../_utils/auth.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function buildFilter(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};

  if (query.eventId) filter.event_id = query.eventId;
  if (query.status) filter.status = query.status;
  if (query.checked_in !== undefined) filter.checked_in = query.checked_in === 'true';

  // Date range
  if (query.dateFrom || query.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (query.dateFrom) dateFilter.$gte = new Date(query.dateFrom as string);
    if (query.dateTo) dateFilter.$lte = new Date(query.dateTo as string);
    filter.created_at = dateFilter;
  }

  return filter;
}

async function getBookingsWithDetails(filter: Record<string, unknown>, options: {
  skip: number;
  limit: number;
  search?: string;
}) {
  const { skip, limit, search } = options;

  let bookingFilter = { ...filter };

  // If search is provided, first find matching users/events
  if (search && search.trim()) {
    const s = search.trim();
    const [matchingUsers, matchingEvents] = await Promise.all([
      User.find({
        $or: [
          { email: { $regex: s, $options: 'i' } },
          { first_name: { $regex: s, $options: 'i' } },
          { last_name: { $regex: s, $options: 'i' } },
        ],
      }).select('_id').lean(),
      Event.find({ title: { $regex: s, $options: 'i' } }).select('_id').lean(),
    ]);

    const userIds = matchingUsers.map((u) => (u as { _id: unknown })._id);
    const eventIds = matchingEvents.map((e) => (e as { _id: unknown })._id);

    // Also try matching booking _id directly if it looks valid
    const orClauses: unknown[] = [];
    if (userIds.length) orClauses.push({ user_id: { $in: userIds } });
    if (eventIds.length) orClauses.push({ event_id: { $in: eventIds } });
    if (mongoose.Types.ObjectId.isValid(s)) orClauses.push({ _id: new mongoose.Types.ObjectId(s) });

    if (orClauses.length === 0) return { bookings: [], total: 0 };

    bookingFilter = { ...bookingFilter, $or: orClauses };
  }

  const [rawBookings, total] = await Promise.all([
    Booking.find(bookingFilter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(bookingFilter),
  ]);

  if (!rawBookings.length) return { bookings: [], total };

  const typedBookings = rawBookings as unknown as Array<{
    _id: mongoose.Types.ObjectId;
    event_id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    status: string;
    total_price: number;
    checked_in: boolean;
    checked_in_at: Date | null;
    booking_note: string | null;
    created_at: Date;
    updated_at: Date;
  }>;

  // Batch-load events and users
  const eventIds = [...new Set(typedBookings.map((b) => String(b.event_id)))];
  const userIds = [...new Set(typedBookings.map((b) => String(b.user_id)))];

  const [events, users] = await Promise.all([
    Event.find({ _id: { $in: eventIds } })
      .select('title date location price category image_url is_free')
      .lean() as Promise<Array<{
        _id: unknown; title: string; date: Date; location: string;
        price: number; category: string; image_url: string | null; is_free: boolean;
      }>>,
    User.find({ _id: { $in: userIds } })
      .select('first_name last_name email phone_number student_id avatar_url')
      .lean() as Promise<Array<{
        _id: unknown; first_name: string | null; last_name: string | null;
        email: string; phone_number: string | null; student_id: string | null; avatar_url: string | null;
      }>>,
  ]);

  const eventMap = new Map(events.map((e) => [String(e._id), e]));
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  // Batch-load booking seats
  const bookingIds = typedBookings.map((b) => b._id);
  const bookingSeats = await BookingSeat.find({ booking_id: { $in: bookingIds } })
    .populate('seat_id', 'row number seat_type label price status')
    .lean() as unknown as Array<{
      booking_id: mongoose.Types.ObjectId;
      seat_id: {
        _id: unknown; row: string; number: number;
        seat_type: string; label: string | null; price: number; status: string;
      } | null;
    }>;

  const seatsMap = new Map<string, typeof bookingSeats>();
  for (const bs of bookingSeats) {
    const key = String(bs.booking_id);
    if (!seatsMap.has(key)) seatsMap.set(key, []);
    seatsMap.get(key)!.push(bs);
  }

  const bookings = typedBookings.map((b) => {
    const event = eventMap.get(String(b.event_id));
    const user = userMap.get(String(b.user_id));
    const seats = (seatsMap.get(String(b._id)) ?? [])
      .filter((bs) => bs.seat_id)
      .map((bs) => ({
        seat_id: String(bs.seat_id!._id),
        row: bs.seat_id!.row,
        number: bs.seat_id!.number,
        label: bs.seat_id!.label || `${bs.seat_id!.row}${bs.seat_id!.number}`,
        seat_type: bs.seat_id!.seat_type,
        price: bs.seat_id!.price,
        status: bs.seat_id!.status,
      }));

    return {
      id: String(b._id),
      status: b.status,
      total_price: b.total_price,
      checked_in: b.checked_in,
      checked_in_at: b.checked_in_at,
      booking_note: b.booking_note,
      created_at: b.created_at,
      updated_at: b.updated_at,
      seat_count: seats.length,
      seats,
      event: event
        ? {
            id: String(event._id),
            title: event.title,
            date: event.date,
            location: event.location,
            price: event.price,
            category: event.category,
            image_url: event.image_url,
            is_free: event.is_free,
          }
        : null,
      user: user
        ? {
            id: String(user._id),
            name: [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown',
            email: user.email,
            phone: user.phone_number,
            student_id: user.student_id,
            avatar_url: user.avatar_url,
          }
        : null,
    };
  });

  return { bookings, total };
}

// ── handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await dbConnect();

  try {
    requireAdmin(req);

    // ── GET – list bookings ────────────────────────────────────────────────
    if (req.method === 'GET') {
      const {
        page = '1', limit = '20',
        eventId, status, checked_in,
        dateFrom, dateTo, search,
      } = req.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter = buildFilter({ eventId, status, checked_in, dateFrom, dateTo });
      const { bookings, total } = await getBookingsWithDetails(filter, { skip, limit: limitNum, search });

      return res.status(200).json({
        data: bookings,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      });
    }

    // ── PATCH – update booking status / checked_in ─────────────────────────
    if (req.method === 'PATCH') {
      const { id, status, checked_in, booking_note } = req.body as {
        id: string;
        status?: string;
        checked_in?: boolean;
        booking_note?: string;
      };

      if (!id) return res.status(400).json({ error: 'id is required' });
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid booking ID' });

      const allowed = ['pending', 'confirmed', 'cancelled', 'refunded', 'checked-in'];
      if (status && !allowed.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
      }

      const update: Record<string, unknown> = {};
      if (status !== undefined) update.status = status;
      if (checked_in !== undefined) {
        update.checked_in = checked_in;
        update.checked_in_at = checked_in ? new Date() : null;
      }
      if (booking_note !== undefined) update.booking_note = booking_note;

      if (!Object.keys(update).length) {
        return res.status(400).json({ error: 'Nothing to update' });
      }

      const booking = await Booking.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      // If cancelled/refunded, release seats
      if (status === 'cancelled' || status === 'refunded') {
        const bookingSeats = await BookingSeat.find({ booking_id: id }).lean();
        const seatIds = bookingSeats.map((bs) => (bs as unknown as { seat_id: mongoose.Types.ObjectId }).seat_id);
        if (seatIds.length) {
          await Seat.updateMany({ _id: { $in: seatIds as mongoose.Types.ObjectId[] } }, { $set: { status: 'available', heldBy: null, heldUntil: null } });
        }
      }

      return res.status(200).json({ success: true, booking });
    }

    // ── DELETE – hard delete a booking ─────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.body as { id: string };

      if (!id) return res.status(400).json({ error: 'id is required' });
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid booking ID' });

      const booking = await Booking.findById(id);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      // Release seats
      const bookingSeats = await BookingSeat.find({ booking_id: id }).lean();
      const seatIds = bookingSeats.map((bs) => (bs as unknown as { seat_id: mongoose.Types.ObjectId }).seat_id);
      if (seatIds.length) {
        await Seat.updateMany({ _id: { $in: seatIds as mongoose.Types.ObjectId[] } }, { $set: { status: 'available', heldBy: null, heldUntil: null } });
      }
      await BookingSeat.deleteMany({ booking_id: id });
      await booking.deleteOne();

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    if (message === 'Admin access required') return res.status(403).json({ error: message });
    console.error('[api/admin/bookings-manage]', err);
    return res.status(500).json({ error: message });
  }
}
