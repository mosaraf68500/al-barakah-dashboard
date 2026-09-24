import type { CategoryItem, Product } from '@/types';
import { INITIAL_CATEGORIES } from './constants';

/** Flexible category match used by the Products tab filter pills (copied from legacy AdminDashboard). */
export function isCategoryMatch(prodCategory: string | undefined, targetCategory: string): boolean {
  if (!prodCategory || !targetCategory) return false;
  const pCat = prodCategory.trim().toLowerCase();
  const tCat = targetCategory.trim().toLowerCase();
  if (pCat === tCat) return true;
  const pNorm = pCat.replace(/[\s\-_&]+/g, '');
  const tNorm = tCat.replace(/[\s\-_&]+/g, '');
  return pNorm === tNorm || pCat.includes(tCat) || tCat.includes(pCat);
}

/** DB categories + the 9 initial ones + any category found on a product, de-duplicated case-insensitively. */
export function availableProductCategories(categories: CategoryItem[], products: Product[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (name?: string) => {
    if (!name) return;
    const trimmed = name.trim();
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(trimmed);
    }
  };
  categories.forEach((c) => add(c.name));
  INITIAL_CATEGORIES.forEach((c) => add(c.name));
  products.forEach((p) => add(p.category));
  return out;
}

export function productCategoryCounts(names: string[], products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};
  names.forEach((n) => {
    counts[n] = products.filter((p) => isCategoryMatch(p.category, n)).length;
  });
  return counts;
}

export function filterProducts(products: Product[], categoryFilter: string, search: string): Product[] {
  return products.filter((p) => {
    if (categoryFilter !== 'all' && !isCategoryMatch(p.category, categoryFilter)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(p.name || '').toLowerCase().includes(q) && !(p.category || '').toLowerCase().includes(q) && !(p.id || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });
}
