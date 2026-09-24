export { INITIAL_CATEGORIES } from '@/lib/constants/categories';

export const CATEGORY_PRESET_IMAGES = [
  { label: 'Organic Foods / Honey', url: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Premium Watches', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' },
  { label: 'Luxury Attar / Oudh', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80' },
  { label: 'Sunnah Items / Dates', url: 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=600&auto=format&fit=crop&q=80' },
  { label: 'Women Collection', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80' },
  { label: 'Medicine & Health', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80' },
  { label: 'Baby & Kids Toys', url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&auto=format&fit=crop&q=80' },
  { label: 'Combo & Gift Packages', url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80' },
  { label: 'Offer & Flash Deals', url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80' },
  { label: 'Dry Fruits & Nuts', url: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=600&auto=format&fit=crop&q=80' },
];

export const QUICK_ADD_PRESETS = [
  { label: '+ 3ml, 6ml, 12ml', variants: ['3ml', '6ml', '12ml'] },
  { label: '+ 2kg, 5kg, 10kg', variants: ['2kg', '5kg', '10kg'] },
  { label: '+ 500g, 1kg, 2kg', variants: ['500g', '1kg', '2kg'] },
  { label: '+ 250g, 500g, 1kg', variants: ['250g', '500g', '1kg'] },
  { label: '+ 1 Litre, 5 Litre', variants: ['1 Litre', '5 Litre'] },
  { label: '+ 1 Pcs, 2 Pcs, 5 Pcs', variants: ['1 Pcs', '2 Pcs', '5 Pcs'] },
  { label: '+ 1 Box, 2 Box', variants: ['1 Box', '2 Box'] },
  { label: '+ 1 Strip, 1 Box', variants: ['1 Strip', '1 Box'] },
  { label: '+ S, M, L, XL', variants: ['S', 'M', 'L', 'XL'] },
];

export const DEFAULT_COURIER_CONFIG = {
  steadfast: { enabled: false, apiKey: '', secretKey: '', baseUrl: 'https://portal.steadfast.com.bd' },
  pathao: { enabled: false, clientId: '', clientSecret: '', username: '', password: '', storeId: '', baseUrl: 'https://api-hermes.pathao.com' },
  defaultCourier: 'steadfast' as const,
  autoSendOnConfirm: false,
};
