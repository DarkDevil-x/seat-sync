import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';

// Read JWT_SECRET lazily at runtime, NOT at module load time.
// On Vercel, env vars are available when the handler runs, but may not
// be available when the module is first imported during cold start.
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not configured. ' +
      'On Vercel: add it in Project Settings → Environment Variables. ' +
      'Locally: add it to your .env file.'
    );
  }
  return secret;
}

export interface JWTPayload {
  userId: string;
  email: string;
  is_admin: boolean;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, getSecret()) as JWTPayload;
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
