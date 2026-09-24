import { NextResponse, type NextRequest } from 'next/server';
import { decodePending, decodeSession, PENDING_COOKIE, SESSION_COOKIE } from '@/lib/auth/cookie';

/**
 * TEMP: Phase 2 stub gate, replaced by real JWT verification in Phase 3.
 *  - anonymous page requests -> /login (verify-otp needs the pending cookie from step 1)
 *  - anonymous /api/* (except /api/auth/*) -> 401
 *  - /staff is super_admin only
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = decodeSession(req.cookies.get(SESSION_COOKIE)?.value);
  const pending = decodePending(req.cookies.get(PENDING_COOKIE)?.value);

  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth/')) return NextResponse.next();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.next();
  }

  // Invite links land here before any session exists. A missing page used to bounce them to /login.
  if (pathname === '/set-password') return NextResponse.next();

  if (pathname === '/login' || pathname === '/verify-otp') {
    if (session) return NextResponse.redirect(new URL('/dashboard', req.url));
    if (pathname === '/verify-otp' && !pending) return NextResponse.redirect(new URL('/login', req.url));
    return NextResponse.next();
  }

  if (!session) return NextResponse.redirect(new URL('/login', req.url));
  if (pathname === '/') return NextResponse.redirect(new URL('/dashboard', req.url));
  if (pathname.startsWith('/staff') && session.role !== 'super_admin') return NextResponse.redirect(new URL('/dashboard', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/|favicon.ico).*)'] };
