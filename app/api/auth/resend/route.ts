import type { NextRequest } from 'next/server';
import { PENDING_COOKIE, decodePending } from '@/lib/auth/cookie';
import { fail, ok } from '@/lib/server/route';

// TEMP: Phase 2 stub - nothing is sent.
export async function POST(req: NextRequest) {
  if (!decodePending(req.cookies.get(PENDING_COOKIE)?.value)) return fail('সেশনের মেয়াদ শেষ। আবার লগইন করুন।', 401);
  return ok({ ok: true });
}
