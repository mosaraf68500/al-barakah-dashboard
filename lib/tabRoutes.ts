/** Legacy `activeTab` ids -> App Router paths (used where the ported JSX still says setActiveTab('...')). */
const ROUTES: Record<string, string> = {
  dashboard: '/dashboard',
  products: '/products',
  landingPages: '/landing-pages',
  topSelling: '/top-selling',
  orders: '/orders',
  customers: '/customers',
  reports: '/reports',
  coupons: '/coupons',
  banners: '/banners',
  categories: '/categories',
  reviews: '/reviews',
  staff: '/staff',
  settings: '/settings',
  qrcode: '/qr-studio',
};
export const tabHref = (tab: string) => ROUTES[tab] ?? '/dashboard';
