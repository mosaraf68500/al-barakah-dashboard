import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PENDING_COOKIE, SESSION_COOKIE } from '@/lib/auth/cookie';
import { audit, session } from '@/lib/server/route';

export async function POST(req: NextRequest) {
  audit(session(req), 'Admin signed out');
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(PENDING_COOKIE);
  return res;
}
