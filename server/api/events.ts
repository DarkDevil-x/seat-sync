import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../db.js';
import Event from '../models/Event.js';
import { setCorsHeaders, setPublicCache } from './_utils/cors.js';
import { requireAdmin } from './_utils/auth.js';

/** Escape user input before it goes into a RegExp. */
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const withIds = (rows: unknown[]) =>
  rows.map((e) => ({ ...(e as Record<string, unknown>), id: String((e as { _id: unknown })._id) }));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await dbConnect();

  try {
    // GET /api/events – ?published=true, ?category=, ?featured=true,
    // ?spotlight=true, ?facets=true
    if (req.method === 'GET') {
      const { published, category, featured, spotlight, facets } = req.query;

      // ?facets=true – the distinct categories that actually have published
      // events, with counts. The home page builds its category bar from this
      // instead of a hardcoded list that drifts from the data.
      //
      // Deliberately NOT limited to upcoming events: /events lists every
      // published event, so a category bar filtered to upcoming would hide
      // pills whose events are right there in the list.
      if (facets === 'true') {
        const rows = await Event.aggregate([
          { $match: { is_published: true } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ]);
        const categories = rows
          .filter((r) => typeof r._id === 'string' && r._id.trim() !== '')
          .map((r) => ({ category: r._id as string, count: r.count as number }));
        setPublicCache(res, 60);
        return res.status(200).json(categories);
      }

      const filter: Record<string, unknown> = {};
      if (published === 'true') filter.is_published = true;
      // Case-insensitive exact match: links can carry "concert" while the
      // stored value is "Concert".
      if (typeof category === 'string' && category) {
        filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
      }

      const isCurated = featured === 'true' || spotlight === 'true';
      if (isCurated) {
        filter.is_published = true;
        filter.date = { $gte: new Date() };
      }

      // The home page rail scrolls, so it can carry more than a 4-up grid could.
      const limit = spotlight === 'true' ? 2 : featured === 'true' ? 12 : 500;

      // Curated lists prefer the events an admin flagged, but fall back to the
      // next upcoming ones so the home page is never empty on a fresh install
      // or before anyone has curated anything.
      if (isCurated) {
        const flag = spotlight === 'true' ? 'is_spotlight' : 'is_featured';
        const curated = await Event.find({ ...filter, [flag]: true })
          .sort({ date: 1 })
          .limit(limit)
          .lean();
        if (curated.length > 0) {
          setPublicCache(res, 60);
          return res.status(200).json(withIds(curated));
        }
      }

      const rawEvents = await Event.find(filter).sort({ date: 1 }).limit(limit).lean();
      setPublicCache(res, 60);
      return res.status(200).json(withIds(rawEvents));
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
