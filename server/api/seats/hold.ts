import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db.js';
import Seat from '../../models/Seat.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAuth } from '../_utils/auth.js';

const HOLD_DURATION_MS = 10 * 60 * 1000; // 10 minutes

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
    const heldUntil = new Date(now.getTime() + HOLD_DURATION_MS);

    // Record which seats are ALREADY held by this user before the attempt —
    // we must NOT release those if a rollback happens, only the seats we
    // newly acquired in this call.
    const alreadyHeld = await Seat.find({
      _id: { $in: seatIds },
      heldBy: userId,
      status: 'reserved',
      heldUntil: { $gt: now },
    }).select('_id').lean();
    const alreadyHeldIds = new Set(alreadyHeld.map((s) => String((s as { _id: unknown })._id)));

    // Atomically acquire hold on seats that are:
    //   1. Available
    //   2. Reserved but hold has expired (another user's stale hold)
    //   3. Already reserved by THIS user (re-confirm / refresh hold at checkout)
    const result = await Seat.updateMany(
      {
        _id: { $in: seatIds },
        $or: [
          { status: 'available' },
          { status: 'reserved', heldUntil: { $lt: now } },
          { status: 'reserved', heldBy: userId },
        ],
      } as any,
      {
        $set: { status: 'reserved', heldBy: userId, heldUntil },
      }
    );

    if (result.modifiedCount !== seatIds.length) {
      // Roll back ONLY the seats we acquired this call (newly held), NOT the
      // ones the user already had. Previous version of this code released the
      // user's existing holds too, which broke incremental seat selection.
      const newlyAcquiredIds = seatIds.filter((id) => !alreadyHeldIds.has(String(id)));
      if (newlyAcquiredIds.length > 0) {
        await Seat.updateMany(
          { _id: { $in: newlyAcquiredIds }, heldBy: userId } as any,
          { $set: { status: 'available', heldBy: null, heldUntil: null } }
        );
      }
      return res.status(409).json({ error: 'One or more seats are no longer available' });
    }

    return res.status(200).json({ held: true, heldUntil, seatIds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    console.error('[api/seats/hold]', err);
    return res.status(500).json({ error: message });
  }
}
