import type { Order } from '@/types';
import { getCustomerName, getCustomerPhone, getOrderTotal } from './orderAccessors';
import { getOrderStatus } from './orderStatus';

export interface DashboardMetrics {
  deliveredCount: number;
  pendingCount: number;
  deliveredSales: number;
  pendingRevenue: number;
  uniqueCustomers: number;
}

export function computeMetrics(orders: Order[]): DashboardMetrics {
  const delivered = orders.filter((o) => getOrderStatus(o) === 'delivered');
  const pending = orders.filter((o) => ['pending', 'processing'].includes(getOrderStatus(o)));
  return {
    deliveredCount: delivered.length,
    pendingCount: pending.length,
    deliveredSales: delivered.reduce((s, o) => s + getOrderTotal(o), 0),
    pendingRevenue: pending.reduce((s, o) => s + getOrderTotal(o), 0),
    uniqueCustomers: new Set(orders.map((o) => getCustomerPhone(o) || getCustomerName(o))).size,
  };
}

export interface SalesBar {
  day: string;
  amount: number;
  height: string;
}

/**
 * Real replacement for the legacy hard-coded fake weekly chart (BUG_FIXES.md): revenue per calendar day for the last 7 days
 * (oldest first, weekday labels), cancelled orders excluded, heights relative to the busiest day (min 4% so an empty day still shows a stub).
 */
export function computeWeeklySales(orders: Order[], now: Date = new Date()): SalesBar[] {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days: { start: number; label: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({ start: d.getTime(), label: labels[d.getDay()], amount: 0 });
  }
  const DAY = 24 * 60 * 60 * 1000;
  for (const o of orders) {
    if (getOrderStatus(o) === 'cancelled') continue;
    const t = new Date(o.createdAt).getTime();
    if (Number.isNaN(t)) continue;
    const bucket = days.find((d) => t >= d.start && t < d.start + DAY);
    if (bucket) bucket.amount += getOrderTotal(o);
  }
  const max = Math.max(...days.map((d) => d.amount), 0);
  return days.map((d) => ({
    day: d.label,
    amount: d.amount,
    height: max > 0 ? `${Math.max(4, Math.round((d.amount / max) * 100))}%` : '4%',
  }));
}

/** "Recent orders": newest first by createdAt (legacy sliced the raw array = Firestore doc-id order). */
export function sortOrdersNewestFirst(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
}
