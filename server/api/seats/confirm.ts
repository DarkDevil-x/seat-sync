import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../db.js';
import Seat from '../models/Seat.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAuth } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { userId } = requireAuth(req);
    const { seatIds } = req.body as { seatIds: string[] };

    if (!seatIds || seatIds.length === 0) {
      return res.status(400).json({ error: 'seatIds array is required' });
    }

    const now = new Date();

    // Only confirm seats that are still within the hold window for this user
    const result = await Seat.updateMany(
      {
        _id: { $in: seatIds },
        heldBy: userId,
        status: 'reserved',
        heldUntil: { $gt: now },
      },
      { $set: { status: 'booked', heldBy: null, heldUntil: null } }
    );

    if (result.modifiedCount !== seatIds.length) {
      return res.status(409).json({
        error: 'Some seats could not be confirmed – hold may have expired',
      });
    }

    return res.status(200).json({ confirmed: true, seatIds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    console.error('[api/seats/confirm]', err);
    return res.status(500).json({ error: message });
  }
}
