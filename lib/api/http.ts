/**
 * Fetch helper for the admin app. Talks to the Express API. The access token is kept in sessionStorage;
 * the refresh token is an httpOnly cookie on the API host.
 */
const ACCESS_KEY = 'abp_admin_access';
const REFRESH_KEY = 'abp_admin_refresh';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string, public details?: unknown) {
    super(message);
  }
}

export function getAdminAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function setAdminAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) sessionStorage.setItem(ACCESS_KEY, token);
    else sessionStorage.removeItem(ACCESS_KEY);
  } catch {
    /* storage unavailable */
  }
}

function getAdminRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setAdminRefreshToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) sessionStorage.setItem(REFRESH_KEY, token);
    else sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* storage unavailable */
  }
}

let refreshing: Promise<string | null> | null = null;

export function refreshAdminAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!refreshing) {
    refreshing = fetch(`${API_BASE}/v1/admin-auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Abp-Client': 'admin',
        ...(getAdminRefreshToken() ? { 'X-Abp-Refresh': getAdminRefreshToken()! } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          setAdminAccessToken(null);
          setAdminRefreshToken(null);
          return null;
        }
        const body = (await res.json()) as { accessToken?: string; refreshToken?: string };
        if (!body.accessToken) return null;
        setAdminAccessToken(body.accessToken);
        if (body.refreshToken) setAdminRefreshToken(body.refreshToken);
        return body.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('X-Abp-Client', 'admin');
  const token = getAdminAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
  const isAuthCall = path.includes('/admin-auth/login') || path.includes('/admin-auth/verify-otp') || path.includes('/admin-auth/refresh') || path.includes('/admin-auth/set-password');
  if (res.status === 401 && retry && !isAuthCall) {
    const next = await refreshAdminAccessToken();
    if (next) return apiFetch<T>(path, init, false);
  }
  if (res.status === 401 && typeof window !== 'undefined' && !isAuthCall && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/verify-otp') && !window.location.pathname.startsWith('/set-password')) {
    window.location.href = '/login';
  }
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(err.message || err.error || `HTTP error ${res.status}`, res.status, typeof err.error === 'string' ? err.error : undefined, err.details);
  }
  return res.json() as Promise<T>;
}

export const post = <T,>(path: string, data?: unknown) => apiFetch<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) });
export const put = <T,>(path: string, data?: unknown) => apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(data ?? {}) });
export const patch = <T,>(path: string, data?: unknown) => apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) });
export const del = <T,>(path: string) => apiFetch<T>(path, { method: 'DELETE' });
