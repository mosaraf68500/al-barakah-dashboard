export interface LandingPageVariant {
  id: string;
  label: string; // e.g. "১ লিটার বোতল", "২ লিটার কম্বো", "৫ লিটার ফ্যামিলি প্যাক"
  size: string;  // e.g. "1 Litre", "2 Litre", "5 Litre"
  price: number; // e.g. 350
  originalPrice?: number; // e.g. 400
  isPopular?: boolean;
  freeDelivery?: boolean;
}

export interface ProductLandingPageConfig {
  enabled?: boolean;
  headline?: string;
  subheadline?: string;
  highlightBadge?: string;
  videoUrl?: string; // YouTube or direct video embed
  bannerNote?: string; // e.g. "🔥 আজকের বিশেষ অফার: ৫ লিটার নিলে সারা বাংলাদেশে ফ্রি ডেলিভারি!"
  keyBenefits?: string[];
  variants?: LandingPageVariant[];
  guaranteeTitle?: string;
  guaranteeText?: string;
  trustPoints?: string[];
  faqs?: { question: string; answer: string }[];
  customerHelpline?: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  categoryId?: string;
  categoryName?: string;
  subcategory?: string;
  brand?: string;
  origin?: string;
  weight?: string;
  sku?: string;
  isHot?: boolean;
  isNew?: boolean;
  description: string;
  price: number;
  costPrice?: number; // Secret admin purchase/cost price for calculating profit & loss
  originalPrice?: number;
  stockCount?: number;
  inStock: boolean;
  badge?: 'BESTSELLER' | 'HOT' | 'SALE' | 'NEW';
  image: string;
  images: string[];
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  features?: string[];
  tags?: string[];
  rating: number;
  reviewCount: number;
  landingPage?: ProductLandingPageConfig;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  enabled: boolean;
  badge?: string;
  order?: number;
}

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle?: string;
  ctaText: string;
  targetType: 'category' | 'product' | 'all';
  targetValue: string;
  image: string;
  enabled: boolean;
  order?: number;
}

export interface PromoCard {
  id: string;
  badge?: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  targetType: 'category' | 'product' | 'all';
  targetValue: string;
  image: string;
  enabled: boolean;
}

export interface HeroBannerConfig {
  slides: HeroSlide[];
  promoCard: PromoCard;
}

import type { TopSellingSectionConfig } from './topSelling';
export * from './topSelling';

export type Category = 
  | 'All' 
  | 'Organic Foods' 
  | 'Premium Watches' 
  | 'Luxury Attar' 
  | 'Sunnah Products' 
  | 'Women Collection' 
  | 'Medicine & Health' 
  | 'Baby Toys'
  | 'Combo' 
  | 'Offer Zone' 
  | string;

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  customPrice?: number;
}

export interface OrderItem {
  id?: string;
  productId?: string;
  productNameSnapshot: string;
  productImageSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  totalPrice: number;
}

export interface CourierConfig {
  steadfast: {
    enabled: boolean;
    apiKey: string;
    secretKey: string;
    baseUrl?: string;
  };
  pathao: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
    storeId: string;
    baseUrl?: string;
  };
  defaultCourier: 'steadfast' | 'pathao' | 'manual';
  autoSendOnConfirm: boolean;
}

export interface DeliveryConfig {
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  subDhakaCharge: number;
  enableSubDhaka: boolean;
  freeDeliveryThreshold: number;
  enableFreeDelivery: boolean;
  estimatedInsideDhakaDays: string;
  estimatedOutsideDhakaDays: string;
  deliveryNotice: string;
  requireAdvanceDeliveryCharge?: boolean; // If true, delivery charge must be paid in advance to prevent fake orders
  advanceDeliveryNotice?: string;
}

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  insideDhakaCharge: 80,
  outsideDhakaCharge: 160,
  subDhakaCharge: 100,
  enableSubDhaka: false,
  freeDeliveryThreshold: 2000,
  enableFreeDelivery: false,
  estimatedInsideDhakaDays: '১-২ কার্যদিবস',
  estimatedOutsideDhakaDays: '২-৪ কার্যদিবস',
  deliveryNotice: 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।',
  requireAdvanceDeliveryCharge: true,
  advanceDeliveryNotice: 'ফেক অর্ডার ও রিটার্ন রোধে শুধুমাত্র ডেলিভারি চার্জ অগ্রিম বিকাশ করতে হবে। বাকি পণ্যের মূল্য পার্সেল হাতে পেয়ে পরিশোধ করবেন।',
};

export interface OrderNotificationConfig {
  soundEnabled: boolean;
  soundType: 'cash' | 'chime' | 'bell';
  browserPushEnabled: boolean;
  telegram: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
}

export const DEFAULT_NOTIFICATION_CONFIG: OrderNotificationConfig = {
  soundEnabled: true,
  soundType: 'cash',
  browserPushEnabled: true,
  telegram: {
    enabled: false,
    botToken: '',
    chatId: '',
  },
};

export interface Order {
  id: string;
  userId?: string;
  trackingCode?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  cityDistrict?: string;
  subtotalAmount?: number;
  discountAmount?: number;
  deliveryFee?: number;
  totalAmount?: number;
  currency?: 'BDT' | 'USD';
  paymentMethod?: string;
  paymentStatus?: 'UNPAID' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED';
  orderStatus?: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  couponCode?: string;
  notes?: string;
  createdAt: string;
  items?: any[];
  subtotal?: number;
  discount?: number;
  shipping?: number;
  total?: number;
  status?: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | string;
  customer?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode?: string;
    paymentMethod: string;
  };
  // Courier Integration Fields
  courierProvider?: 'steadfast' | 'pathao' | 'manual' | string;
  courierConsignmentId?: string;
  courierTrackingCode?: string;
  courierStatus?: string;
  courierSentAt?: string;
  courierResponse?: any;
  // bKash & Advance Payment Details
  senderBkashNumber?: string;
  bkashTrxId?: string;
  paymentRefNumber?: string;
  advancePaymentType?: 'DELIVERY_ONLY' | 'FULL_PAYMENT' | 'NONE';
  advanceAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  dueAmountOnDelivery?: number;
  deliveryPaymentStatus?: 'ADVANCE_PAID' | 'ADVANCE_PENDING' | 'FULL_PAID' | 'COD_PENDING' | 'VERIFIED' | 'FAKE_SUSPECTED'; // FAKE_SUSPECTED was used by the legacy admin but missing from the type
  paymentDetails?: any;
  isFakeSuspected?: boolean;
  stockDeducted?: boolean;
}

export interface FilterState {
  category: Category;
  subcategory?: string;
  searchQuery?: string;
  search?: string;
  inStockOnly: boolean;
  minPrice: number;
  maxPrice: number;
  minRating?: number;
  sortBy?: 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';
  sort?: 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';
  onSaleOnly?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'customer' | 'admin' | 'super_admin';
}

export interface ProductReview {
  id: string;
  productId: string;
  productName?: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  verifiedPurchase?: boolean;
  city?: string;
  approved?: boolean;
}

export interface FacebookPixelEventLog {
  id: string;
  eventName: string;
  timestamp: string;
  data: Record<string, any>;
  method: 'Browser Pixel' | 'Conversions API (CAPI)' | 'Both';
  status: 'SUCCESS' | 'WARNING' | 'TEST';
}

export interface FacebookPixelConfig {
  pixelId: string;
  accessToken?: string;
  testEventCode?: string;
  domainVerificationCode?: string;
  enabled: boolean;
  enableCapi: boolean;
  trackPageView: boolean;
  trackViewContent: boolean;
  trackAddToCart: boolean;
  trackInitiateCheckout: boolean;
  trackPurchase: boolean;
  customCurrency?: string;
}

export const DEFAULT_FACEBOOK_PIXEL_CONFIG: FacebookPixelConfig = {
  pixelId: '',
  accessToken: '',
  testEventCode: '',
  domainVerificationCode: '',
  enabled: true,
  enableCapi: false,
  trackPageView: true,
  trackViewContent: true,
  trackAddToCart: true,
  trackInitiateCheckout: true,
  trackPurchase: true,
  customCurrency: 'BDT',
};

export interface BKashGatewayCredentials {
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
  isSandbox: boolean; // Sandbox (Test) vs Production (Live)
  autoCapture: boolean;
  callbackUrl?: string;
}

export interface BKashPaymentConfig {
  enabled: boolean;
  mode: 'MANUAL' | 'GATEWAY'; // Manual personal transfer or Official API Gateway
  // Manual Personal/Merchant Number
  personalNumber: string;
  accountType: 'Personal' | 'Agent' | 'Merchant';
  manualInstructions: string;
  requireTrxId: boolean;
  // Official bKash Payment Gateway (PGW)
  gateway: BKashGatewayCredentials;
}

export interface CouponItem {
  id: string;
  code: string;
  discountPercent: number;
  minSpend: number;
  status: 'active' | 'expired';
  usageCount: number;
  isActive: boolean;
  maxDiscountAmount?: number;
  usageLimit?: number;
  expiresAt?: string;
  deletedAt?: string | null;
  createdAt?: string;
}

export interface SeoConfig {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  keywords?: string;
  siteName?: string;
  canonicalUrl?: string;
  twitterHandle?: string;
}

export const DEFAULT_SEO_CONFIG: SeoConfig = {
  metaTitle: 'Al Barakah Premium — Luxury Islamic Lifestyle & Organic Products',
  metaDescription: 'An elegant, premium eCommerce platform for Al Barakah Premium in Bangladesh, featuring pure organic honey, extra virgin mustard oil, luxury attars, sunnah items, and premium lifestyle.',
  ogImage: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&q=80&w=1200',
  keywords: 'Al Barakah Premium, Organic Mustard Oil, Pure Honey, Kalo Jeera Oil, Luxury Attar, Islamic Lifestyle, Bangladesh Organic Food',
  siteName: 'Al Barakah Premium',
  canonicalUrl: 'https://albarakahpremium.com',
  twitterHandle: '@albarakahpremium',
};

export const DEFAULT_BKASH_CONFIG: BKashPaymentConfig = {
  enabled: true,
  mode: 'MANUAL',
  personalNumber: '01316534171',
  accountType: 'Personal',
  manualInstructions: 'আপনার বিকাশ অ্যাপ বা ইউএসএসডি কোড *247# ডায়াল করে Send Money অপশনে গিয়ে উপরের নাম্বারে মোট বিল পাঠান। এরপর নিচে আপনার বিকাশ নাম্বার ও ট্রানজেকশন আইডি (TrxID) দিয়ে অর্ডার সম্পূর্ণ করুন।',
  requireTrxId: true,
  gateway: {
    appKey: '',
    appSecret: '',
    username: '',
    password: '',
    isSandbox: true,
    autoCapture: true,
    callbackUrl: '',
  },
};



/**
 * Public store settings as returned by `lib/api/settings.getSettings()`.
 * (A safe projection of the legacy `settings/general` doc - secrets such as bKash gateway credentials and the
 * Facebook CAPI token are blanked server-side; courier/Telegram config is never exposed to the storefront.)
 */
export interface StoreSettings {
  enableCustomerReviews: boolean;
  enableCoupons: boolean;
  coupons: CouponItem[];
  heroBanners: HeroBannerConfig | HeroSlide[] | null;
  topSelling: TopSellingSectionConfig | null;
  deliveryConfig: DeliveryConfig;
  bkashConfig: BKashPaymentConfig;
  seoConfig: SeoConfig;
  facebookPixelConfig: FacebookPixelConfig;
}

export interface ReviewInput {
  productId: string;
  productName?: string;
  customerName: string;
  rating: number;
  comment: string;
  verifiedPurchase?: boolean;
  city?: string;
}

/** Identity used to look up "my orders". TEMP: Phase 1 stub - Phase 3 derives it from the JWT. */
export interface CustomerIdentity {
  email?: string;
  phone?: string;
  userId?: string;
}
