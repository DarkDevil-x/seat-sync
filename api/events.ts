import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../server/db.js';
import Event from '../server/models/Event.js';
import { setCorsHeaders } from './_utils/cors.js';
import { requireAdmin } from './_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await dbConnect();

  try {
    // GET /api/events  – list events; ?published=true, ?category=, ?featured=true
    if (req.method === 'GET') {
      const { published, category, featured } = req.query;

      const filter: Record<string, unknown> = {};
      if (published === 'true') filter.is_published = true;
      if (category) filter.category = category;
      if (featured === 'true') filter.date = { $gte: new Date() };

      let query = Event.find(filter).sort({ date: 1 });
      if (featured === 'true') query = query.limit(4) as typeof query;

      const rawEvents = await query.lean();
      const events = rawEvents.map((e: any) => ({ ...e, id: e._id.toString() }));
      return res.status(200).json(events);
    }

    // POST /api/events  – create event (admin only)
    if (req.method === 'POST') {
      const admin = requireAdmin(req);
      const event = await Event.create({ ...req.body, created_by: admin.userId });
      return res.status(201).json(event);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    if (message === 'Admin access required') return res.status(403).json({ error: message });
    console.error('[api/events]', err);
    return res.status(500).json({ error: message });
  }
}
