'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AdminAuthAdapter } from '@/lib/auth/AdminAuthAdapter';
import { jwtAdminAdapter } from '@/lib/auth/jwtAdminAdapter';
import type { AdminSession } from '@/types/admin';

interface AdminAuthContextValue {
  session: AdminSession | null;
  loading: boolean;
  isSuperAdmin: boolean;
  /** Email that passed step 1 and is waiting for its OTP. */
  pendingEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);
const PENDING_KEY = 'abp_admin_pending_email';

export function AdminAuthProvider({ children, adapter = jwtAdminAdapter }: { children: ReactNode; adapter?: AdminAuthAdapter }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      setPendingEmail(sessionStorage.getItem(PENDING_KEY));
    } catch {
      /* storage unavailable */
    }
    let alive = true;
    adapter.restoreSession().then((s) => {
      if (!alive) return;
      setSession(s);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [adapter]);

  const login = useCallback(
    async (email: string, password: string) => {
      await adapter.login(email, password);
      const clean = email.trim().toLowerCase();
      setPendingEmail(clean);
      try {
        sessionStorage.setItem(PENDING_KEY, clean);
      } catch {
        /* storage unavailable */
      }
    },
    [adapter],
  );

  const verifyOtp = useCallback(
    async (code: string) => {
      setSession(await adapter.verifyOtp(code));
      setPendingEmail(null);
      try {
        sessionStorage.removeItem(PENDING_KEY);
      } catch {
        /* storage unavailable */
      }
    },
    [adapter],
  );

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      loading,
      isSuperAdmin: session?.role === 'super_admin',
      pendingEmail,
      login,
      verifyOtp,
      resendOtp: () => adapter.resendOtp(),
      logout: async () => {
        await adapter.logout();
        setSession(null);
        window.location.href = '/login';
      },
    }),
    [session, loading, pendingEmail, login, verifyOtp, adapter],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return ctx;
}
