import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db';
import Event from '../../models/Event';
import { setCorsHeaders } from '../_utils/cors';
import { requireAdmin } from '../_utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    requireAdmin(req);
    const { eventId, action, userId } = req.body as { eventId: string; action: 'toggle_bookings' | 'ban_user' | 'unban_user' | 'set_limit'; userId?: string; limit?: number };

    if (!eventId || !action) return res.status(400).json({ error: 'eventId and action are required' });

    const update: Record<string, unknown> = {};

    if (action === 'toggle_bookings') {
      const event = await Event.findById(eventId).lean();
      if (!event) return res.status(404).json({ error: 'Event not found' });
      update.is_bookings_open = !(event as any).is_bookings_open;
    } else if (action === 'ban_user') {
      if (!userId) return res.status(400).json({ error: 'userId is required for ban_user action' });
      const event = await Event.findById(eventId).lean();
      if (!event) return res.status(404).json({ error: 'Event not found' });
      const banned = (event as any).banned_users || [];
      if (!banned.includes(userId)) {
        update.banned_users = [...banned, userId];
      }
    } else if (action === 'unban_user') {
      if (!userId) return res.status(400).json({ error: 'userId is required for unban_user action' });
      const event = await Event.findById(eventId).lean();
      if (!event) return res.status(404).json({ error: 'Event not found' });
      const banned = (event as any).banned_users || [];
      update.banned_users = banned.filter((id: string) => id !== userId);
    } else if (action === 'set_limit') {
      const { limit } = req.body as { limit?: number };
      if (limit === undefined) return res.status(400).json({ error: 'limit is required for set_limit action' });
      update.max_tickets_per_event = limit;
    } else {
      return res.status(400).json({ error: `Invalid action: ${action}` });
    }

    const updated = await Event.findByIdAndUpdate(eventId, { $set: update }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Event not found' });

    return res.status(200).json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    if (message === 'Admin access required') return res.status(403).json({ error: message });
    console.error('[api/admin/event-control]', err);
    return res.status(500).json({ error: message });
  }
}
