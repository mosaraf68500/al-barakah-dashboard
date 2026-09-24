import type { Order } from '@/types';
import { getCustomerAddress, getCustomerName, getCustomerPhone, getOrderTotal } from './orderAccessors';
import { sortOrdersNewestFirst } from './metrics';

export interface CustomerRow {
  key: string;
  name: string;
  phone: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

/** Group orders per customer (phone, else name). Legacy listed one row per ORDER with a hard-coded "1 Order" (BUG_FIXES.md). */
export function groupCustomers(orders: Order[]): CustomerRow[] {
  const map = new Map<string, CustomerRow>();
  for (const o of sortOrdersNewestFirst(orders)) {
    const phone = getCustomerPhone(o);
    const key = phone && phone !== 'N/A' ? phone.replace(/\D/g, '').slice(-10) || phone : getCustomerName(o);
    const row = map.get(key);
    if (row) {
      row.orderCount += 1;
      row.totalSpent += getOrderTotal(o);
    } else {
      map.set(key, {
        key,
        name: getCustomerName(o),
        phone,
        address: getCustomerAddress(o),
        orderCount: 1,
        totalSpent: getOrderTotal(o),
        lastOrderAt: o.createdAt,
      });
    }
  }
  return [...map.values()];
}
