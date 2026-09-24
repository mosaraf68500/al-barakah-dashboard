'use client';

import { Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { saveSettings } from '@/lib/api';
import { qk, useInvalidate, useSettings } from '@/hooks/useAdminData';
import { useToast } from '@/providers/ToastProvider';
import type { CouponItem } from '@/types';

export function CouponsTab() {
  const showToast = useToast();
  const invalidate = useInvalidate();
  const { data: settings } = useSettings();
  const enableCoupons = settings?.enableCoupons ?? false;
  const coupons: CouponItem[] = settings?.coupons ?? [];
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(10);
  const [newCouponMin, setNewCouponMin] = useState(1000);

  const persist = async (next: CouponItem[]) => {
    await saveSettings({ coupons: next });
    await invalidate(qk.settings);
  };

  const onToggleEnableCoupons = async (enabled: boolean) => {
    await saveSettings({ enableCoupons: enabled });
    await invalidate(qk.settings);
    showToast(enabled ? '✅ কুপন সিস্টেম চালু করা হয়েছে' : '🚫 কুপন সিস্টেম বন্ধ করা হয়েছে');
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const codeClean = newCouponCode.trim().toUpperCase().replace(/\s+/g, '');
    if (coupons.some((c) => c.code === codeClean)) {
      alert('এই কুপন কোডটি ইতিমধ্যে তালিকায় বিদ্যমান রয়েছে!');
      return;
    }
    const newC: CouponItem = { id: `c-${Date.now()}`, code: codeClean, discountPercent: Number(newCouponDiscount), minSpend: Number(newCouponMin), status: 'active', usageCount: 0 };
    try {
      await persist([newC, ...coupons]);
      setNewCouponCode('');
      showToast('✅ নতুন কুপন ডাটাবেজে যুক্ত হয়েছে!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save the coupon.');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    await persist(coupons.filter((item) => item.id !== id));
    showToast('🗑️ কুপন মুছে ফেলা হয়েছে');
  };

  return (
          <div className="p-6 sm:p-8 space-y-6 w-full">
            {/* Master Coupon Enable / Disable Switch */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${enableCoupons ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-stone-900 font-serif">কুপন ও ডিসকাউন্ট সিস্টেম (Coupon Promo Discount)</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${enableCoupons ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {enableCoupons ? 'Active (চালু)' : 'Disabled (বন্ধ)'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                    {enableCoupons 
                      ? '🟢 কুপন অপশন বর্তমানে ওয়েবসাইটে চালু রয়েছে। কাস্টমাররা নিচে তৈরি করা কুপন কোড ব্যবহার করে চেকআউট ও কার্টে নির্ধারিত ডিসকাউন্ট নিতে পারবে।'
                      : '🔴 কুপন অপশন বর্তমানে সম্পূর্ণ বন্ধ রয়েছে। কাস্টমাররা ওয়েবসাইটে কোনো কুপন অপশন দেখতে পাবে না এবং কোনো কোড দিয়ে ডিসকাউন্ট নিতে পারবে না।'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (onToggleEnableCoupons) {
                      onToggleEnableCoupons(!enableCoupons);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-2 shadow-xs ${
                    enableCoupons
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{enableCoupons ? 'কুপন সিস্টেম বন্ধ করুন (Turn OFF)' : 'কুপন সিস্টেম চালু করুন (Turn ON)'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs h-fit">
                <h3 className="text-sm font-bold text-stone-900 font-serif mb-4">নতুন ডিসকাউন্ট কুপন তৈরি করুন</h3>
                <form onSubmit={handleAddCoupon} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-stone-700">Coupon Code (কুপন কোড)</label>
                    <input
                      type="text"
                      placeholder="e.g. EIDSPECIAL, SUMMER20"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold uppercase focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700">Discount Percentage (% ডিসকাউন্ট)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newCouponDiscount}
                      onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700">Min Spend (সর্বনিম্ন অর্ডার মূল্য ৳)</label>
                    <input
                      type="number"
                      value={newCouponMin}
                      onChange={(e) => setNewCouponMin(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    + কুপন কোড যোগ করুন
                  </button>
                </form>
              </div>

              {/* Coupon List */}
              <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-stone-900 font-serif">সক্রিয় কুপন কোড তালিকা ({coupons.length})</h3>
                </div>

                {coupons.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200 space-y-2">
                    <Tag className="w-8 h-8 text-stone-300 mx-auto" />
                    <p className="text-xs font-semibold text-stone-600">কোনো সক্রিয় কুপন কোড নেই</p>
                    <p className="text-[11px] text-stone-400">নতুন কুপন যোগ করতে বামপাশের ফর্ম পূরণ করুন। কাস্টমাররা শুধুমাত্র আপনার অনুমোদিত কুপন ব্যবহার করতে পারবে।</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {coupons.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-emerald-200 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-stone-900 tracking-wider font-mono bg-white px-2.5 py-0.5 rounded border border-stone-200">{c.code}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {c.discountPercent}% OFF
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
                              {c.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-1.5">
                            সর্বনিম্ন অর্ডার: ৳{c.minSpend} | ব্যবহূত: {c.usageCount} বার
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`আপনি কি "${c.code}" কুপনটি ডিলিট করতে চান?`)) {
                              handleDeleteCoupon(c.id);
                            }
                          }}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
  );
}
