import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import dbConnect from '../../db.js';
import Booking from '../../models/Booking.js';
import BookingSeat from '../../models/BookingSeat.js';
import Seat from '../../models/Seat.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAdmin } from '../_utils/auth.js';

function generateRowLetters(count: number): string[] {
  const letters: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i < 26) {
      letters.push(String.fromCharCode(65 + i));
    } else {
      const first = String.fromCharCode(65 + Math.floor((i - 26) / 26));
      const second = String.fromCharCode(65 + ((i - 26) % 26));
      letters.push(first + second);
    }
  }
  return letters;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    requireAdmin(req);

    const {
      eventId,
      seatPrice,
      customLayout = true,
      rows,
      seatsPerRow = 15,
      numberOfRows = 15,
      numberOfColumns = 15,
    } = req.body as {
      eventId: string;
      seatPrice: string | number;
      customLayout?: boolean;
      rows?: string[];
      seatsPerRow?: number;
      numberOfRows?: number;
      numberOfColumns?: number;
    };

    if (!eventId || seatPrice === undefined) {
      return res.status(400).json({ error: 'eventId and seatPrice are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }

    // Regenerating seats invalidates any bookings tied to them. Old code
    // wiped Seats but left BookingSeat rows pointing at the now-deleted seat
    // ids, and old Bookings stayed visible in /api/bookings.
    // Cascade: cancel existing bookings + drop their seat junction rows.
    const existingBookings = await Booking.find({ event_id: eventId })
      .select('_id')
      .lean();
    if (existingBookings.length > 0) {
      const bookingIds = existingBookings.map((b) => String((b as { _id: unknown })._id));
      await BookingSeat.deleteMany({ booking_id: { $in: bookingIds } } as any);
      await Booking.updateMany(
        { _id: { $in: bookingIds }, status: { $ne: 'cancelled' } } as any,
        { $set: { status: 'cancelled' } }
      );
    }
    await Seat.deleteMany({ event_id: eventId });

    const basePrice = parseFloat(String(seatPrice));
    const seatsToCreate: any[] = [];

    if (customLayout) {
      const rowLetters = generateRowLetters(numberOfRows);
      const sectionSize = Math.floor(numberOfRows / 3);
      const frontRows = rowLetters.slice(0, sectionSize);
      const middleRows = rowLetters.slice(sectionSize, sectionSize * 2);
      const backRows = rowLetters.slice(sectionSize * 2);

      for (const row of frontRows) {
        for (let col = 1; col <= numberOfColumns; col++) {
          seatsToCreate.push({ event_id: eventId, row, number: col, price: basePrice + 5, status: 'available' });
        }
      }
      for (const row of middleRows) {
        for (let col = 1; col <= numberOfColumns; col++) {
          seatsToCreate.push({ event_id: eventId, row, number: col, price: basePrice + 2, status: 'available' });
        }
      }
      for (const row of backRows) {
        for (let col = 1; col <= numberOfColumns; col++) {
          seatsToCreate.push({ event_id: eventId, row, number: col, price: basePrice, status: 'available' });
        }
      }
    } else {
      const rowsArray = rows ?? ['A', 'B', 'C'];
      for (const row of rowsArray) {
        for (let number = 1; number <= seatsPerRow; number++) {
          seatsToCreate.push({ event_id: eventId, row, number, price: basePrice, status: 'available' });
        }
      }
    }

    const created = await Seat.insertMany(seatsToCreate);
    return res.status(201).json({ count: created.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    if (message === 'Admin access required') return res.status(403).json({ error: message });
    console.error('[api/seats/generate]', err);
    return res.status(500).json({ error: message });
  }
}
