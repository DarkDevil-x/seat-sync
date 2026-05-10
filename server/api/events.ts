import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../db.js';
import Event from '../models/Event.js';
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
      query = query.limit(featured === 'true' ? 4 : 500) as typeof query;

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
    const error = err as any;
    const message = error.message || 'Internal server error';
    console.error('[api/events] Error:', {
      message,
      stack: error.stack,
      query: req.query,
      method: req.method
    });
    return res.status(500).json({ 
      error: message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
