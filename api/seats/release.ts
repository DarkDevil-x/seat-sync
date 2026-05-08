import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../server/db';
import Seat from '../../server/models/Seat';
import { setCorsHeaders } from '../_utils/cors';
import { requireAuth } from '../_utils/auth';

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

    // Only release seats that are currently held by this user
    await Seat.updateMany(
      { _id: { $in: seatIds }, heldBy: userId, status: 'reserved' },
      { $set: { status: 'available', heldBy: null, heldUntil: null } }
    );

    return res.status(200).json({ released: true, seatIds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    console.error('[api/seats/release]', err);
    return res.status(500).json({ error: message });
  }
}
