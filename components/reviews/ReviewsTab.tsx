'use client';

import { Star, Trash2 } from 'lucide-react';
import { deleteReview, saveSettings } from '@/lib/api';
import { qk, useInvalidate, useReviews, useSettings } from '@/hooks/useAdminData';
import { useToast } from '@/providers/ToastProvider';

export function ReviewsTab() {
  const showToast = useToast();
  const invalidate = useInvalidate();
  const { data: customerReviews = [] } = useReviews();
  const { data: settings } = useSettings();
  const enableCustomerReviews = settings?.enableCustomerReviews ?? true;

  const onToggleCustomerReviews = async (enabled: boolean) => {
    await saveSettings({ enableCustomerReviews: enabled });
    await invalidate(qk.settings);
    showToast(enabled ? '✅ কাস্টমার রিভিউ সিস্টেম চালু করা হয়েছে' : '🚫 কাস্টমার রিভিউ সিস্টেম বন্ধ করা হয়েছে');
  };
  const onDeleteReview = async (id: string) => {
    await deleteReview(id);
    await invalidate(qk.reviews);
    showToast('🗑️ রিভিউ মুছে ফেলা হয়েছে');
  };

  return (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            
            {/* Top ON/OFF Toggle Card */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    Customer Reviews & Rating System (কাস্টমার রিভিউ সিস্টেম)
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    enableCustomerReviews ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {enableCustomerReviews ? 'Enabled / সক্রিয়' : 'Disabled / বন্ধ'}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  {enableCustomerReviews
                    ? 'গ্রাহকরা প্রোডাক্ট পেজে গিয়ে রিভিউ, রেটিং দিতে পারছেন এবং অন্য গ্রাহকদের মতামত দেখতে পাচ্ছেন।'
                    : 'প্রোডাক্ট পেজ থেকে রিভিউ এবং রেটিং সেকশন সাময়িকভাবে হাইড করা রয়েছে।'}
                </p>
              </div>

              {/* Master ON / OFF Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  if (onToggleCustomerReviews) {
                    onToggleCustomerReviews(!enableCustomerReviews);
                  }
                }}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-2 shrink-0 ${
                  enableCustomerReviews
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                }`}
                id="btn-toggle-customer-reviews"
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${enableCustomerReviews ? 'scale-100' : 'scale-75 opacity-70'}`} />
                <span>{enableCustomerReviews ? 'Reviews: ON' : 'Reviews: OFF'}</span>
              </button>
            </div>

            {/* Reviews List */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h4 className="text-sm font-bold text-stone-900 font-serif">
                  All Submitted Product Reviews ({customerReviews.length} টি রিভিউ)
                </h4>
              </div>

              {customerReviews.length > 0 ? (
                <div className="space-y-3">
                  {customerReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-stone-900 text-xs">{rev.customerName}</span>
                          <span className="text-amber-500 text-xs font-bold flex items-center">
                            ★ {rev.rating}/5
                          </span>
                          <span className="text-[11px] font-semibold text-[#0A3828] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {rev.productName || 'Product'}
                          </span>
                          {rev.city && (
                            <span className="text-[10px] text-stone-400">({rev.city})</span>
                          )}
                          <span className="text-[10px] text-stone-400">• {rev.createdAt}</span>
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed italic">
                          "{rev.comment}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {rev.verifiedPurchase && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Verified
                          </span>
                        )}

                        {onDeleteReview && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('এই রিভিউটি মুছে ফেলতে চান?')) onDeleteReview(rev.id);
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Delete this review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-400 text-xs">
                  কোনো রিভিউ পাওয়া যায়নি।
                </div>
              )}
            </div>

          </div>
  );
}
