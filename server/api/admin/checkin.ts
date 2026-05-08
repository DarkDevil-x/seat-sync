import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db.js';
import Booking from '../../models/Booking.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAdmin } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    requireAdmin(req);
    const { bookingId, checked_in } = req.body as { bookingId: string; checked_in: boolean };
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });

    const isCheckedIn = checked_in !== false;
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { checked_in: isCheckedIn, checked_in_at: isCheckedIn ? new Date() : null },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    return res.status(200).json({ id: booking._id, checked_in: booking.checked_in, checked_in_at: booking.checked_in_at });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    if (message === 'Admin access required') return res.status(403).json({ error: message });
    console.error('[api/admin/checkin]', err);
    return res.status(500).json({ error: message });
  }
}
