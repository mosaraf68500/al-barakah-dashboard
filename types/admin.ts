import type { CategoryItem, Order, Product, ProductReview } from './index';
import type { CourierConfig, DeliveryConfig, OrderNotificationConfig, SeoConfig, FacebookPixelConfig, BKashPaymentConfig, HeroBannerConfig, HeroSlide, TopSellingSectionConfig } from './index';

/** Approved role model (ADMIN_MIGRATION_PLAN Q1): exactly two roles. */
export type AdminRole = 'super_admin' | 'admin';

export interface AdminSession {
  userId: string;
  name: string;
  email: string;
  role: AdminRole;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'Active' | 'Inactive';
  /** Seeded super_admin row that can never be revoked. */
  isPrimary?: boolean;
  createdAt?: string;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  status: 'SUCCESS' | 'FAILED' | string;
  timestamp: string;
  deviceInfo?: string;
}

/** Full (unfiltered) settings document as the admin sees it - includes secrets. */
export interface AdminSettings {
  /** Optimistic-locking counter from the backend; echoed back on every update. */
  version?: number;
  storeName?: string;
  supportPhone?: string;
  enableCustomerReviews: boolean;
  /** The coupon list itself lives in the dedicated Module 4 coupon API (`/v1/admin/coupons`), not in settings. */
  enableCoupons: boolean;
  heroBanners: HeroBannerConfig | HeroSlide[] | null;
  topSelling: TopSellingSectionConfig | null;
  deliveryConfig: DeliveryConfig;
  bkashConfig: BKashPaymentConfig;
  seoConfig: SeoConfig;
  facebookPixelConfig: FacebookPixelConfig;
  courierConfig: CourierConfig;
  notificationConfig: OrderNotificationConfig;
}

/** Same shape as the legacy backup file, so backups downloaded from the old app can still be restored. */
export interface DatabaseBackupPayload {
  version: string;
  backupDate: string;
  storeName: string;
  data: {
    products: Product[];
    orders: Order[];
    categories: CategoryItem[];
    reviews: ProductReview[];
    settings?: Record<string, unknown> | null;
  };
}

export interface SendCourierResult {
  success: boolean;
  provider: 'steadfast' | 'pathao';
  consignmentId?: string;
  trackingCode?: string;
  status?: string;
  message: string;
  simulated?: boolean;
  raw?: unknown;
  error?: string;
}

export interface IntegrationTestResult {
  success: boolean;
  simulated: boolean;
  message: string;
}

export interface HealthStatus {
  ok: boolean;
  latencyMs: number;
  mode: 'local-seed' | 'mongo';
  liveIntegrations: boolean;
}
