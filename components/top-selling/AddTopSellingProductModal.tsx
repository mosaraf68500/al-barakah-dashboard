'use client';

import { Check, Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SafeImage } from '@/components/shared/SafeImage';
import type { Product } from '@/types';

export function AddTopSellingProductModal({
  products,
  alreadyAddedIds,
  onClose,
  onAdd,
}: {
  products: Product[];
  alreadyAddedIds: Set<string>;
  onClose: () => void;
  onAdd: (product: Product) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => p.inStock !== false);
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q),
    );
  }, [products, search]);

  const selected = filtered.find((p) => p.id === selectedId) || products.find((p) => p.id === selectedId) || null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-top-selling-title"
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between gap-3 p-5 border-b border-stone-200 shrink-0">
          <div>
            <h3 id="add-top-selling-title" className="font-bold text-base text-stone-900 font-serif">
              টপ সেলিং-এ প্রোডাক্ট যোগ করুন
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">স্টোরের প্রোডাক্ট থেকে বেছে নিয়ে Add করুন</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-stone-100 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="প্রোডাক্ট খুঁজুন (নাম / ক্যাটাগরি)..."
              autoFocus
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0a5c36]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[240px]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-500">
              {products.length === 0 ? 'কোনো প্রোডাক্ট পাওয়া যায়নি। আগে Products থেকে প্রোডাক্ট যোগ করুন।' : 'কোনো মিল পাওয়া যায়নি।'}
            </div>
          ) : (
            filtered.map((p) => {
              const already = alreadyAddedIds.has(p.id);
              const isSelected = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#0a5c36] bg-emerald-50 ring-1 ring-[#0a5c36]'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <SafeImage
                    src={p.image || p.images?.[0] || ''}
                    alt={p.name}
                    className="w-14 h-14 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-stone-900 line-clamp-2">{p.name}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5 truncate">
                      {p.category}
                      {p.weight ? ` • ${p.weight}` : ''}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-800 mt-1">
                      ৳{Math.round(p.price).toLocaleString()}
                      {p.originalPrice && p.originalPrice > p.price ? (
                        <span className="ml-1.5 text-stone-400 line-through font-medium">৳{Math.round(p.originalPrice).toLocaleString()}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {already ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Already added
                      </span>
                    ) : null}
                    {isSelected ? (
                      <span className="w-6 h-6 rounded-full bg-[#0a5c36] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full border-2 border-stone-200" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 shrink-0 bg-stone-50 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              onAdd(selected);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Top Selling</span>
          </button>
        </div>
      </div>
    </div>
  );
}
