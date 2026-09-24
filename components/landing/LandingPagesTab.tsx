'use client';

import { ArrowRight, Edit3, Eye, Globe, Radio, Search, Sparkles } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import { useState } from 'react';
import { saveSettings, updateProduct } from '@/lib/api';
import { qk, useInvalidate, useProducts, useSettings } from '@/hooks/useAdminData';
import { useToast } from '@/providers/ToastProvider';
import { DEFAULT_FACEBOOK_PIXEL_CONFIG } from '@/types';
import type { Product, ProductLandingPageConfig } from '@/types';
import { FacebookPixelSettingsModal } from '@/components/settings/FacebookPixelSettingsModal';
import { LandingPageAdminModal } from './LandingPageAdminModal';

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';

export function LandingPagesTab() {
  const showToast = useToast();
  const invalidate = useInvalidate();
  const { data: products = [] } = useProducts();
  const { data: settings } = useSettings();
  const facebookPixelConfig = settings?.facebookPixelConfig ?? DEFAULT_FACEBOOK_PIXEL_CONFIG;
  const [landingPageSearch, setLandingPageSearch] = useState('');
  const [isPixelModalOpen, setIsPixelModalOpen] = useState(false);
  const [landingProduct, setLandingProduct] = useState<Product | null>(null);

  const handleOpenLandingCustomizer = (p: Product) => setLandingProduct(p);
  // Preview opens the storefront's ordinary product page in a new tab - the storefront has no landing-page renderer (Phase 1 Q9 / KNOWN_LIMITATIONS.md).
  const onPreviewLandingPage = (p: Product) => window.open(`${STOREFRONT_URL}/product/${encodeURIComponent(p.slug || p.id)}`, '_blank');

  const handleSaveLandingPageConfig = async (productId: string, config: ProductLandingPageConfig) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    await updateProduct({ ...target, landingPage: config });
    await invalidate(qk.products);
    showToast('✅ ল্যান্ডিং পেজ ও ফেসবুক অ্যাড সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
  };

  return (
<>
          <div className="p-6 sm:p-8 space-y-6 w-full">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-stone-900 via-[#0a5c36] to-stone-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Facebook Ads & Direct Conversion Engine</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-100">
                    উচ্চ রূপান্তরযোগ্য (High-Converting) সেলস ল্যান্ডিং পেজ
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                    ফেসবুক অ্যাড ট্রাফিকের জন্য সরাসরি সিঙ্গেল-প্রোডাক্ট সেলস পেজ। এখানে কাস্টমার বিভ্রান্ত না হয়ে সরাসরি ভিডিও/ছবি দেখে, অফার প্যাকেজ সিলেক্ট করে ১-ক্লিকে ক্যাশ অন ডেলিভারিতে অর্ডার দিতে পারে।
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPixelModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Radio className="w-4 h-4 text-blue-200 animate-pulse" />
                    <span>Facebook Pixel & CAPI সেটিংস</span>
                    {facebookPixelConfig.pixelId ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-stone-900 text-[10px] font-black">সেট করুন</span>
                    )}
                  </button>

                  {products.find((p) => p.name.includes('Mustard') || p.name.includes('সরিষা')) && (
                    <button
                      type="button"
                      onClick={() => {
                        const mustardProd = products.find((p) => p.name.includes('Mustard') || p.name.includes('সরিষা'));
                        if (mustardProd && onPreviewLandingPage) {
                          onPreviewLandingPage(mustardProd);
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4 text-stone-900" />
                      <span>সরিষার তেল ল্যান্ডিং পেজ লাইভ দেখুন</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-stone-300 font-medium">সক্রিয় ল্যান্ডিং পেজ</div>
                  <div className="text-lg font-black text-amber-300 mt-1">
                    {products.filter((p) => p.landingPage?.enabled).length} টি প্রোডাক্ট
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-stone-300 font-medium">Facebook Pixel</div>
                  <div className="text-lg font-black text-emerald-300 mt-1 flex items-center gap-1.5">
                    {facebookPixelConfig.pixelId ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="truncate">{facebookPixelConfig.pixelId}</span>
                      </>
                    ) : (
                      <span className="text-amber-300 text-xs">বসানো হয়নি (সেট করুন)</span>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-stone-300 font-medium">Domain Verification</div>
                  <div className="text-lg font-black text-white mt-1 flex items-center gap-1.5">
                    {facebookPixelConfig.domainVerificationCode ? (
                      <span className="text-emerald-300 text-xs font-bold">✅ ভেরিফায়েড / সক্রিয়</span>
                    ) : (
                      <span className="text-stone-300 text-xs">albarakahpremium.com</span>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-stone-300 font-medium">অর্ডার ও ট্র্যাকিং</div>
                  <div className="text-lg font-black text-amber-300 mt-1">
                    ১-ক্লিক COD + CAPI
                  </div>
                </div>
              </div>
            </div>

            {/* Facebook Pixel & Domain Verification Quick Action Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Pixel & CAPI */}
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-900">Facebook Pixel & Conversions API (CAPI)</div>
                      <div className="text-xs text-stone-500">
                        {facebookPixelConfig.pixelId ? `পিক্সেল ID: ${facebookPixelConfig.pixelId} (সক্রিয়)` : 'পিক্সেল আইডি সেট করা হয়নি'}
                      </div>
                    </div>
                  </div>
                  {facebookPixelConfig.pixelId ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      সক্রিয়
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                      সেট করা প্রয়োজন
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  PageView, ViewContent, AddToCart, InitiateCheckout এবং Purchase ইভেন্ট স্বয়ংক্রিয়ভাবে ট্র্যাকিং করে মেটা অ্যাডসে রিপোর্ট পাঠায়।
                </p>
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-mono">
                    CAPI: {facebookPixelConfig.enableCapi ? 'এনাবল্ড' : 'অফ'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPixelModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>পিক্সেল কনফিগার ও টেস্ট করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Domain Verification */}
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-900">Facebook Domain Verification</div>
                      <div className="text-xs text-stone-500">albarakahpremium.com (কাস্টম ডোমেইন)</div>
                    </div>
                  </div>
                  {facebookPixelConfig.domainVerificationCode ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      মেটা ট্যাগ যুক্ত
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-bold text-[11px]">
                      কনফিগার করুন
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  মেটা বিজনেস ম্যানেজারে ডোমেইন ভেরিফাই করার জন্য মেটা-ট্যাগ কোড বা DNS TXT রেকর্ড নির্দেশনা পেয়ে যাবেন।
                </p>
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-mono">
                    DNS / Meta-tag Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPixelModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>ডোমেইন ভেরিফিকেশন সেট করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="ল্যান্ডিং পেজ বা প্রোডাক্ট খুঁজুন..."
                  value={landingPageSearch}
                  onChange={(e) => setLandingPageSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="text-xs text-stone-500 font-medium">
                টিপস: ফেসবুক অ্যাডে যে প্রোডাক্টের ক্যাম্পেইন চালাবেন সেটির অ্যাড লিংক কপি করে অ্যাডের Website URL এ পেস্ট করুন।
              </div>
            </div>

            {/* Products with Landing Page Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-5 py-3.5">প্রোডাক্ট ও ক্যাটাগরি</th>
                      <th className="px-5 py-3.5">ল্যান্ডিং পেজ স্ট্যাটাস</th>
                      <th className="px-5 py-3.5">হেডলাইন ও অফার প্যাকেজ</th>
                      <th className="px-5 py-3.5">ফেসবুক অ্যাড ডেস্টিনেশন লিংক</th>
                      <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {products
                      .filter((p) => {
                        if (!landingPageSearch) return true;
                        const q = landingPageSearch.toLowerCase();
                        return (
                          p.name.toLowerCase().includes(q) ||
                          p.category.toLowerCase().includes(q) ||
                          (p.landingPage?.headline && p.landingPage.headline.toLowerCase().includes(q))
                        );
                      })
                      .map((product) => {
                        const isEnabled = Boolean(product.landingPage?.enabled);
                        const adUrl = `${STOREFRONT_URL}/product/${encodeURIComponent(product.slug || product.id)}`;

                        return (
                          <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <SafeImage
                                  src={product.images[0] || 'https://via.placeholder.com/60'}
                                  alt={product.name}
                                  className="w-11 h-11 rounded-lg object-cover border border-stone-200"
                                />
                                <div>
                                  <div className="font-bold text-stone-900 line-clamp-1">{product.name}</div>
                                  <div className="text-[11px] text-stone-400">{product.category} • ৳{product.price}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-3.5">
                              {isEnabled ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                  লাইভ সক্রিয়
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200 text-[11px]">
                                  তৈরি করা হয়নি
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-3.5 max-w-xs">
                              {product.landingPage?.headline ? (
                                <div className="space-y-1">
                                  <div className="font-serif font-bold text-stone-800 line-clamp-1">
                                    {product.landingPage.headline}
                                  </div>
                                  <div className="text-[11px] text-stone-500 flex flex-wrap gap-1">
                                    {product.landingPage.variants?.map((v, i) => (
                                      <span key={i} className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px]">
                                        {v.label}: ৳{v.price}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-stone-400 italic">ডিফল্ট টেমপ্লেট প্রযোজ্য</span>
                              )}
                            </td>

                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <code className="px-2 py-1 rounded bg-stone-100 text-[11px] text-stone-700 font-mono select-all truncate max-w-[180px]">
                                  ?landing={product.id}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(adUrl);
                                    showToast(`অ্যাড লিংক কপি হয়েছে: ${adUrl}`);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Copy Full URL"
                                >
                                  কপি
                                </button>
                              </div>
                            </td>

                            <td className="px-5 py-3.5 text-right space-x-2">
                              {/* Preview Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (onPreviewLandingPage) {
                                    onPreviewLandingPage(product);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs cursor-pointer transition-colors inline-flex items-center gap-1.5"
                                title="Live Preview Landing Page"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-700" />
                                <span>প্রিভিউ</span>
                              </button>

                              {/* Customize Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenLandingCustomizer(product)}
                                className="px-3 py-1.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white font-bold text-xs cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-xs"
                                title="Edit Landing Page Content, Pricing & Video"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>কাস্টমাইজ</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Facebook Ads Readiness & Campaign Strategy Guide */}
            <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>ফেসবুক অ্যাড ক্যাম্পেইন শুরু করার জন্য চূড়ান্ত চেকলিস্ট (Facebook Ads Checklist)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-700">
                <div className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-2xs space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">১</span>
                    <span>হুক ও আসল সরিষার তেলের বিশ্বাস</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    অ্যাডের ভিডিওতে ঘানিভাঙা তেল পড়ার দৃশ্য ও খাঁটি ঝাঁঝের নিশ্চয়তা হাইলাইট করুন। ল্যান্ডিং পেজে ইতিমধ্যে '১০০% খাঁটি ও টেস্টেড' ব্যাজ সেট করা আছে।
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-2xs space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">২</span>
                    <span>অফার প্যাকেজ ও ফ্রি ডেলিভারি</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    ১ লিটার, ২ লিটার এবং ৫ লিটার প্যাকেজের মধ্যে ৫ লিটারে "ফ্রি ডেলিভারি" দিলে এভারেজ অর্ডার ভ্যালু (AOV) দ্বিগুণ হয়ে যায়।
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-2xs space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">৩</span>
                    <span>সরাসরি ক্যাশ অন ডেলিভারি ফর্ম</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    কাস্টমারকে কোনো লগইন বা পাসওয়ার্ড তৈরি করতে হবে না—শুধু নাম, মোবাইল ও ঠিকানা লিখে ১ ক্লিকে অর্ডার প্লেস করতে পারবে।
                  </p>
                </div>
              </div>
            </div>
          </div>
      {landingProduct && (
        <LandingPageAdminModal isOpen onClose={() => setLandingProduct(null)} product={landingProduct} onSaveLandingPage={handleSaveLandingPageConfig} onPreviewLandingPage={onPreviewLandingPage} />
      )}
      {isPixelModalOpen && (
      <FacebookPixelSettingsModal
        isOpen
        onClose={() => setIsPixelModalOpen(false)}
        config={facebookPixelConfig}
        onSaveConfig={async (cfg) => {
          await saveSettings({ facebookPixelConfig: cfg });
          await invalidate(qk.settings);
          showToast('Facebook Pixel & CAPI settings saved successfully!');
        }}
      />
      )}
    </>
  );
}
