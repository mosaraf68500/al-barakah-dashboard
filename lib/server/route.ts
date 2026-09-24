import { NextResponse, type NextRequest } from 'next/server';
import { decodeSession, SESSION_COOKIE } from '@/lib/auth/cookie';
import type { AdminSession } from '@/types/admin';
import { addAudit } from './adminStore';

export const ok = <T,>(data: T, init?: ResponseInit) => NextResponse.json(data, init);
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Returns the session, or a 401 response. middleware.ts already blocks anonymous /api calls; this also gives handlers the identity for auditing. */
export function session(req: NextRequest): AdminSession | null {
  return decodeSession(req.cookies.get(SESSION_COOKIE)?.value);
}

export function audit(s: AdminSession | null, action: string, status: 'SUCCESS' | 'FAILED' = 'SUCCESS') {
  addAudit({ adminEmail: s?.email ?? 'unknown', adminRole: s?.role ?? 'unknown', action, status });
}

export async function body<T = any>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
