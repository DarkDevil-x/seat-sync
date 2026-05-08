
import type { VercelRequest, VercelResponse } from '@vercel/node';


import route_2 from '../server/api/admin/analytics';
import route_3 from '../server/api/admin/booking';
import route_4 from '../server/api/admin/checkin';
import route_5 from '../server/api/admin/event-control';
import route_6 from '../server/api/admin/export-users';
import route_7 from '../server/api/admin/seat-type';
import route_8 from '../server/api/auth/admin-setup';
import route_9 from '../server/api/auth/change-password';
import route_10 from '../server/api/auth/check-admin';
import route_11 from '../server/api/auth/google/callback';
import route_12 from '../server/api/auth/google/index';
import route_13 from '../server/api/auth/login';
import route_14 from '../server/api/auth/logout';
import route_15 from '../server/api/auth/me';
import route_16 from '../server/api/auth/register';
import route_17 from '../server/api/auth/update-profile';
import route_18 from '../server/api/auth/update-role';
import route_19 from '../server/api/auth/users';
import route_20 from '../server/api/bookings/[id]';
import route_21 from '../server/api/bookings/admin';
import route_22 from '../server/api/bookings/cancel';
import route_23 from '../server/api/bookings/export';
import route_24 from '../server/api/bookings/status';
import route_25 from '../server/api/bookings';
import route_26 from '../server/api/events/[id]';
import route_27 from '../server/api/events';
import route_28 from '../server/api/seats/confirm';
import route_29 from '../server/api/seats/generate';
import route_30 from '../server/api/seats/hold';
import route_31 from '../server/api/seats/release';
import route_32 from '../server/api/seats/reset';
import route_33 from '../server/api/seats';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathname = req.url ? req.url.split('?')[0] : '/';


  if (pathname === '/api/admin/analytics') return route_2(req, res);
  if (pathname === '/api/admin/booking') return route_3(req, res);
  if (pathname === '/api/admin/checkin') return route_4(req, res);
  if (pathname === '/api/admin/event-control') return route_5(req, res);
  if (pathname === '/api/admin/export-users') return route_6(req, res);
  if (pathname === '/api/admin/seat-type') return route_7(req, res);
  if (pathname === '/api/auth/admin-setup') return route_8(req, res);
  if (pathname === '/api/auth/change-password') return route_9(req, res);
  if (pathname === '/api/auth/check-admin') return route_10(req, res);
  if (pathname === '/api/auth/google/callback') return route_11(req, res);
  if (pathname === '/api/auth/google') return route_12(req, res);
  if (pathname === '/api/auth/login') return route_13(req, res);
  if (pathname === '/api/auth/logout') return route_14(req, res);
  if (pathname === '/api/auth/me') return route_15(req, res);
  if (pathname === '/api/auth/register') return route_16(req, res);
  if (pathname === '/api/auth/update-profile') return route_17(req, res);
  if (pathname === '/api/auth/update-role') return route_18(req, res);
  if (pathname === '/api/auth/users') return route_19(req, res);

  const match_20 = pathname.match(/^\/api\/bookings\/([^\/]+)$/);
  if (match_20) {
    req.query.id = match_20[1];
    return route_20(req, res);
  }
  if (pathname === '/api/bookings/admin') return route_21(req, res);
  if (pathname === '/api/bookings/cancel') return route_22(req, res);
  if (pathname === '/api/bookings/export') return route_23(req, res);
  if (pathname === '/api/bookings/status') return route_24(req, res);
  if (pathname === '/api/bookings') return route_25(req, res);

  const match_26 = pathname.match(/^\/api\/events\/([^\/]+)$/);
  if (match_26) {
    req.query.id = match_26[1];
    return route_26(req, res);
  }
  if (pathname === '/api/events') return route_27(req, res);
  if (pathname === '/api/seats/confirm') return route_28(req, res);
  if (pathname === '/api/seats/generate') return route_29(req, res);
  if (pathname === '/api/seats/hold') return route_30(req, res);
  if (pathname === '/api/seats/release') return route_31(req, res);
  if (pathname === '/api/seats/reset') return route_32(req, res);
  if (pathname === '/api/seats') return route_33(req, res);

  return res.status(404).json({ error: 'Route not found: ' + pathname });
}
