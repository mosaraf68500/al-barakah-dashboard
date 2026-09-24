'use client';

import { Check, CheckCircle2, Flame, Plus, RotateCcw, Sparkles, Tag, Trash2, Upload } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveSettings } from '@/lib/api';
import { qk, useCategories, useInvalidate, useProducts, useSettings } from '@/hooks/useAdminData';
import { compressDataUrl, compressImageFile } from '@/lib/imageCompressor';
import { normalizeHero, normalizeTopSelling } from '@/lib/domain/config';
import { DEFAULT_HERO_CONFIG } from '@/lib/constants/heroDefaults';
import { useToast } from '@/providers/ToastProvider';
import type { HeroBannerConfig, HeroSlide, PromoCard } from '@/types';
import { TopSellingEditor } from '@/components/top-selling/TopSellingEditor';

export function BannersTab() {
  const router = useRouter();
  const params = useSearchParams();
  const showToast = useToast();
  const invalidate = useInvalidate();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useSettings();
  const [bannerConfigState, setBannerConfigState] = useState<HeroBannerConfig>(() => normalizeHero(settings?.heroBanners));
  const [bannerSavedToast, setBannerSavedToast] = useState(false);
  const topSellingItemCount = normalizeTopSelling(settings?.topSelling).items.length;
  const loaded = useRef(Boolean(settings));

  useEffect(() => {
    if (settings && !loaded.current) {
      loaded.current = true;
      setBannerConfigState(normalizeHero(settings.heroBanners));
    }
  }, [settings]);

  // ?tab=slides|promo|top-selling
  const TAB_BY_PARAM = { slides: 'SLIDES', promo: 'PROMO', 'top-selling': 'TOP_SELLING' } as const;
  const PARAM_BY_TAB = { SLIDES: 'slides', PROMO: 'promo', TOP_SELLING: 'top-selling' } as const;
  const bannerSubTab: 'SLIDES' | 'PROMO' | 'TOP_SELLING' = TAB_BY_PARAM[(params.get('tab') ?? 'slides') as keyof typeof TAB_BY_PARAM] ?? 'SLIDES';
  const setBannerSubTab = (tab: 'SLIDES' | 'PROMO' | 'TOP_SELLING') => router.replace(`/banners?tab=${PARAM_BY_TAB[tab]}`);

  const onUpdateHeroBannerConfig = async (cfg: HeroBannerConfig) => {
    await saveSettings({ heroBanners: cfg });
    await invalidate(qk.settings);
  };

  const handleSaveBanners = async (newCfg: HeroBannerConfig) => {
    setBannerConfigState(newCfg);
    try {
      await onUpdateHeroBannerConfig(newCfg);
      setBannerSavedToast(true);
      setTimeout(() => setBannerSavedToast(false), 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ব্যানার সেভ করা যায়নি।');
    }
  };

  const handleHeroSlideImageUpload = async (slideId: string, file: File) => {
    try {
      const compressed = await compressImageFile(file, 900, 500, 0.70);
      setBannerConfigState((cfg) => ({ ...cfg, slides: cfg.slides.map((s) => (s.id === slideId ? { ...s, image: compressed } : s)) }));
    } catch {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const compressed = await compressDataUrl(e.target.result as string, 900, 500, 0.70);
          setBannerConfigState((cfg) => ({ ...cfg, slides: cfg.slides.map((s) => (s.id === slideId ? { ...s, image: compressed } : s)) }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePromoImageUpload = async (file: File) => {
    try {
      const compressed = await compressImageFile(file, 500, 500, 0.70);
      setBannerConfigState((cfg) => ({ ...cfg, promoCard: { ...cfg.promoCard, image: compressed } }));
    } catch {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const compressed = await compressDataUrl(e.target.result as string, 500, 500, 0.70);
          setBannerConfigState((cfg) => ({ ...cfg, promoCard: { ...cfg.promoCard, image: compressed } }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
          <div className="p-6 sm:p-8 space-y-6 w-full">
            {/* Header & Save Action */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900 font-serif">Hero & Promo Banners (Ghorer Bazar Style)</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                    Interactive Links
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Customize the main 2/3 carousel slider and the right 1/3 promo card. When customers click, they are navigated to the selected page.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset to standard Ghorer Bazar default banners?')) {
                      setBannerConfigState(DEFAULT_HERO_CONFIG);
                      if (onUpdateHeroBannerConfig) onUpdateHeroBannerConfig(DEFAULT_HERO_CONFIG);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveBanners(bannerConfigState)}
                  className="px-5 py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  {bannerSavedToast ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Saved & Live!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Banners</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex flex-wrap border-b border-stone-200 bg-white rounded-t-2xl px-6 pt-2 gap-1">
              <button
                type="button"
                onClick={() => setBannerSubTab('SLIDES')}
                className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                  bannerSubTab === 'SLIDES'
                    ? 'border-[#0a5c36] text-[#0a5c36]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Main Slider Carousel ({bannerConfigState.slides.length} slides)</span>
              </button>

              <button
                type="button"
                onClick={() => setBannerSubTab('PROMO')}
                className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                  bannerSubTab === 'PROMO'
                    ? 'border-[#0a5c36] text-[#0a5c36]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Right Promo Card (1/3 Width)</span>
              </button>

              <button
                type="button"
                onClick={() => setBannerSubTab('TOP_SELLING')}
                className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                  bannerSubTab === 'TOP_SELLING'
                    ? 'border-[#0a5c36] text-[#0a5c36]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-500" />
                <span>🔥 Top Selling Items & Banners ({topSellingItemCount} items)</span>
              </button>
            </div>

            {/* Sub-tab 1: Carousel Slides */}
            {bannerSubTab === 'SLIDES' && (
              <div className="bg-white p-6 rounded-b-2xl border-x border-b border-stone-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">Configure each slider banner & its click destination</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newS: HeroSlide = {
                        id: `slide_${Date.now()}`,
                        badge: 'নতুন অফার',
                        title: 'নতুন ধামাকা অফার ব্যানার',
                        subtitle: 'প্রিমিয়াম কোয়ালিটি পণ্য অর্ডার করুন',
                        ctaText: 'অর্ডার করুন',
                        targetType: 'category',
                        targetValue: categories[0]?.name || 'Organic Foods',
                        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1400&auto=format&fit=crop&q=85',
                        enabled: true
                      };
                      setBannerConfigState({
                        ...bannerConfigState,
                        slides: [newS, ...bannerConfigState.slides]
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Slide</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {bannerConfigState.slides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200/70">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-900 text-white text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-stone-800">{slide.title || 'Slide Title'}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slide.enabled}
                              onChange={(e) => {
                                const updated = bannerConfigState.slides.map((s) =>
                                  s.id === slide.id ? { ...s, enabled: e.target.checked } : s
                                );
                                setBannerConfigState({ ...bannerConfigState, slides: updated });
                              }}
                              className="rounded text-emerald-600"
                            />
                            <span>Active</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              if (bannerConfigState.slides.length <= 1) {
                                alert('At least one slide is required.');
                                return;
                              }
                              const updated = bannerConfigState.slides.filter((s) => s.id !== slide.id);
                              setBannerConfigState({ ...bannerConfigState, slides: updated });
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg cursor-pointer"
                            title="Delete slide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Image & Preview */}
                        <div className="lg:col-span-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-stone-700">Slide Image (ছবি)</label>
                            <label className="flex items-center gap-1 text-[10px] font-bold text-[#f38018] hover:underline cursor-pointer">
                              <Upload className="w-3 h-3" />
                              <span>ছবি আপলোড (Device)</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleHeroSlideImageUpload(slide.id, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <input
                            type="url"
                            value={slide.image}
                            onChange={(e) => {
                              const updated = bannerConfigState.slides.map((s) =>
                                s.id === slide.id ? { ...s, image: e.target.value } : s
                              );
                              setBannerConfigState({ ...bannerConfigState, slides: updated });
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                            placeholder="অথবা Image URL দিন..."
                          />
                          <div className="h-28 rounded-xl overflow-hidden border border-stone-200 bg-stone-200 relative">
                            <SafeImage src={slide.image} alt={slide.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        </div>

                        {/* Text Content */}
                        <div className="lg:col-span-7 space-y-2.5">
                          <div>
                            <label className="text-[11px] font-bold text-stone-700">Headline / Offer Title</label>
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => {
                                const updated = bannerConfigState.slides.map((s) =>
                                  s.id === slide.id ? { ...s, title: e.target.value } : s
                                );
                                setBannerConfigState({ ...bannerConfigState, slides: updated });
                              }}
                              className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none font-bold text-stone-900"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-bold text-stone-700">Badge Text</label>
                              <input
                                type="text"
                                value={slide.badge}
                                onChange={(e) => {
                                  const updated = bannerConfigState.slides.map((s) =>
                                    s.id === slide.id ? { ...s, badge: e.target.value } : s
                                  );
                                  setBannerConfigState({ ...bannerConfigState, slides: updated });
                                }}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-stone-700">Button CTA Text</label>
                              <input
                                type="text"
                                value={slide.ctaText}
                                onChange={(e) => {
                                  const updated = bannerConfigState.slides.map((s) =>
                                    s.id === slide.id ? { ...s, ctaText: e.target.value } : s
                                  );
                                  setBannerConfigState({ ...bannerConfigState, slides: updated });
                                }}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-700">Subtitle / Tagline</label>
                            <input
                              type="text"
                              value={slide.subtitle || ''}
                              onChange={(e) => {
                                const updated = bannerConfigState.slides.map((s) =>
                                  s.id === slide.id ? { ...s, subtitle: e.target.value } : s
                                );
                                setBannerConfigState({ ...bannerConfigState, slides: updated });
                              }}
                              className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                            />
                          </div>

                          {/* Target on Click */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200">
                            <div>
                              <label className="text-[11px] font-bold text-stone-700">When Clicked, Go To:</label>
                              <select
                                value={slide.targetType}
                                onChange={(e) => {
                                  const updated = bannerConfigState.slides.map((s) =>
                                    s.id === slide.id ? { ...s, targetType: e.target.value as any } : s
                                  );
                                  setBannerConfigState({ ...bannerConfigState, slides: updated });
                                }}
                                className="w-full px-2 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none font-semibold"
                              >
                                <option value="category">Category Page</option>
                                <option value="product">Specific Product</option>
                                <option value="all">All Catalog</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-stone-700">Select Target:</label>
                              {slide.targetType === 'category' ? (
                                <select
                                  value={slide.targetValue}
                                  onChange={(e) => {
                                    const updated = bannerConfigState.slides.map((s) =>
                                      s.id === slide.id ? { ...s, targetValue: e.target.value } : s
                                    );
                                    setBannerConfigState({ ...bannerConfigState, slides: updated });
                                  }}
                                  className="w-full px-2 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                                >
                                  {categories.map((c) => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                  ))}
                                </select>
                              ) : slide.targetType === 'product' ? (
                                <select
                                  value={slide.targetValue}
                                  onChange={(e) => {
                                    const updated = bannerConfigState.slides.map((s) =>
                                      s.id === slide.id ? { ...s, targetValue: e.target.value } : s
                                    );
                                    setBannerConfigState({ ...bannerConfigState, slides: updated });
                                  }}
                                  className="w-full px-2 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                                >
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name.substring(0, 28)}...</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-xs text-stone-500 py-1.5">Goes to All Products</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-tab 2: Right Promo Card */}
            {bannerSubTab === 'PROMO' && (
              <div className="bg-white p-6 rounded-b-2xl border-x border-b border-stone-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Right Side Highlight Promo Card</h4>
                    <p className="text-xs text-stone-500">Dedicated card on the right (like Ghorer Bazar honey nuts card)</p>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerConfigState.promoCard.enabled}
                      onChange={(e) => {
                        setBannerConfigState({
                          ...bannerConfigState,
                          promoCard: { ...bannerConfigState.promoCard, enabled: e.target.checked }
                        });
                      }}
                      className="rounded text-emerald-600"
                    />
                    <span>Show Promo Card</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Image & Preview */}
                  <div className="md:col-span-5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-700">Promo Image (ছবি)</label>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-[#f38018] hover:underline cursor-pointer">
                          <Upload className="w-3 h-3" />
                          <span>ছবি আপলোড (Device)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handlePromoImageUpload(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="url"
                        value={bannerConfigState.promoCard.image}
                        onChange={(e) => {
                          setBannerConfigState({
                            ...bannerConfigState,
                            promoCard: { ...bannerConfigState.promoCard, image: e.target.value }
                          });
                        }}
                        className="w-full mt-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                        placeholder="অথবা Image URL লিখুন..."
                      />
                    </div>

                    <div className="h-48 rounded-2xl overflow-hidden border border-stone-200 relative bg-[#FFF7ED]">
                      <SafeImage
                        src={bannerConfigState.promoCard.image}
                        alt={bannerConfigState.promoCard.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-between p-3 text-white">
                        <span className="self-start px-2 py-0.5 rounded-full bg-[#FF6A00] text-[10px] font-bold">
                          {bannerConfigState.promoCard.badge || 'PROMO'}
                        </span>
                        <div>
                          <h5 className="text-sm font-bold">{bannerConfigState.promoCard.title}</h5>
                          <p className="text-[11px] text-stone-200">{bannerConfigState.promoCard.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="md:col-span-7 space-y-3.5">
                    <div>
                      <label className="text-xs font-bold text-stone-700">Offer Title</label>
                      <input
                        type="text"
                        value={bannerConfigState.promoCard.title}
                        onChange={(e) => {
                          setBannerConfigState({
                            ...bannerConfigState,
                            promoCard: { ...bannerConfigState.promoCard, title: e.target.value }
                          });
                        }}
                        placeholder="e.g. এখন হানি নাটসে ১০% ছাড়!"
                        className="w-full mt-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700">Badge Text</label>
                        <input
                          type="text"
                          value={bannerConfigState.promoCard.badge || ''}
                          onChange={(e) => {
                            setBannerConfigState({
                              ...bannerConfigState,
                              promoCard: { ...bannerConfigState.promoCard, badge: e.target.value }
                            });
                          }}
                          className="w-full mt-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-stone-700">Action Text</label>
                        <input
                          type="text"
                          value={bannerConfigState.promoCard.ctaText || ''}
                          onChange={(e) => {
                            setBannerConfigState({
                              ...bannerConfigState,
                              promoCard: { ...bannerConfigState.promoCard, ctaText: e.target.value }
                            });
                          }}
                          className="w-full mt-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700">Subtitle</label>
                      <input
                        type="text"
                        value={bannerConfigState.promoCard.subtitle || ''}
                        onChange={(e) => {
                          setBannerConfigState({
                            ...bannerConfigState,
                            promoCard: { ...bannerConfigState.promoCard, subtitle: e.target.value }
                          });
                        }}
                        className="w-full mt-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                      <div>
                        <label className="text-xs font-bold text-stone-700">When Clicked, Go To:</label>
                        <select
                          value={bannerConfigState.promoCard.targetType}
                          onChange={(e) => {
                            setBannerConfigState({
                              ...bannerConfigState,
                              promoCard: { ...bannerConfigState.promoCard, targetType: e.target.value as any }
                            });
                          }}
                          className="w-full mt-1 px-2.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-none"
                        >
                          <option value="category">Category Page</option>
                          <option value="product">Specific Product</option>
                          <option value="all">All Products</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700">Target Page:</label>
                        {bannerConfigState.promoCard.targetType === 'category' ? (
                          <select
                            value={bannerConfigState.promoCard.targetValue}
                            onChange={(e) => {
                              setBannerConfigState({
                                ...bannerConfigState,
                                promoCard: { ...bannerConfigState.promoCard, targetValue: e.target.value }
                              });
                            }}
                            className="w-full mt-1 px-2.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        ) : bannerConfigState.promoCard.targetType === 'product' ? (
                          <select
                            value={bannerConfigState.promoCard.targetValue}
                            onChange={(e) => {
                              setBannerConfigState({
                                ...bannerConfigState,
                                promoCard: { ...bannerConfigState.promoCard, targetValue: e.target.value }
                              });
                            }}
                            className="w-full mt-1 px-2.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name.substring(0, 28)}...</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-xs text-stone-500 py-2">Catalog (All Items)</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Top Selling Section Items & Banners (same editor as /top-selling) */}
            {bannerSubTab === 'TOP_SELLING' && <TopSellingEditor embedded />}
          </div>
  );
}
