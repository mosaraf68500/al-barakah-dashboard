import type { HeroBannerConfig } from '@/types';

export const DEFAULT_HERO_CONFIG: HeroBannerConfig = {
  slides: [
    {
      id: 'slide-dates-offer',
      badge: '',
      title: 'প্রিমিয়াম খেজুর ও অফার জোন',
      subtitle: '',
      ctaText: '',
      targetType: 'category',
      targetValue: 'Organic Foods',
      image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=1600&auto=format&fit=crop&q=90',
      enabled: true
    },
    {
      id: 'slide-attar',
      badge: '',
      title: '১০০% খাঁটি আতর ও সুবাস কালেকশন',
      subtitle: '',
      ctaText: '',
      targetType: 'category',
      targetValue: 'Luxury Attar',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&auto=format&fit=crop&q=90',
      enabled: true
    },
    {
      id: 'slide-honey',
      badge: '',
      title: 'সুন্দরবনের খাঁটি প্রাকৃতিক মধু',
      subtitle: '',
      ctaText: '',
      targetType: 'category',
      targetValue: 'Organic Foods',
      image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1600&auto=format&fit=crop&q=90',
      enabled: true
    },
    {
      id: 'slide-watches',
      badge: '',
      title: 'রয়েল প্রিমিয়াম অ্যারাবিক ওয়াচ',
      subtitle: '',
      ctaText: '',
      targetType: 'category',
      targetValue: 'Premium Watches',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1600&auto=format&fit=crop&q=90',
      enabled: true
    }
  ],
  promoCard: {
    id: 'promo-honeynuts',
    badge: '',
    title: 'হানি নাটস স্পেশাল ডিসকাউন্ট',
    subtitle: '',
    ctaText: '',
    targetType: 'category',
    targetValue: 'Organic Foods',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1000&auto=format&fit=crop&q=90',
    enabled: true
  }
};
