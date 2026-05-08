import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db.js';
import Event from '../../models/Event.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAdmin } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await dbConnect();

  const { id } = req.query as { id: string };

  try {
    // GET /api/events/:id  – single event
    if (req.method === 'GET') {
      const raw = await Event.findById(id).lean();
      if (!raw) return res.status(404).json({ error: 'Event not found' });
      const event = { ...(raw as any), id: (raw as any)._id.toString() };
      return res.status(200).json(event);
    }

    // PUT /api/events/:id  – update event (admin only)
    if (req.method === 'PUT') {
      requireAdmin(req);
      const raw = await Event.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      }).lean();
      if (!raw) return res.status(404).json({ error: 'Event not found' });
      const event = { ...(raw as any), id: (raw as any)._id.toString() };
      return res.status(200).json(event);
    }

    // DELETE /api/events/:id  – delete event (admin only)
    if (req.method === 'DELETE') {
      requireAdmin(req);
      const event = await Event.findByIdAndDelete(id);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      return res.status(204).end();
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
