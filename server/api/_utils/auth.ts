import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JWTPayload {
  userId: string;
  email: string;
  is_admin: boolean;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function getTokenFromRequest(req: VercelRequest): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export function requireAuth(req: VercelRequest): JWTPayload {
  const token = getTokenFromRequest(req);
  if (!token) throw new Error('Authentication required');
  try {
    return verifyToken(token);
  } catch {
    throw new Error('Authentication required');
  }
}

export function requireAdmin(req: VercelRequest): JWTPayload {
  const payload = requireAuth(req);
  if (!payload.is_admin) throw new Error('Admin access required');
  return payload;
}
