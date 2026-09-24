import type { AdminSession } from '@/types/admin';

/**
 * TEMP: Phase 2 stub, replaced by real JWT auth in Phase 3.
 * Edge-safe cookie codec (used by middleware.ts and the route handlers). The stub cookie is NOT signed - it only carries the
 * mock identity; nothing here verifies a credential.
 */
export const SESSION_COOKIE = 'abp_session';
export const PENDING_COOKIE = 'abp_pending';

const enc = (o: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec = <T,>(s: string | undefined): T | null => {
  if (!s) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(s)))) as T;
  } catch {
    return null;
  }
};

export const encodeSession = (s: AdminSession) => enc(s);
export const decodeSession = (v: string | undefined) => dec<AdminSession>(v);
export const encodePending = (email: string) => enc({ email });
export const decodePending = (v: string | undefined) => dec<{ email: string }>(v);
