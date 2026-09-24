import { z } from 'zod';

/** Boundary validation for the admin `/api/*` handlers (Phase 3 moves these into the backend). Unknown fields pass through untouched. */

export const productSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1, 'প্রোডাক্টের নাম দিতে হবে'),
    category: z.string().min(1, 'ক্যাটাগরি নির্বাচন করুন'),
    price: z.number().min(0, 'মূল্য ০ বা তার বেশি হতে হবে'),
    costPrice: z.number().min(0).optional(),
    originalPrice: z.number().min(0).optional(),
    // 0 is a valid stock value (BUG_FIXES.md - legacy turned a typed 0 into 25).
    stockCount: z.number().int().min(0).optional(),
    inStock: z.boolean(),
    image: z.string(),
    images: z.array(z.string()),
  })
  .passthrough();

export const categorySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1, 'ক্যাটাগরির নাম দিন'),
    slug: z.string().trim().min(1, 'স্লাগ দিন'),
    image: z.string(),
    enabled: z.boolean(),
    badge: z.string().optional(),
    order: z.number().optional(),
  })
  .passthrough();

export const categoryListSchema = z.object({ categories: z.array(categorySchema) });

const deliveryStatus = z.enum(['ADVANCE_PAID', 'ADVANCE_PENDING', 'FULL_PAID', 'COD_PENDING', 'VERIFIED', 'FAKE_SUSPECTED']);

export const orderPatchSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  deliveryPaymentStatus: deliveryStatus.optional(),
  toggleFakeSuspicion: z.boolean().optional(),
});

export const dispatchSchema = z.object({ provider: z.enum(['steadfast', 'pathao']).optional() });

export const settingsPatchSchema = z
  .object({
    storeName: z.string().optional(),
    supportPhone: z.string().optional(),
    enableCustomerReviews: z.boolean().optional(),
    enableCoupons: z.boolean().optional(),
    coupons: z.array(z.object({ id: z.string(), code: z.string().min(1), discountPercent: z.number().min(1).max(100), minSpend: z.number().min(0), status: z.enum(['active', 'expired']), usageCount: z.number() })).optional(),
    heroBanners: z.any().optional(),
    topSelling: z.any().optional(),
    deliveryConfig: z.object({ insideDhakaCharge: z.number().min(0), outsideDhakaCharge: z.number().min(0), subDhakaCharge: z.number().min(0), freeDeliveryThreshold: z.number().min(0) }).passthrough().optional(),
    bkashConfig: z.object({ personalNumber: z.string() }).passthrough().optional(),
    seoConfig: z.object({ metaTitle: z.string() }).passthrough().optional(),
    facebookPixelConfig: z.object({ pixelId: z.string() }).passthrough().optional(),
    courierConfig: z.object({ steadfast: z.any(), pathao: z.any() }).passthrough().optional(),
    notificationConfig: z.object({ soundEnabled: z.boolean() }).passthrough().optional(),
  })
  .strict();

export const staffSchema = z.object({
  name: z.string().trim().min(1, 'নাম দিন'),
  email: z.string().trim().email('সঠিক ইমেইল দিন'),
  role: z.enum(['super_admin', 'admin']),
});

export const backupSchema = z
  .object({
    version: z.string().optional(),
    backupDate: z.string().optional(),
    storeName: z.string().optional(),
    data: z.object({
      products: z.array(z.any()).optional(),
      categories: z.array(z.any()).optional(),
      orders: z.array(z.any()).optional(),
      reviews: z.array(z.any()).optional(),
      settings: z.record(z.string(), z.any()).nullable().optional(),
    }),
  })
  .passthrough();

export const telegramTestSchema = z.object({ botToken: z.string(), chatId: z.string() });
export const facebookTestSchema = z.object({
  eventName: z.enum(['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase']),
  customData: z.record(z.string(), z.any()).optional(),
});
