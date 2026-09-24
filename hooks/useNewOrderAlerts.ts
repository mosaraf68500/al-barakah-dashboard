'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/lib/api';
import { playOrderAlertSound, showBrowserOrderNotification } from '@/lib/audioAlert';
import { qk, useSettings } from '@/hooks/useAdminData';
import { useToast } from '@/providers/ToastProvider';

const POLL_MS = 15_000;

/**
 * Live new-order alerts (sound / browser push / toast). Legacy did this in App.tsx from a Firestore realtime listener; without
 * Firestore the admin polls the orders API every 15 s. The first load only records the known ids (no alert for existing orders).
 */
export function useNewOrderAlerts() {
  const showToast = useToast();
  const { data: settings } = useSettings();
  const cfg = useRef(settings?.notificationConfig);
  cfg.current = settings?.notificationConfig;
  const known = useRef<Set<string> | null>(null);

  const { data: orders } = useQuery({ queryKey: qk.orders, queryFn: getOrders, refetchInterval: POLL_MS });

  useEffect(() => {
    if (!orders) return;
    if (known.current === null) {
      known.current = new Set(orders.map((o) => o.id));
      return;
    }
    const fresh = orders.filter((o) => !known.current!.has(o.id));
    if (fresh.length === 0) return;
    fresh.forEach((o) => known.current!.add(o.id));

    const c = cfg.current;
    if (c?.soundEnabled) playOrderAlertSound(c.soundType || 'cash');
    if (c?.browserPushEnabled) showBrowserOrderNotification(fresh[0]);
    const amount = Number(fresh[0].totalAmount || fresh[0].total || 0).toLocaleString();
    showToast(`🔔 নতুন অর্ডার এসেছে! #${fresh[0].trackingCode || fresh[0].id.slice(-6)} (৳${amount})`);
  }, [orders, showToast]);
}
