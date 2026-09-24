import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { encodePending, PENDING_COOKIE } from '@/lib/auth/cookie';
import { addAudit } from '@/lib/server/adminStore';
import { body, fail } from '@/lib/server/route';

// TEMP: Phase 2 stub, replaced by real JWT auth in Phase 3. Step 1 of 2: no credential is verified - any well-formed email + non-empty password proceeds to the OTP step.
export async function POST(req: NextRequest) {
  const { email, password } = await body<{ email?: string; password?: string }>(req);
  const clean = (email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return fail('সঠিক ইমেইল ঠিকানা দিন।');
  if (!password) return fail('পাসওয়ার্ড দিন।');
  addAudit({ adminEmail: clean, adminRole: 'unknown', action: 'Login step 1 passed (stub) - OTP requested', status: 'SUCCESS' });
  const res = NextResponse.json({ ok: true, otpRequired: true });
  res.cookies.set(PENDING_COOKIE, encodePending(clean), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 300 });
  return res;
}
