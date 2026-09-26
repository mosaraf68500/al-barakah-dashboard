'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuditLogs, getCategories, getCoupons, getHealth, getOrders, getProducts, getReviews, getSettings, getStaff } from '@/lib/api';
import { useAdminAuth } from '@/providers/AdminAuthProvider';

export const qk = {
  products: ['products'] as const,
  categories: ['categories'] as const,
  orders: ['orders'] as const,
  settings: ['settings'] as const,
  coupons: ['coupons'] as const,
  reviews: ['reviews'] as const,
  staff: ['staff'] as const,
  audit: ['audit'] as const,
  health: ['health'] as const,
};

export const useProducts = (includeArchived = false) =>
  useQuery({ queryKey: includeArchived ? [...qk.products, 'archived'] : qk.products, queryFn: () => getProducts(includeArchived) });
export const useCategories = () => useQuery({ queryKey: qk.categories, queryFn: getCategories });
export const useOrders = () => useQuery({ queryKey: qk.orders, queryFn: getOrders });
export const useSettings = () => useQuery({ queryKey: qk.settings, queryFn: getSettings });
export const useCoupons = () => useQuery({ queryKey: qk.coupons, queryFn: getCoupons });
export const useReviews = () => useQuery({ queryKey: qk.reviews, queryFn: getReviews, refetchOnMount: 'always', refetchOnWindowFocus: true });
export const useHealth = () => useQuery({ queryKey: qk.health, queryFn: getHealth, refetchInterval: 60_000 });

/** Staff and audit are super_admin only (the API returns 403 otherwise), so only fetch for that role. */
export function useStaff() {
  const { isSuperAdmin } = useAdminAuth();
  return useQuery({ queryKey: qk.staff, queryFn: getStaff, enabled: isSuperAdmin });
}
export function useAuditLogs(enabled: boolean) {
  return useQuery({ queryKey: qk.audit, queryFn: () => getAuditLogs(25), enabled });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: (readonly string[])[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k })));
}
