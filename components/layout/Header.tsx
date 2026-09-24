'use client';

import { usePathname } from 'next/navigation';
import { Clock, Lock, Menu, RefreshCw, Sparkles, Store } from 'lucide-react';
import { useHealth, qk } from '@/hooks/useAdminData';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminAuth } from '@/providers/AdminAuthProvider';

const TITLES: [string, string][] = [
  ['/dashboard', 'Dashboard Summary'],
  ['/products/new', 'Add New Product'],
  ['/products', 'Products Management'],
  ['/landing-pages', 'Facebook Ads & Landing Pages'],
  ['/top-selling', 'Top Selling Items Management'],
  ['/courier', 'Orders Processing'],
  ['/orders', 'Orders Processing'],
  ['/customers', 'Customer Base'],
  ['/reports', 'Sales & Analytics Reports'],
  ['/coupons', 'Discount Coupons'],
  ['/categories', 'Categories & Offer Banners'],
  ['/banners', 'Hero & Banners Customizer'],
  ['/reviews', 'Customer Reviews Moderation'],
  ['/staff', 'Admins & Staff Access Control'],
  ['/qr-studio', 'QR & Sticker Studio'],
  ['/settings', 'Store Configuration & Settings'],
];

function titleFor(pathname: string) {
  if (/^\/products\/[^/]+\/edit/.test(pathname)) return 'Edit Product';
  if (/^\/orders\/[^/]+/.test(pathname)) return 'Order Details';
  return TITLES.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1] ?? '';
}

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';

export function Header({ remainingMinutes, onOpenNav }: { remainingMinutes: number; onOpenNav: () => void }) {
  const pathname = usePathname();
  const { session, logout } = useAdminAuth();
  const health = useHealth();
  const qc = useQueryClient();
  const connected = health.data?.ok === true;
  const initials = (session?.name || session?.email || 'AB').split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join('') || 'AB';
  const roleLabel = session?.role === 'super_admin' ? 'Super Admin' : 'Admin';

  return (
    <header className="bg-white border-b border-stone-200 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2.5">
        <button onClick={onOpenNav} className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer" aria-label="Open sidebar">
          <Menu className="w-5 h-5" />
        </button>

        <Sparkles className="w-5 h-5 text-emerald-600 fill-emerald-600 hidden xs:block" />
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-stone-900 font-serif tracking-tight truncate max-w-[200px] sm:max-w-none" style={{ fontFamily: "'Cinzel', Georgia, serif" }}>
          {titleFor(pathname)}
        </h2>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Data health badge (replaces the legacy "Firestore Live" badge - there is no Firestore any more) */}
        <button
          onClick={() => void qc.invalidateQueries({ queryKey: qk.health })}
          disabled={health.isFetching}
          className={`flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
            connected ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
          }`}
          title={`Data source: ${health.data?.mode ?? 'unknown'}\nLive integrations: ${health.data?.liveIntegrations ? 'ON' : 'OFF (simulated)'}\nClick to re-test`}
        >
          <span className="relative flex h-2.5 w-2.5">
            {connected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            )}
          </span>
          <div className="flex flex-col text-left">
            <span className="font-bold text-[11px] leading-none flex items-center gap-1">
              {connected ? 'Data Live' : 'DB Offline'}
              {health.data?.latencyMs !== undefined && <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">{health.data.latencyMs}ms</span>}
            </span>
            <span className="text-[9px] text-stone-500 font-mono hidden xl:inline truncate max-w-[120px]">{health.data?.mode ?? '...'}</span>
          </div>
          <RefreshCw className={`w-3 h-3 text-stone-400 hover:text-stone-700 ${health.isFetching ? 'animate-spin' : ''}`} />
        </button>

        <div
          className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold shadow-xs"
          title="১০ মিনিট কোনো কাজ না করলে অ্যাডমিন সেশন স্বয়ংক্রিয়ভাবে লক হয়ে যাবে।"
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span className="text-[11px] font-medium">
            অটো-লক: <strong className="font-mono font-bold text-amber-950">{remainingMinutes}মিনিট</strong>
          </span>
          <button onClick={() => void logout()} className="ml-1 p-1 hover:bg-amber-200/60 rounded-md text-amber-800 transition-colors cursor-pointer" title="এখনই সেশন লক করুন">
            <Lock className="w-3.5 h-3.5 text-amber-800" />
          </button>
        </div>

        <a
          href={STOREFRONT_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs sm:text-sm font-bold shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Return to Customer Storefront"
        >
          <Store className="w-4 h-4" />
          <span className="hidden sm:inline">View Store</span>
        </a>

        <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200">
          <div className="w-8 h-8 rounded-full bg-[#112d22] text-[#D4AF37] text-xs font-black flex items-center justify-center shadow-xs">{initials}</div>
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-stone-800 leading-tight">{roleLabel}</div>
            <div className="text-[10px] text-stone-400 font-mono truncate max-w-[150px]">{session?.email}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
