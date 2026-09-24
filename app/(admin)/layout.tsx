'use client';

import { useState, type ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useInactivityLock } from '@/hooks/useInactivityLock';
import { useNewOrderAlerts } from '@/hooks/useNewOrderAlerts';
import { useAdminAuth } from '@/providers/AdminAuthProvider';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { logout } = useAdminAuth();
  useNewOrderAlerts();
  const remainingMinutes = useInactivityLock(() => void logout());

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex text-stone-800 antialiased font-sans relative">
      <Sidebar mobileNavOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header remainingMinutes={remainingMinutes} onOpenNav={() => setMobileNavOpen(true)} />
        {children}
      </main>
    </div>
  );
}
