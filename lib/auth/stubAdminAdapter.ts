import { ApiError, apiFetch, post } from '@/lib/api/http';
import type { AdminSession } from '@/types/admin';
import type { AdminAuthAdapter } from './AdminAuthAdapter';

/**
 * TEMP: Phase 2 stub, replaced by real JWT auth in Phase 3.
 * Talks to this app's /api/auth/* handlers, which verify NOTHING: any well-formed email + password reaches the OTP step and any
 * 6-digit code issues a mock super_admin session cookie.
 */
export const stubAdminAdapter: AdminAuthAdapter = {
  async restoreSession() {
    try {
      return (await apiFetch<{ session: AdminSession }>('/api/auth/me')).session;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      return null;
    }
  },
  async login(email, password) {
    await post('/api/auth/login', { email, password });
  },
  async verifyOtp(code) {
    return (await post<{ session: AdminSession }>('/api/auth/verify-otp', { code })).session;
  },
  async resendOtp() {
    await post('/api/auth/resend');
  },
  async logout() {
    await post('/api/auth/logout');
  },
};
