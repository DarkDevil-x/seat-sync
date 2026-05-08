import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../db.js';
import User from '../models/User.js';
import { setCorsHeaders } from '../_utils/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { email, password, first_name, last_name } = req.body as {
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ is_admin: true });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    // Check if user with this email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create admin user
    const admin = await User.create({
      email,
      password,
      first_name: first_name || 'Admin',
      last_name: last_name || 'User',
      is_admin: true,
    });

    return res.status(201).json({ 
      success: true, 
      message: 'Admin user created successfully',
      user: {
        id: String(admin._id),
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        is_admin: admin.is_admin,
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[api/auth/admin-setup]', err);
    
    // Handle duplicate key error
    if (message.includes('duplicate') || message.includes('E11000')) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    return res.status(500).json({ error: message });
  }
}
