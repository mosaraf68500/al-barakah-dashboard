import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { decodePending, encodeSession, PENDING_COOKIE, SESSION_COOKIE } from '@/lib/auth/cookie';
import { addAudit, listStaff } from '@/lib/server/adminStore';
import { body, fail } from '@/lib/server/route';
import type { AdminSession } from '@/types/admin';

// TEMP: Phase 2 stub, replaced by real JWT auth in Phase 3. Step 2 of 2: any 6-digit code is accepted and a mock super_admin session is issued.
export async function POST(req: NextRequest) {
  const pending = decodePending(req.cookies.get(PENDING_COOKIE)?.value);
  if (!pending) return fail('সেশনের মেয়াদ শেষ। আবার লগইন করুন।', 401);
  const { code } = await body<{ code?: string }>(req);
  if (!/^\d{6}$/.test((code || '').trim())) return fail('৬ ডিজিটের সঠিক কোড দিন।');

  const known = listStaff().find((s) => s.email.toLowerCase() === pending.email);
  const session: AdminSession = {
    userId: known?.id ?? 'stub-super-admin',
    name: known?.name ?? pending.email.split('@')[0],
    email: pending.email,
    role: 'super_admin', // stub: always a mock super_admin
  };
  addAudit({ adminEmail: session.email, adminRole: session.role, action: 'Admin signed in (stub OTP)', status: 'SUCCESS' });
  const res = NextResponse.json({ ok: true, session });
  res.cookies.set(SESSION_COOKIE, encodeSession(session), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 });
  res.cookies.delete(PENDING_COOKIE);
  return res;
}
