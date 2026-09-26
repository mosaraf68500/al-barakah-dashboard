import type { CouponItem } from '@/types';
import { apiFetch, del, patch, post } from './http';

export interface CouponCreateInput {
  code: string;
  discountPercent: number;
  minSpend?: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
}
export type CouponUpdateInput = Partial<CouponCreateInput>;

export const getCoupons = () => apiFetch<CouponItem[]>('/v1/admin/coupons');
export const createCoupon = (input: CouponCreateInput) => post<CouponItem>('/v1/admin/coupons', input);
export const updateCoupon = (id: string, input: CouponUpdateInput) => patch<CouponItem>(`/v1/admin/coupons/${encodeURIComponent(id)}`, input);
export const deleteCoupon = (id: string) => del<{ ok: true }>(`/v1/admin/coupons/${encodeURIComponent(id)}`);
