import { ApiError, apiFetch, post, setAdminAccessToken, setAdminRefreshToken } from '@/lib/api/http';
import type { AdminSession } from '@/types/admin';
import type { AdminAuthAdapter } from './AdminAuthAdapter';
import { encodePending, encodeSession, PENDING_COOKIE, SESSION_COOKIE } from './cookie';

const PENDING_KEY = 'abp_admin_pending_email';

function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function pendingEmail(): string {
  try {
    return sessionStorage.getItem(PENDING_KEY) || '';
  } catch {
    return '';
  }
}

export const jwtAdminAdapter: AdminAuthAdapter = {
  async restoreSession() {
    try {
      return (await apiFetch<{ session: AdminSession }>('/v1/admin-auth/me')).session;
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
      return null;
    }
  },

  async login(email, password) {
    await post('/v1/admin-auth/login', { email, password });
    const clean = email.trim().toLowerCase();
    writeCookie(PENDING_COOKIE, encodePending(clean), 10 * 60);
  },

  async verifyOtp(code) {
    const email = pendingEmail();
    if (!email) throw new ApiError('সেশনের মেয়াদ শেষ। আবার লগইন করুন।', 401);
    const res = await post<{ accessToken: string; refreshToken?: string; session: AdminSession }>('/v1/admin-auth/verify-otp', { email, code: code.trim() });
    setAdminAccessToken(res.accessToken);
    setAdminRefreshToken(res.refreshToken ?? null);
    writeCookie(SESSION_COOKIE, encodeSession(res.session), 60 * 60 * 12);
    clearCookie(PENDING_COOKIE);
    return res.session;
  },

  async resendOtp() {
    const email = pendingEmail();
    if (!email) throw new ApiError('সেশনের মেয়াদ শেষ। আবার লগইন করুন।', 401);
    await post('/v1/admin-auth/resend-otp', { email });
  },

  async logout() {
    try {
      await post('/v1/admin-auth/logout');
    } catch {
      /* already signed out */
    }
    setAdminAccessToken(null);
    setAdminRefreshToken(null);
    clearCookie(SESSION_COOKIE);
    clearCookie(PENDING_COOKIE);
  },
};
