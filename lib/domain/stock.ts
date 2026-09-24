import type { Order, Product } from '@/types';

/**
 * The single stock rule (legacy copy-pasted it three times inside AdminDashboard):
 *  - order moves to processing / shipped / delivered and stock was not yet deducted -> deduct once (`stockDeducted`)
 *  - order is cancelled and stock had been deducted -> restore
 * Items are matched by product id, else by name / name snapshot. A product with no stockCount is treated as 10 when deducting.
 */
export interface StockResult {
  products: Product[];
  stockDeducted: boolean;
  changed: boolean;
  direction: 'deducted' | 'restored' | 'none';
}

const findIndexFor = (products: Product[], item: any): number => {
  const pId = item.productId || item.id || item.product?.id;
  return products.findIndex(
    (p) => (pId && p.id === pId) || (item.name && p.name === item.name) || (item.productNameSnapshot && p.name === item.productNameSnapshot),
  );
};

export function applyStockRule(order: Order, newStatus: string, products: Product[]): StockResult {
  const normalized = (newStatus || '').toLowerCase();
  const shouldDeduct = normalized === 'processing' || normalized === 'shipped' || normalized === 'delivered';
  const isCancel = normalized === 'cancelled';
  const already = order.stockDeducted ?? false;

  const next = [...products];
  let changed = false;
  let stockDeducted = already;
  let direction: StockResult['direction'] = 'none';

  const items = Array.isArray(order.items) ? order.items : [];

  if (shouldDeduct && !already) {
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const i = findIndexFor(next, item);
      if (i === -1) continue;
      const current = typeof next[i].stockCount === 'number' ? next[i].stockCount! : 10;
      const updated = Math.max(0, current - qty);
      next[i] = { ...next[i], stockCount: updated, inStock: updated > 0 };
      changed = true;
    }
    stockDeducted = true;
    direction = 'deducted';
  } else if (isCancel && already) {
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const i = findIndexFor(next, item);
      if (i === -1) continue;
      const current = typeof next[i].stockCount === 'number' ? next[i].stockCount! : 0;
      const updated = current + qty;
      next[i] = { ...next[i], stockCount: updated, inStock: updated > 0 };
      changed = true;
    }
    stockDeducted = false;
    direction = 'restored';
  }

  return { products: next, stockDeducted, changed: changed, direction };
}
