'use client';

import { Check, Flame, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { saveSettings, uploadImageDataUrl } from '@/lib/api';
import { qk, useInvalidate, useProducts, useSettings } from '@/hooks/useAdminData';
import { compressImageFile } from '@/lib/imageCompressor';
import { normalizeTopSelling } from '@/lib/domain/config';
import { useToast } from '@/providers/ToastProvider';
import type { Product, TopSellingItem, TopSellingSectionConfig } from '@/types';
import { AddTopSellingProductModal } from './AddTopSellingProductModal';

async function withUploadedImages(cfg: TopSellingSectionConfig): Promise<TopSellingSectionConfig> {
  const items = await Promise.all(
    cfg.items.map(async (item) => ({
      ...item,
      // Keep badge in sync with badgeText so the storefront (which may read either) shows the edited label.
      badge: (item.badgeText || item.badge || '').trim() || item.badge,
      image: item.image ? await uploadImageDataUrl(item.image, 'banners') : item.image,
    })),
  );
  return { ...cfg, items };
}

function itemFromProduct(product: Product, order: number): TopSellingItem {
  return {
    id: `top_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    productId: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    badge: 'HOT DEAL',
    badgeText: '🔥 HOT DEAL',
    badgeBgColor: '#e11d48',
    overridePrice: product.price,
    overrideOriginalPrice: product.originalPrice,
    overrideWeight: product.weight || '1 Kg',
    image: product.image || product.images?.[0] || '',
    enabled: true,
    order,
  };
}

export function TopSellingEditor({ embedded = false }: { embedded?: boolean }) {
  const showToast = useToast();
  const invalidate = useInvalidate();
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();
  const { data: settings } = useSettings();
  const [topSellingState, setTopSellingState] = useState<TopSellingSectionConfig>(() => normalizeTopSelling(settings?.topSelling));
  const [isSavingTopSelling, setIsSavingTopSelling] = useState(false);
  const [isTogglingEnabled, setIsTogglingEnabled] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const loaded = useRef(Boolean(settings));
  const topSellingStateRef = useRef(topSellingState);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingLock = useRef(false);
  const pendingSave = useRef(false);

  useEffect(() => {
    topSellingStateRef.current = topSellingState;
  }, [topSellingState]);

  // Adopt the saved config once it arrives (first load only - never clobber unsaved edits on background refetches).
  useEffect(() => {
    if (settings && !loaded.current) {
      loaded.current = true;
      setTopSellingState(normalizeTopSelling(settings.topSelling));
    }
  }, [settings]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const alreadyAddedIds = useMemo(
    () => new Set(topSellingState.items.map((i) => i.productId).filter(Boolean) as string[]),
    [topSellingState.items],
  );

  const handleSaveTopSellingAdmin = useCallback(async (newCfg: TopSellingSectionConfig, opts?: { quiet?: boolean }) => {
    topSellingStateRef.current = newCfg;
    if (savingLock.current) {
      pendingSave.current = true;
      return;
    }
    savingLock.current = true;
    setIsSavingTopSelling(true);
    try {
      do {
        pendingSave.current = false;
        const uploadedCfg = await withUploadedImages(topSellingStateRef.current);
        if (pendingSave.current) continue; // user kept typing while images uploaded
        const saved = await saveSettings({ topSelling: uploadedCfg });
        queryClient.setQueryData(qk.settings, saved);
        if (pendingSave.current) continue;
        if (saved.topSelling) {
          const normalized = normalizeTopSelling(saved.topSelling);
          setTopSellingState(normalized);
          topSellingStateRef.current = normalized;
        }
      } while (pendingSave.current);
      await invalidate(qk.settings);
      if (!opts?.quiet) showToast('✅ টপ সেলিং সেকশন সংরক্ষিত হয়েছে!');
    } catch (err) {
      console.error('Error saving top selling config:', err);
      alert(err instanceof Error ? err.message : 'টপ সেলিং সেভ করার সময় ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      savingLock.current = false;
      setIsSavingTopSelling(false);
    }
  }, [invalidate, queryClient, showToast]);

  /** Debounced persist so title/subtitle/item text edits reach the storefront without relying only on the Save button. */
  const scheduleSave = useCallback((next: TopSellingSectionConfig) => {
    topSellingStateRef.current = next;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void handleSaveTopSellingAdmin(topSellingStateRef.current, { quiet: true });
    }, 700);
  }, [handleSaveTopSellingAdmin]);

  const patchState = (updater: (prev: TopSellingSectionConfig) => TopSellingSectionConfig, persist: 'debounce' | 'now' | 'local' = 'debounce') => {
    setTopSellingState((prev) => {
      const next = updater(prev);
      topSellingStateRef.current = next;
      if (savingLock.current) pendingSave.current = true;
      if (persist === 'debounce') scheduleSave(next);
      else if (persist === 'now') {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        void handleSaveTopSellingAdmin(next, { quiet: true });
      }
      return next;
    });
  };

  const onToggleShowOnHomepage = async (enabled: boolean) => {
    setIsTogglingEnabled(true);
    try {
      // Enabled only. The item draft stays in this component until the next full save.
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

  const patchItem = (idx: number, patch: Partial<TopSellingItem>, persist: 'debounce' | 'now' | 'local' = 'debounce') => {
    patchState((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[idx] = { ...updatedItems[idx], ...patch };
      return { ...prev, items: updatedItems };
    }, persist);
  };

  const addProductToTopSelling = (product: Product) => {
    if (!product.image && !(product.images && product.images[0])) {
      alert('এই প্রোডাক্টের কোনো ছবি নেই। আগে প্রোডাক্টে ছবি যোগ করুন, তারপর আবার চেষ্টা করুন।');
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const newItem = itemFromProduct(product, topSellingStateRef.current.items.length + 1);
    const updated: TopSellingSectionConfig = {
      ...topSellingStateRef.current,
      items: [...topSellingStateRef.current.items, newItem],
    };
    setTopSellingState(updated);
    topSellingStateRef.current = updated;
    setShowAddProductModal(false);
    showToast(`✅ "${product.name}" টপ সেলিং-এ যোগ হয়েছে`);
    void handleSaveTopSellingAdmin(updated, { quiet: true });
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
                    টপ সেলিং সেকশনের টাইটেল, অফার সাবটাইটেল এবং ৪টি ব্যানার ও অফার প্রোডাক্ট এডিট করলেই অটো-সেভ হবে এবং ল্যান্ডিং পেজে দেখাবে।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(true)}
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
                      patchState((prev) => ({ ...prev, title: e.target.value }));
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
                      patchState((prev) => ({ ...prev, subtitle: e.target.value }));
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
                {topSellingState.items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-stone-700">এখনো কোনো টপ সেলিং আইটেম নেই</p>
                    <p className="text-xs text-stone-500 mt-1">Add Item চাপুন এবং স্টোরের প্রোডাক্ট থেকে বেছে নিন</p>
                    <button
                      type="button"
                      onClick={() => setShowAddProductModal(true)}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </button>
                  </div>
                ) : null}
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
                                patchItem(idx, { enabled: e.target.checked }, 'now');
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
                                      patchItem(idx, { image: compressed }, 'debounce');
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
                                patchItem(idx, { image: e.target.value });
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
                                      patchItem(idx, { image: compressed }, 'debounce');
                                    } catch (err) {
                                      console.error('Failed to compress image:', err);
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Link to Real Product (অর্ডার বাটনে পণ্য সিলেক্ট)
                            </label>
                            <select
                              value={item.productId}
                              onChange={(e) => {
                                const selProd = products.find((p) => p.id === e.target.value);
                                if (selProd) {
                                  patchItem(idx, {
                                    productId: selProd.id,
                                    name: selProd.name,
                                    image: selProd.image,
                                    price: selProd.price,
                                    originalPrice: selProd.originalPrice,
                                    overridePrice: selProd.price,
                                    overrideOriginalPrice: selProd.originalPrice,
                                    overrideWeight: selProd.weight || '১ কেজি',
                                  });
                                } else {
                                  patchItem(idx, { productId: e.target.value });
                                }
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
                                patchItem(idx, { name: e.target.value });
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
                              value={item.badgeText || item.badge || ''}
                              placeholder="🔥 HOT DEAL"
                              onChange={(e) => {
                                const val = e.target.value;
                                patchItem(idx, { badgeText: val, badge: val });
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
                                patchItem(idx, { overrideWeight: e.target.value });
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
                                patchItem(idx, { overridePrice: val, price: val });
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
                                patchItem(idx, { overrideOriginalPrice: val, originalPrice: val });
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

            {showAddProductModal && (
              <AddTopSellingProductModal
                products={products}
                alreadyAddedIds={alreadyAddedIds}
                onClose={() => setShowAddProductModal(false)}
                onAdd={addProductToTopSelling}
              />
            )}
          </div>
  );
}
