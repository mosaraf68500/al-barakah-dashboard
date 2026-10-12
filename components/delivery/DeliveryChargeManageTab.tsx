'use client';

import { Check, Truck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { saveSettings } from '@/lib/api';
import { qk, useInvalidate, useSettings } from '@/hooks/useAdminData';
import { useToast } from '@/providers/ToastProvider';
import { DEFAULT_DELIVERY_CONFIG } from '@/types';

/**
 * Dedicated admin page: inside/outside Dhaka charges + which checkout payment methods are visible.
 * Saves only the fields edited here (deep-merge on API) so other delivery settings stay untouched.
 */
export function DeliveryChargeManageTab() {
  const showToast = useToast();
  const invalidate = useInvalidate();
  const { data: settings } = useSettings();
  const d = settings?.deliveryConfig ?? DEFAULT_DELIVERY_CONFIG;

  const [insideDhaka, setInsideDhaka] = useState(d.insideDhakaCharge ?? 80);
  const [outsideDhaka, setOutsideDhaka] = useState(d.outsideDhakaCharge ?? 160);
  const [enableAdvance, setEnableAdvance] = useState(d.enableAdvanceDeliveryPayment !== false);
  const [enableFullBkash, setEnableFullBkash] = useState(d.enableFullBkashPayment !== false);
  const [enableFullCod, setEnableFullCod] = useState(d.enableFullCodPayment !== false);
  const [saving, setSaving] = useState(false);

  const hydrated = useRef(false);
  useEffect(() => {
    if (!settings || hydrated.current) return;
    hydrated.current = true;
    const cfg = settings.deliveryConfig;
    setInsideDhaka(cfg.insideDhakaCharge ?? 80);
    setOutsideDhaka(cfg.outsideDhakaCharge ?? 160);
    setEnableAdvance(cfg.enableAdvanceDeliveryPayment !== false);
    setEnableFullBkash(cfg.enableFullBkashPayment !== false);
    setEnableFullCod(cfg.enableFullCodPayment !== false);
  }, [settings]);

  const handleSave = async () => {
    if (!enableAdvance && !enableFullBkash && !enableFullCod) {
      showToast('কমপক্ষে একটি পেমেন্ট পদ্ধতি চালু রাখুন।', 'error');
      return;
    }
    setSaving(true);
    try {
      await saveSettings({
        deliveryConfig: {
          ...d,
          insideDhakaCharge: Number(insideDhaka) || 0,
          outsideDhakaCharge: Number(outsideDhaka) || 0,
          enableAdvanceDeliveryPayment: enableAdvance,
          enableFullBkashPayment: enableFullBkash,
          enableFullCodPayment: enableFullCod,
        },
      });
      await invalidate(qk.settings);
      showToast('✅ ডেলিভারি চার্জ ও পেমেন্ট অপশন সেভ হয়েছে!');
    } catch {
      showToast('সেভ হয়নি। আবার চেষ্টা করুন।', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 w-full">
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-800">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 font-serif">Delivery Charge Manage</h3>
            <p className="text-xs text-stone-500 mt-1">
              Checkout-এর ডেলিভারি চার্জ ও কোন পেমেন্ট পদ্ধতি দেখাবে — এখান থেকে কন্ট্রোল করুন।
            </p>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4 shadow-xs w-full">
        <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">ডেলিভারি চার্জ (৳)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-stone-700">ঢাকার ভিতরে (Inside Dhaka)</span>
            <input
              type="number"
              min={0}
              value={insideDhaka}
              onChange={(e) => setInsideDhaka(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm font-bold focus:outline-none focus:border-emerald-600"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-stone-700">ঢাকার বাইরে (Outside Dhaka)</span>
            <input
              type="number"
              min={0}
              value={outsideDhaka}
              onChange={(e) => setOutsideDhaka(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm font-bold focus:outline-none focus:border-emerald-600"
            />
          </label>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-3 shadow-xs w-full">
        <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">পেমেন্ট পদ্ধতি (Checkout-এ দেখাবে)</h3>
        <p className="text-[11px] text-stone-500">টিক থাকলে storefront checkout-এ দেখাবে; টিক না থাকলে লুকাবে।</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PaymentToggle
            checked={enableAdvance}
            onChange={setEnableAdvance}
            title="ক্যাশ অন ডেলিভারি (অগ্রিম ডেলিভারি চার্জ)"
            badge="সুপারিশকৃত"
            badgeClass="bg-[#0a5c36] text-white"
          />
          <PaymentToggle
            checked={enableFullBkash}
            onChange={setEnableFullBkash}
            title="সম্পূর্ণ পেমেন্ট বিকাশ (Full bKash Payment)"
            badge="ফুল পেইড"
            badgeClass="bg-pink-100 text-[#e2136e] border border-pink-200"
          />
          <PaymentToggle
            checked={enableFullCod}
            onChange={setEnableFullCod}
            title="সম্পূর্ণ ক্যাশ অন ডেলিভারি (Full COD)"
          />
        </div>
      </section>

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0a5c36] hover:bg-[#084a2b] text-white text-sm font-bold disabled:opacity-60 cursor-pointer"
      >
        <Check className="w-4 h-4" />
        {saving ? 'সেভ হচ্ছে…' : 'সেভ করুন'}
      </button>
    </div>
  );
}

function PaymentToggle({
  checked,
  onChange,
  title,
  badge,
  badgeClass,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  badge?: string;
  badgeClass?: string;
}) {
  return (
    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer h-full">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-bold text-stone-900">{title}</span>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeClass ?? ''}`}>{badge}</span>
          )}
        </span>
      </span>
    </label>
  );
}
