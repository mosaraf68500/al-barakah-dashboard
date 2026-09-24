'use client';

import { useEffect, useRef, useState } from 'react';

export const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes (legacy value; the old tooltip wrongly said 30)

/** Auto-lock after 10 minutes without interaction (security feature kept from legacy). Returns minutes left, refreshed every 15 s. */
export function useInactivityLock(onLock: () => void) {
  const lastActive = useRef(Date.now());
  const [remainingMinutes, setRemainingMinutes] = useState(10);
  const lockRef = useRef(onLock);
  lockRef.current = onLock;

  useEffect(() => {
    const touch = () => {
      lastActive.current = Date.now();
    };
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActive.current;
      setRemainingMinutes(Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 60000)));
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(interval);
        console.warn('[SECURITY] 10-minute inactivity threshold reached. Auto-locking admin session.');
        lockRef.current();
      }
    }, 15000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(interval);
    };
  }, []);

  return remainingMinutes;
}
