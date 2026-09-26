'use client';

import { Check, Flame, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { saveSettings } from '@/lib/api';
import { qk, useInvalidate, useProducts, useSettings } from '@/hooks/useAdminData';
import { compressImageFile } from '@/lib/imageCompressor';
import { normalizeTopSelling } from '@/lib/domain/config';
import { useToast } from '@/providers/ToastProvider';
import type { TopSellingItem, TopSellingSectionConfig } from '@/types';

export function TopSellingEditor({ embedded = false }: { embedded?: boolean }) {
  const showToast = useToast();
  const invalidate = useInvalidate();
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();
  const { data: settings } = useSettings();
  const [topSellingState, setTopSellingState] = useState<TopSellingSectionConfig>(() => normalizeTopSelling(settings?.topSelling));
  const [isSavingTopSelling, setIsSavingTopSelling] = useState(false);
  const [isTogglingEnabled, setIsTogglingEnabled] = useState(false);
  const loaded = useRef(Boolean(settings));

  // Adopt the saved config once it arrives (first load only - never clobber unsaved edits on background refetches).
  useEffect(() => {
    if (settings && !loaded.current) {
      loaded.current = true;
      setTopSellingState(normalizeTopSelling(settings.topSelling));
    }
  }, [settings]);

  const onToggleShowOnHomepage = async (enabled: boolean) => {
    setIsTogglingEnabled(true);
    try {
      // Enabled only. The item draft stays in this component until Save Top Selling.
      const saved = await saveSettings({ topSelling: { enabled } });
      queryClient.setQueryData(qk.settings, saved);
      setTopSellingState((current) => ({ ...current, enabled: Boolean(saved.topSelling?.enabled) }));
      showToast(saved.topSelling?.enabled ? '✅ টপ সেলিং হোমপেজে দেখানো হচ্ছে' : '🚫 টপ সেলিং হোমপেজ থেকে লুকানো হয়েছে');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'টপ সেলিং সেভ করার সময় ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsTogglingEnabled(false);
    }
  };

  const handleSaveTopSellingAdmin = async (newCfg: TopSellingSectionConfig) => {
    setIsSavingTopSelling(true);
    try {
      setTopSellingState(newCfg);
      await saveSettings({ topSelling: newCfg });
      await invalidate(qk.settings);
      showToast('✅ টপ সেলিং সেকশন সংরক্ষিত হয়েছে!');
    } catch (err) {
      console.error('Error saving top selling config:', err);
      alert('টপ সেলিং সেভ করার সময় ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSavingTopSelling(false);
    }
  };

  return (
          <div className={embedded ? 'space-y-6' : 'p-6 sm:p-8 space-y-6 w-full'}>
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black">
                      <Flame className="w-4 h-4 text-white fill-white" />
                    </span>
                    <h3 className="text-base font-bold text-stone-900 font-serif">
                      Top Selling Products & 4 Banners Manager
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    টপ সেলিং সেকশনের টাইটেল, অফার সাবটাইটেল এবং ৪টি ব্যানার ও অফার প্রোডাক্ট এডিট করে লাইভ সেভ করুন।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newItem: TopSellingItem = {
                        id: `top_${Date.now()}`,
                        productId: products[0]?.id || 'custom',
                        name: products[0]?.name || 'New Top Selling Item',
                        price: products[0]?.price || 850,
                        originalPrice: products[0]?.originalPrice || 1050,
                        badge: 'HOT DEAL',
                        badgeText: '🔥 HOT DEAL',
                        badgeBgColor: '#e11d48',
                        overridePrice: products[0]?.price || 850,
                        overrideOriginalPrice: products[0]?.originalPrice || 1050,
                        overrideWeight: products[0]?.weight || '1 Kg',
                        image: products[0]?.image || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=80',
                        enabled: true,
                        order: topSellingState.items.length + 1,
                      };
                      const updated = {
                        ...topSellingState,
                        items: [...topSellingState.items, newItem]
                      };
                      handleSaveTopSellingAdmin(updated);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSavingTopSelling}
                    onClick={() => handleSaveTopSellingAdmin(topSellingState)}
                    className="px-4 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] disabled:bg-stone-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    {isSavingTopSelling ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Cloud...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Top Selling</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Section Title & Subtitle Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">Section Title (বাংলা/English)</label>
                  <input
                    type="text"
                    value={topSellingState.title}
                    onChange={(e) => {
                      setTopSellingState({ ...topSellingState, title: e.target.value });
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a5c36]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">Subtitle / Offer Note</label>
                  <input
                    type="text"
                    value={topSellingState.subtitle || ''}
                    onChange={(e) => {
                      setTopSellingState({ ...topSellingState, subtitle: e.target.value });
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a5c36]"
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3 sm:pt-6">
                  <label className="text-xs font-bold text-stone-700 cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={topSellingState.enabled}
                      disabled={isTogglingEnabled}
                      onChange={(e) => {
                        void onToggleShowOnHomepage(e.target.checked);
                      }}
                      className="rounded text-[#0a5c36] focus:ring-[#0a5c36] cursor-pointer"
                    />
                    <span>Show on Homepage (হোমপেজে দেখান)</span>
                  </label>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {topSellingState.items.map((item, idx) => {
                  const linkedProduct = products.find((p) => p.id === item.productId);
                  return (
                    <div key={item.id || idx} className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#0a5c36] text-white text-xs font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-stone-900">
                            {item.name || linkedProduct?.name || `Top Selling Banner ${idx + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-stone-600 flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].enabled = e.target.checked;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="rounded text-[#0a5c36] focus:ring-[#0a5c36] cursor-pointer"
                            />
                            <span>Active</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Remove this top selling item?')) {
                                const updatedItems = topSellingState.items.filter((_, i) => i !== idx);
                                const updated = { ...topSellingState, items: updatedItems };
                                handleSaveTopSellingAdmin(updated);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Left: Image Preview, Direct File Upload & URL */}
                        <div className="md:col-span-4 space-y-2">
                          <label className="text-[11px] font-bold text-stone-600 block">
                            Custom Banner / Photo (ছবি আপলোড বা লিংক)
                          </label>
                          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center relative group">
                            <SafeImage
                              src={item.image || linkedProduct?.image}
                              alt={item.name || 'Banner preview'}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain"
                            />
                            {/* Overlay file upload button with auto-compression */}
                            <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-bold">
                              <Upload className="w-5 h-5 mb-1" />
                              <span>ছবি আপলোড করুন</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressed = await compressImageFile(file, 800, 800, 0.8);
                                      const updatedItems = [...topSellingState.items];
                                      updatedItems[idx].image = compressed;
                                      setTopSellingState({ ...topSellingState, items: updatedItems });
                                    } catch (err) {
                                      console.error('Failed to compress image:', err);
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                          
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={item.image || ''}
                              placeholder="Paste direct Image URL or link..."
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].image = e.target.value;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="flex-1 px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a5c36]"
                            />
                            <label className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0" title="Upload from Device">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressed = await compressImageFile(file, 800, 800, 0.8);
                                      const updatedItems = [...topSellingState.items];
                                      updatedItems[idx].image = compressed;
                                      setTopSellingState({ ...topSellingState, items: updatedItems });
                                    } catch (err) {
                                      console.error('Failed to compress image:', err);
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Right: Product linking & metadata overrides */}
                        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Link to Real Product (অর্ডার বাটনে পণ্য সিলেক্ট)
                            </label>
                            <select
                              value={item.productId}
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                const selProd = products.find((p) => p.id === e.target.value);
                                if (selProd) {
                                  updatedItems[idx] = {
                                    ...updatedItems[idx],
                                    productId: selProd.id,
                                    name: selProd.name,
                                    image: selProd.image,
                                    price: selProd.price,
                                    originalPrice: selProd.originalPrice,
                                    overridePrice: selProd.price,
                                    overrideOriginalPrice: selProd.originalPrice,
                                    overrideWeight: selProd.weight || '১ কেজি',
                                  };
                                } else {
                                  updatedItems[idx].productId = e.target.value;
                                }
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Display Title (ঐচ্ছিক নাম)
                            </label>
                            <input
                              type="text"
                              value={item.name || ''}
                              placeholder={linkedProduct?.name || 'Product Title'}
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].name = e.target.value;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Badge Text (যেমন: 🔥 BESTSELLER, 50% OFF)
                            </label>
                            <input
                              type="text"
                              value={item.badgeText || ''}
                              placeholder="🔥 HOT DEAL"
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].badgeText = e.target.value;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Weight / Unit (যেমন: 1 Kg / 500g)
                            </label>
                            <input
                              type="text"
                              value={item.overrideWeight || ''}
                              placeholder="1 Kg"
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].overrideWeight = e.target.value;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Offer Price (বিক্রয় মূল্য ৳)
                            </label>
                            <input
                              type="number"
                              value={item.overridePrice !== undefined && item.overridePrice !== null ? item.overridePrice : (item.price || '')}
                              placeholder={String(linkedProduct?.price || 0)}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].overridePrice = val;
                                updatedItems[idx].price = val;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Regular Price (আগের কাটা মূল্য ৳)
                            </label>
                            <input
                              type="number"
                              value={item.overrideOriginalPrice !== undefined && item.overrideOriginalPrice !== null ? item.overrideOriginalPrice : (item.originalPrice || '')}
                              placeholder={String(linkedProduct?.originalPrice || 0)}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].overrideOriginalPrice = val;
                                updatedItems[idx].originalPrice = val;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
  );
}
