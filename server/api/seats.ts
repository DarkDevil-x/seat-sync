import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../server/db.js';
import Seat from '../server/models/Seat.js';
import { setCorsHeaders } from './_utils/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { eventId } = req.query;
    if (!eventId) return res.status(400).json({ error: 'eventId query param is required' });

    // Auto-release expired holds before returning seat map
    await Seat.updateMany(
      { event_id: eventId, status: 'reserved', heldUntil: { $lt: new Date() } },
      { $set: { status: 'available', heldBy: null, heldUntil: null } }
    );

    const seats = await Seat.find({ event_id: eventId })
      .sort({ row: 1, number: 1 })
      .lean();

    return res.status(200).json(seats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[api/seats]', err);
    return res.status(500).json({ error: message });
  }
}
