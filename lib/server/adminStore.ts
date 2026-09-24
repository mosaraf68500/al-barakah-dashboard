// NOTE: no `server-only` import on purpose (same reasoning as the storefront's seedStore) - the browser bundle never contains this
// module because only /api route handlers import it.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { CategoryItem, Order, Product, ProductReview } from '@/types';
import { DEFAULT_BKASH_CONFIG, DEFAULT_DELIVERY_CONFIG, DEFAULT_FACEBOOK_PIXEL_CONFIG, DEFAULT_NOTIFICATION_CONFIG, DEFAULT_SEO_CONFIG } from '@/types';
import type { AdminAuditLog, AdminSettings, StaffMember } from '@/types/admin';
import { DEFAULT_COURIER_CONFIG } from '@/lib/domain/constants';
import { applyStockRule } from '@/lib/domain/stock';
import { normalizeOrderStatus } from '@/lib/domain/orderStatus';

/**
 * TEMP: Phase 2 only, replaced by real API in Phase 3.
 *
 * Local "database" for the admin app:
 *  - READS start from the one-time Firestore export in `data/seed/*.json` (point-in-time snapshot, NOT live data).
 *  - EVERY WRITE is persisted to `data/runtime/<collection>.json` (git-ignored) and wins over the seed on the next load.
 *    Delete `data/runtime/` to reset to the pristine snapshot.
 *  - This store is SEPARATE from the storefront's runtime store: admin edits do not appear on the storefront until Phase 3
 *    (both apps will then talk to the same backend). See KNOWN_LIMITATIONS.md.
 */

const SEED_DIR = path.join(process.cwd(), 'data', 'seed');
const RUNTIME_DIR = path.join(process.cwd(), 'data', 'runtime');
const MEDIA_DIR = path.join(RUNTIME_DIR, 'media');

type Doc = Record<string, any>;
interface MediaEntry { mime: string; buffer: Buffer }

interface State {
  products: Product[];
  categories: CategoryItem[];
  orders: Order[];
  reviews: ProductReview[];
  settings: Doc;
  staff: StaffMember[];
  audit: AdminAuditLog[];
  media: Map<string, MediaEntry>;
  /** mtime of data/runtime/orders.json as last read/written by this process (see syncOrders) */
  ordersMtime: number;
}

const g = globalThis as unknown as { __abpAdminStore?: State };

function readJson<T>(dir: string, file: string): T | undefined {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as T;
  } catch {
    return undefined;
  }
}

function persist(file: string, data: unknown) {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.writeFileSync(path.join(RUNTIME_DIR, file), JSON.stringify(data, null, 2)); // TEMP: Phase 2 only, replaced by real API in Phase 3
}

/** Lifts base64 images out of documents into the media table (persisted under data/runtime/media) and swaps in `/api/media/<hash>` URLs. */
function externalizeMedia<T>(value: T, media: Map<string, MediaEntry>, writeToDisk: boolean): T {
  if (typeof value === 'string') {
    if (!value.startsWith('data:image/')) return value;
    const comma = value.indexOf(',');
    if (comma < 0) return value;
    const meta = value.slice(5, comma);
    const mime = meta.split(';')[0] || 'image/jpeg';
    const isB64 = meta.includes(';base64');
    const payload = value.slice(comma + 1);
    const buffer = isB64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload));
    const hash = createHash('sha1').update(buffer).digest('hex').slice(0, 24);
    media.set(hash, { mime, buffer });
    if (writeToDisk) {
      fs.mkdirSync(MEDIA_DIR, { recursive: true });
      fs.writeFileSync(path.join(MEDIA_DIR, `${hash}.bin`), buffer);
      fs.writeFileSync(path.join(MEDIA_DIR, `${hash}.mime`), mime);
    }
    return `/api/media/${hash}` as unknown as T;
  }
  if (Array.isArray(value)) return value.map((v) => externalizeMedia(v, media, writeToDisk)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Doc = {};
    for (const [k, v] of Object.entries(value as Doc)) out[k] = externalizeMedia(v, media, writeToDisk);
    return out as T;
  }
  return value;
}

/** Fake staff for the Phase 2 stub. NEVER real owner emails (ADMIN_MIGRATION_PLAN 5.2). */
const STUB_STAFF: StaffMember[] = [
  { id: 'staff-1', name: 'Demo Owner', email: 'owner@albarakah.example', role: 'super_admin', status: 'Active', isPrimary: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'staff-2', name: 'Rafiq Ahmed', email: 'rafiq@albarakah.example', role: 'admin', status: 'Active', createdAt: '2026-02-10T00:00:00.000Z' },
  { id: 'staff-3', name: 'Nusrat Jahan', email: 'nusrat@albarakah.example', role: 'admin', status: 'Active', createdAt: '2026-03-04T00:00:00.000Z' },
  { id: 'staff-4', name: 'Kamal Hossain', email: 'kamal@albarakah.example', role: 'admin', status: 'Inactive', createdAt: '2026-04-21T00:00:00.000Z' },
  { id: 'staff-5', name: 'Sadia Rahman', email: 'sadia@albarakah.example', role: 'admin', status: 'Active', createdAt: '2026-05-30T00:00:00.000Z' },
];

function load(): State {
  const media = new Map<string, MediaEntry>();
  const pick = <T,>(runtimeFile: string, seedFile: string, fallback: T): T => {
    const rt = readJson<T>(RUNTIME_DIR, runtimeFile);
    if (rt !== undefined) return rt;
    return externalizeMedia(readJson<T>(SEED_DIR, seedFile) ?? fallback, media, false);
  };

  const settingsSeed = externalizeMedia(readJson<Doc[]>(SEED_DIR, 'settings.json') ?? [], media, false);
  const settings = readJson<Doc>(RUNTIME_DIR, 'settings.json') ?? settingsSeed.find((d) => d.id === 'general') ?? settingsSeed[0] ?? {};

  // Legacy audit rows described the removed passkey / master-key features - keep them as history but they are read-only.
  const audit = pick<AdminAuditLog[]>('audit.json', 'admin_audit_logs.json', []);

  const products = pick<Product[]>('products.json', 'products.json', []);
  if (products.length === 0) console.warn('[adminStore] data/seed/products.json is missing or empty');

  return {
    products,
    categories: pick<CategoryItem[]>('categories.json', 'categories.json', []),
    orders: pick<Order[]>('orders.json', 'orders.json', []),
    reviews: pick<ProductReview[]>('reviews.json', 'reviews.json', []),
    settings,
    staff: readJson<StaffMember[]>(RUNTIME_DIR, 'staff.json') ?? STUB_STAFF,
    audit,
    media,
    ordersMtime: 0,
  };
}

function state(): State {
  if (!g.__abpAdminStore) g.__abpAdminStore = load();
  return g.__abpAdminStore;
}

/* --------------------------------------------------------------------- media */

export function getMedia(hash: string): MediaEntry | undefined {
  const hit = state().media.get(hash);
  if (hit) return hit;
  try {
    const buffer = fs.readFileSync(path.join(MEDIA_DIR, `${hash}.bin`));
    const mime = fs.readFileSync(path.join(MEDIA_DIR, `${hash}.mime`), 'utf8');
    return { mime, buffer };
  } catch {
    return undefined;
  }
}

const ext = <T,>(v: T): T => externalizeMedia(v, state().media, true);

/* ------------------------------------------------------------------ products */

export const listProducts = (): Product[] => state().products;
export const getProduct = (id: string): Product | undefined => state().products.find((p) => p.id === id);

export function saveProductsList(next: Product[]) {
  state().products = next;
  persist('products.json', next);
}

export function upsertProduct(product: Product): Product {
  const saved = ext(product);
  const list = state().products;
  const i = list.findIndex((p) => p.id === saved.id);
  saveProductsList(i === -1 ? [saved, ...list] : list.map((p, idx) => (idx === i ? saved : p)));
  return saved;
}

export function removeProduct(id: string): boolean {
  const list = state().products;
  if (!list.some((p) => p.id === id)) return false;
  saveProductsList(list.filter((p) => p.id !== id));
  return true;
}

/* ---------------------------------------------------------------- categories */

export const listCategories = (): CategoryItem[] => [...state().categories].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

export function saveCategoriesList(next: CategoryItem[]): CategoryItem[] {
  // Legacy App renumbered `order` after every change.
  const renumbered = ext(next).map((c, i) => ({ ...c, order: i }));
  state().categories = renumbered;
  persist('categories.json', renumbered);
  return renumbered;
}

/* -------------------------------------------------------------------- orders */

/**
 * TEMP: Phase 2 only. Orders written to data/runtime/orders.json by ANOTHER process (a test, or - until Phase 3 - a script standing in
 * for the storefront) are picked up here when the file's mtime changes, so the admin's new-order alerts can be exercised end to end.
 */
function syncOrders() {
  try {
    const m = fs.statSync(path.join(RUNTIME_DIR, 'orders.json')).mtimeMs;
    if (m > state().ordersMtime) {
      const fresh = readJson<Order[]>(RUNTIME_DIR, 'orders.json');
      if (fresh) state().orders = fresh;
      state().ordersMtime = m;
    }
  } catch {
    /* no runtime file yet */
  }
}

export const listOrders = (): Order[] => {
  syncOrders();
  return state().orders;
};
export const getOrder = (id: string): Order | undefined => listOrders().find((o) => o.id === id);

export function saveOrdersList(next: Order[]) {
  state().orders = next;
  persist('orders.json', next);
  try {
    state().ordersMtime = fs.statSync(path.join(RUNTIME_DIR, 'orders.json')).mtimeMs;
  } catch {
    /* ignore */
  }
}

export function patchOrder(id: string, patch: Partial<Order>): Order | undefined {
  const list = listOrders();
  const i = list.findIndex((o) => o.id === id);
  if (i === -1) return undefined;
  const updated = { ...list[i], ...patch } as Order;
  saveOrdersList(list.map((o, idx) => (idx === i ? updated : o)));
  return updated;
}

export function removeOrder(id: string): boolean {
  const list = listOrders();
  if (!list.some((o) => o.id === id)) return false;
  saveOrdersList(list.filter((o) => o.id !== id));
  return true;
}

/**
 * The ONE place order status changes happen (legacy did this three times in the browser): normalises the status to lowercase,
 * applies the stock rule to the product list and saves both. Returns what happened so the UI can toast.
 */
export function setOrderStatus(id: string, status: string, extra: Partial<Order> = {}): { order: Order; stock: 'deducted' | 'restored' | 'none' } | undefined {
  const order = getOrder(id);
  if (!order) return undefined;
  const normalized = normalizeOrderStatus(status);
  const result = applyStockRule(order, normalized, state().products);
  if (result.changed) saveProductsList(result.products);
  const updated = patchOrder(id, { ...extra, status: normalized, stockDeducted: result.stockDeducted })!;
  return { order: updated, stock: result.direction };
}

/* ------------------------------------------------------------------- reviews */

export const listReviews = (): ProductReview[] => state().reviews;

export function removeReview(id: string): boolean {
  const list = state().reviews;
  if (!list.some((r) => r.id === id)) return false;
  state().reviews = list.filter((r) => r.id !== id);
  persist('reviews.json', state().reviews);
  return true;
}

/* ------------------------------------------------------------------ settings */

export function getSettings(): AdminSettings {
  const s = state().settings;
  return {
    storeName: s.storeName ?? 'Al Barakah Premium',
    supportPhone: s.supportPhone ?? '01316534171',
    enableCustomerReviews: typeof s.enableCustomerReviews === 'boolean' ? s.enableCustomerReviews : true,
    enableCoupons: typeof s.enableCoupons === 'boolean' ? s.enableCoupons : false,
    coupons: Array.isArray(s.coupons) ? s.coupons : [],
    heroBanners: s.heroBanners ?? null,
    topSelling: s.topSelling ?? null,
    deliveryConfig: { ...DEFAULT_DELIVERY_CONFIG, ...(s.deliveryConfig || {}) },
    bkashConfig: { ...DEFAULT_BKASH_CONFIG, ...(s.bkashConfig || {}), gateway: { ...DEFAULT_BKASH_CONFIG.gateway, ...(s.bkashConfig?.gateway || {}) } },
    seoConfig: { ...DEFAULT_SEO_CONFIG, ...(s.seoConfig || {}) },
    facebookPixelConfig: { ...DEFAULT_FACEBOOK_PIXEL_CONFIG, ...(s.facebookPixelConfig || {}) },
    courierConfig: {
      ...DEFAULT_COURIER_CONFIG,
      ...(s.courierConfig || {}),
      steadfast: { ...DEFAULT_COURIER_CONFIG.steadfast, ...(s.courierConfig?.steadfast || {}) },
      pathao: { ...DEFAULT_COURIER_CONFIG.pathao, ...(s.courierConfig?.pathao || {}) },
    },
    notificationConfig: {
      ...DEFAULT_NOTIFICATION_CONFIG,
      ...(s.notificationConfig || {}),
      telegram: { ...DEFAULT_NOTIFICATION_CONFIG.telegram, ...(s.notificationConfig?.telegram || {}) },
    },
  };
}

export function patchSettings(patch: Partial<AdminSettings>): AdminSettings {
  state().settings = { ...state().settings, ...ext(patch as Doc) };
  persist('settings.json', state().settings);
  return getSettings();
}

/* --------------------------------------------------------------------- staff */

export const listStaff = (): StaffMember[] => state().staff;

export function saveStaff(next: StaffMember[]) {
  state().staff = next;
  persist('staff.json', next);
}

/* --------------------------------------------------------------------- audit */

export const listAudit = (limit = 25): AdminAuditLog[] =>
  [...state().audit].sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0)).slice(0, limit);

export function addAudit(entry: Omit<AdminAuditLog, 'id' | 'timestamp'>): AdminAuditLog {
  const row: AdminAuditLog = { ...entry, id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString() };
  state().audit = [row, ...state().audit];
  persist('audit.json', state().audit);
  return row;
}

/* -------------------------------------------------------------------- backup */

export function snapshot() {
  const s = state();
  return { products: s.products, categories: s.categories, orders: listOrders(), reviews: s.reviews, settings: s.settings };
}

export function restoreSnapshot(data: { products?: Product[]; categories?: CategoryItem[]; orders?: Order[]; reviews?: ProductReview[]; settings?: Doc }) {
  const s = state();
  if (Array.isArray(data.products)) { s.products = ext(data.products); persist('products.json', s.products); }
  if (Array.isArray(data.categories)) { s.categories = ext(data.categories); persist('categories.json', s.categories); }
  if (Array.isArray(data.orders)) { s.orders = ext(data.orders); persist('orders.json', s.orders); }
  if (Array.isArray(data.reviews)) { s.reviews = data.reviews; persist('reviews.json', s.reviews); }
  if (data.settings && typeof data.settings === 'object') { s.settings = { ...s.settings, ...ext(data.settings) }; persist('settings.json', s.settings); }
}
