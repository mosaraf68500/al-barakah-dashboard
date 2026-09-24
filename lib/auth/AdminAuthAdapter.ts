import type { AdminSession } from '@/types/admin';

/**
 * What the AdminAuthProvider needs from an auth back-end. UI never talks to an adapter directly - only via `useAdminAuth()` -
 * so Phase 3 swaps `stubAdminAdapter` for a real JWT adapter (POST /admin/auth/login, /verify-otp, ...) without touching components.
 * Flow: email + password  ->  6-digit OTP (5-minute expiry)  ->  dashboard. Roles: super_admin | admin.
 */
export interface AdminAuthAdapter {
  /** Restore a previous session on page load (or null). */
  restoreSession(): Promise<AdminSession | null>;
  /** Step 1. Resolves when the OTP step is required. */
  login(email: string, password: string): Promise<void>;
  /** Step 2. */
  verifyOtp(code: string): Promise<AdminSession>;
  resendOtp(): Promise<void>;
  logout(): Promise<void>;
}
