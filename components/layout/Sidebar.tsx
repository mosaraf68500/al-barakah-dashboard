'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Flame, Layers } from 'lucide-react';
import { LayoutDashboard, LogOut, Package, QrCode, Settings, ShieldCheck, ShoppingCart, Sparkles, Star, Tag, TrendingUp, Users, X } from 'lucide-react';
import { computeMetrics } from '@/lib/domain/metrics';
import { useCategories, useOrders, useProducts, useSettings, useStaff } from '@/hooks/useAdminData';
import { useAdminAuth } from '@/providers/AdminAuthProvider';

const base = 'w-full flex items-center px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer';
const activeCls = 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]';
const idleCls = 'text-stone-300 hover:bg-emerald-950/60 hover:text-white';

function NavItem({ href, active, icon, label, badge, shadow }: { href: string; active: boolean; icon: ReactNode; label: string; badge?: ReactNode; shadow?: boolean }) {
  const cls = `${base} ${badge ? 'justify-between' : 'gap-3.5'} ${active ? `${activeCls}${shadow ? ' shadow-sm' : ''}` : idleCls}`;
  return (
    <Link href={href} className={cls}>
      {badge ? (
        <>
          <div className="flex items-center gap-3.5">
            {icon}
            <span className="text-center">{label}</span>
          </div>
          {badge}
        </>
      ) : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
    </Link>
  );
}

export function Sidebar({ mobileNavOpen, onClose }: { mobileNavOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { isSuperAdmin, logout } = useAdminAuth();
  const products = useProducts().data ?? [];
  const orders = useOrders().data ?? [];
  const categories = useCategories().data ?? [];
  const settings = useSettings().data;
  const staff = useStaff().data ?? [];
  const pendingCount = computeMetrics(orders).pendingCount;
  const is = (p: string) => pathname === p || pathname.startsWith(`${p}/`);
  const topSellingEnabled = settings?.topSelling?.enabled;

  return (
    <>
      {mobileNavOpen && <div onClick={onClose} className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen w-64 bg-[#03251a] text-stone-200 flex flex-col shrink-0 border-r border-emerald-950/40 select-none transform transition-transform duration-200 ease-in-out ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-6 py-6 border-b border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-stone-950 font-black shadow-md shrink-0">
              <Sparkles className="w-5 h-5 text-stone-950 fill-stone-950" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-[#D4AF37] uppercase leading-tight font-serif" style={{ fontFamily: "'Cinzel', Georgia, serif" }}>
                AL BARAKAH
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">PREMIUM ADMIN</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-stone-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" onClick={onClose}>
          <NavItem href="/dashboard" active={is('/dashboard')} shadow icon={<LayoutDashboard className="w-4 h-4 text-emerald-300" />} label="Dashboard" />
          <NavItem
            href="/products"
            active={is('/products')}
            icon={<Package className="w-4 h-4 text-emerald-300" />}
            label="Products"
            badge={<span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">{products.length}</span>}
          />
          <NavItem
            href="/landing-pages"
            active={is('/landing-pages')}
            shadow
            icon={<Sparkles className="w-4 h-4 text-amber-400" />}
            label="Facebook Ads & Landing"
            badge={<span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-stone-950">ADS</span>}
          />
          <NavItem
            href="/orders"
            active={is('/orders')}
            icon={<ShoppingCart className="w-4 h-4 text-emerald-300" />}
            label="Orders"
            badge={pendingCount > 0 ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-stone-950">{pendingCount}</span> : undefined}
          />
          <NavItem href="/customers" active={is('/customers')} icon={<Users className="w-4 h-4 text-emerald-300" />} label="Customers" />
          <NavItem
            href="/reports"
            active={is('/reports')}
            icon={<TrendingUp className="w-4 h-4 text-emerald-300" />}
            label="বিক্রয় ও লাভ-ক্ষতি"
            badge={<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">হিসাব</span>}
          />
          <NavItem href="/coupons" active={is('/coupons')} icon={<Tag className="w-4 h-4 text-emerald-300" />} label="Coupons" />
          <NavItem
            href="/banners"
            active={is('/banners')}
            icon={<Layers className="w-4 h-4 text-emerald-300" />}
            label="Hero & Banners"
            badge={<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">Live</span>}
          />
          <NavItem
            href="/top-selling"
            active={is('/top-selling')}
            icon={<Flame className="w-4 h-4 text-orange-400 fill-orange-400" />}
            label="Top Selling Items"
            badge={
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${topSellingEnabled ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'bg-stone-700 text-stone-400'}`}>
                {topSellingEnabled ? 'ON' : 'OFF'}
              </span>
            }
          />
          <NavItem
            href="/categories"
            active={is('/categories')}
            icon={<Sparkles className="w-4 h-4 text-emerald-300" />}
            label="Categories & Offers"
            badge={<span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">{categories.length}</span>}
          />
          <NavItem href="/reviews" active={is('/reviews')} icon={<Star className="w-4 h-4 text-emerald-300" />} label="Customer Reviews" />
          {isSuperAdmin && (
            <NavItem
              href="/staff"
              active={is('/staff')}
              icon={<ShieldCheck className="w-4 h-4 text-emerald-300" />}
              label="Admins & Staff"
              badge={<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950">{staff.length}</span>}
            />
          )}
          <NavItem
            href="/qr-studio"
            active={is('/qr-studio')}
            icon={<QrCode className="w-4 h-4 text-amber-400" />}
            label="QR & Sticker Studio"
            badge={<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">NEW</span>}
          />
          <NavItem href="/settings" active={is('/settings')} icon={<Settings className="w-4 h-4 text-emerald-300" />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-emerald-900/40">
          <button
            onClick={() => void logout()}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </aside>
    </>
  );
}
