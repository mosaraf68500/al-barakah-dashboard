import type { Order } from '@/types';

/** Canonical lowercase order status (legacy mixed 'Shipped' / 'shipped'; see BUG_FIXES.md). */
export type OrderStatusValue = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export function normalizeOrderStatus(raw: unknown): OrderStatusValue | string {
  return String(raw ?? 'pending').trim().toLowerCase() || 'pending';
}

export const getOrderStatus = (o: Order): string => normalizeOrderStatus(o.status ?? o.orderStatus);
