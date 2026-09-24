'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export type ToastKind = 'success' | 'error';

const ToastContext = createContext<((msg: string, kind?: ToastKind) => void) | undefined>(undefined);

function inferKind(msg: string): ToastKind {
  if (msg.includes('✅')) return 'success';
  if (/ব্যর্থ|ত্রুটি|ভুল|মেয়াদ শেষ|Failed|could not|invalid/i.test(msg)) return 'error';
  return 'success';
}

/** Bottom-right toast. Errors stay longer and use a red mark so the reason is obvious. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; kind: ToastKind } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, kind?: ToastKind) => {
    const next = kind ?? inferKind(msg);
    setToast({ msg, kind: next });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), next === 'error' ? 5200 : 3000);
  }, []);

  const isError = toast?.kind === 'error';

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[80] max-w-sm text-white px-5 py-3 rounded-2xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-300 ${
            isError ? 'bg-rose-950 border border-rose-700' : 'bg-stone-900 border border-stone-700'
          }`}
        >
          {isError ? (
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <span className="text-xs font-bold leading-relaxed">{toast.msg}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
