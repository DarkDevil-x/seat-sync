/**
 * GET /api/auth/google/callback
 *
 * Google redirects here after the user consents. We:
 * 1. Exchange the ?code for tokens via Google's token endpoint
 * 2. Fetch the user's profile from Google
 * 3. Upsert the user in MongoDB (create or update)
 * 4. Sign a JWT and redirect to the frontend with the token in the URL
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../../server/db';
import User from '../../../server/models/User';
import { signToken } from '../../_utils/auth';
import { setCorsHeaders } from '../../_utils/cors';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;          // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl       = process.env.APP_URL || 'http://localhost:8080';
  const redirectUri  = `${appUrl}/api/auth/google/callback`;
  const frontendUrl  = appUrl;

  if (!clientId || !clientSecret) {
    return res.status(503)
      .setHeader('Location', `${frontendUrl}/auth?error=google_not_configured`)
      .end();
  }

  const code  = req.query.code as string | undefined;
  const error = req.query.error as string | undefined;

  // User denied access or an error occurred
  if (error || !code) {
    return res
      .status(302)
      .setHeader('Location', `${frontendUrl}/auth?error=${encodeURIComponent(error || 'no_code')}`)
      .end();
  }

  try {
    // ── Step 1: Exchange code for tokens ───────────────────────────────────────
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    });

    const tokens = await tokenRes.json() as GoogleTokenResponse;

    if (!tokenRes.ok || tokens.error) {
      console.error('[google/callback] token exchange failed:', tokens);
      return res
        .status(302)
        .setHeader('Location', `${frontendUrl}/auth?error=token_exchange_failed`)
        .end();
    }

    // ── Step 2: Fetch Google user profile ──────────────────────────────────────
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return res
        .status(302)
        .setHeader('Location', `${frontendUrl}/auth?error=userinfo_failed`)
        .end();
    }

    const googleUser = await userInfoRes.json() as GoogleUserInfo;

    if (!googleUser.email_verified) {
      return res
        .status(302)
        .setHeader('Location', `${frontendUrl}/auth?error=email_not_verified`)
        .end();
    }

    // ── Step 3: Upsert user in MongoDB ─────────────────────────────────────────
    await dbConnect();

    let user = await User.findOne({
      $or: [
        { google_id: googleUser.sub },
        { email: googleUser.email.toLowerCase() },
      ],
    });

    if (user) {
      // Update Google-provided fields if changed
      user.google_id     = googleUser.sub;
      user.auth_provider = 'google';
      if (!user.first_name) user.first_name = googleUser.given_name || null;
      if (!user.last_name)  user.last_name  = googleUser.family_name || null;
      if (!user.avatar_url) user.avatar_url = googleUser.picture || null;
      await user.save();
    } else {
      // Create new user — no password for OAuth accounts
      user = await User.create({
        email:         googleUser.email.toLowerCase(),
        first_name:    googleUser.given_name || null,
        last_name:     googleUser.family_name || null,
        avatar_url:    googleUser.picture || null,
        google_id:     googleUser.sub,
        auth_provider: 'google',
        is_admin:      false,
      });
    }

    // ── Step 4: Sign JWT and redirect to frontend ──────────────────────────────
    const token = signToken({
      userId:   user._id.toString(),
      email:    user.email,
      is_admin: user.is_admin,
    });

    // Pass token via URL fragment so it never hits server logs
    return res
      .status(302)
      .setHeader('Location', `${frontendUrl}/auth/callback#token=${token}`)
      .end();

  } catch (err) {
    console.error('[google/callback] unexpected error:', err);
    return res
      .status(302)
      .setHeader('Location', `${frontendUrl}/auth?error=server_error`)
      .end();
  }
}
