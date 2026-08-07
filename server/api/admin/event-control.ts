import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db.js';
import Event from '../../models/Event.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAdmin } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    requireAdmin(req);
    const { eventId, action, userId } = req.body as {
      eventId: string;
      action: 'toggle_bookings' | 'ban_user' | 'unban_user' | 'set_limit' | 'toggle_featured' | 'toggle_spotlight';
      userId?: string;
      limit?: number;
    };

    /** Only two spotlight cards fit over the hero image. */
    const SPOTLIGHT_LIMIT = 2;

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
    } else if (action === 'toggle_featured') {
      const event = await Event.findById(eventId).lean();
      if (!event) return res.status(404).json({ error: 'Event not found' });
      update.is_featured = !(event as any).is_featured;
    } else if (action === 'toggle_spotlight') {
      const event = await Event.findById(eventId).lean();
      if (!event) return res.status(404).json({ error: 'Event not found' });
      const next = !(event as any).is_spotlight;
      if (next) {
        const current = await Event.countDocuments({ is_spotlight: true, _id: { $ne: eventId } });
        if (current >= SPOTLIGHT_LIMIT) {
          return res.status(409).json({
            error: `Only ${SPOTLIGHT_LIMIT} events can be spotlighted. Remove one first.`,
          });
        }
      }
      update.is_spotlight = next;
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
