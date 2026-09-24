export interface TopSellingItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  badgeText?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  overridePrice?: number;
  overrideOriginalPrice?: number;
  overrideWeight?: string;
  enabled?: boolean;
  order?: number;
}

export type TopSellingItemConfig = TopSellingItem;

export interface TopSellingSectionConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  items: TopSellingItem[];
}

export const DEFAULT_TOP_SELLING_CONFIG: TopSellingSectionConfig = {
  enabled: true,
  title: 'Top Selling Products',
  subtitle: '',
  items: [
    {
      id: 'top-1',
      productId: 'prod-mustard-oil-5l',
      name: 'Deshi Authentic Mustard Oil 5 liter',
      price: 1650,
      originalPrice: 1700,
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
      badge: 'Best Selling'
    },
    {
      id: 'top-2',
      productId: 'prod-watch-1',
      name: 'Arabic Numerals Automatic Mechanical Skeleton Watch',
      price: 3850,
      originalPrice: 5200,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      badge: 'Best Selling'
    },
    {
      id: 'top-3',
      productId: 'prod-attar-1',
      name: 'Dehn Al Oudh Royale (100% Pure Aged Cambodi Agarwood)',
      price: 2450,
      originalPrice: 3200,
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80',
      badge: 'Best Selling'
    },
    {
      id: 'top-4',
      productId: 'prod-org-1',
      name: 'Madinah Jumbo Ajwa Dates (VIP Grade A - 500g Resealable Tin)',
      price: 1450,
      originalPrice: 1800,
      image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=80',
      badge: 'Best Selling'
    }
  ]
};
