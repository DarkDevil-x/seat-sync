import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../db.js';
import User from '../../models/User.js';
import Booking from '../../models/Booking.js';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAdmin } from '../_utils/auth.js';

function escapeCSV(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    requireAdmin(req);

    const [users, bookingCounts] = await Promise.all([
      User.find({}).select('-password').lean(),
      Booking.aggregate([{ $group: { _id: '$user_id', count: { $sum: 1 } } }]),
    ]);

    const countMap = new Map(bookingCounts.map((b: any) => [String(b._id), b.count]));

    const header = [
      'User ID', 'First Name', 'Last Name', 'Email', 'Phone',
      'Student ID', 'Course', 'Role', 'Total Bookings', 'Registered Date',
    ];

    const dataRows = users.map((u) => [
      String(u._id),
      u.first_name || '',
      u.last_name || '',
      u.email,
      (u as any).phone_number || '',
      (u as any).student_id || '',
      (u as any).course || '',
      u.is_admin ? 'Admin' : 'User',
      countMap.get(String(u._id)) ?? 0,
      new Date((u as any).created_at || Date.now()).toLocaleString(),
    ]);

    const csv = [header, ...dataRows].map((row) => row.map(escapeCSV).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');
    return res.status(200).send(csv);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Authentication required') return res.status(401).json({ error: message });
    if (message === 'Admin access required') return res.status(403).json({ error: message });
    console.error('[api/admin/export-users]', err);
    return res.status(500).json({ error: message });
  }
}
