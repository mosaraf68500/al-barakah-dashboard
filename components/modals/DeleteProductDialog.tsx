'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import type { Product } from '@/types';

export function DeleteProductDialog({ product, onCancel, onConfirm }: { product: Product; onCancel: () => void; onConfirm: () => void }) {


  return (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-stone-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900 font-serif">
                  প্রোডাক্ট ডিলিট নিশ্চিতকরণ
                </h3>
                <p className="text-xs text-stone-500">Delete Product Confirmation</p>
              </div>
            </div>

            {/* Product Snapshot Box */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3">
              <SafeImage
                src={product.image || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=80'}
                alt={product.name}
                className="w-14 h-14 rounded-xl object-cover bg-white border border-stone-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-stone-900 line-clamp-2">
                  {product.name}
                </div>
                <div className="text-[11px] text-emerald-800 font-bold mt-1">
                  ৳{Math.round(product.price).toLocaleString()} • {product.category}
                </div>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-800 leading-relaxed font-medium">
              ⚠️ আপনি কি নিশ্চিতভাবে <strong>"{product.name}"</strong> প্রোডাক্টটি মুছে ফেলতে চান? এটি ফায়ারবেস ক্লাউড ডাটাবেজ থেকে স্থায়ীভাবে রিমুভ হয়ে যাবে এবং রিফ্রেশ দিলেও আর আসবে না।
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>হ্যাঁ, ডিলিট করুন (Delete)</span>
              </button>
            </div>
          </div>
        </div>
  );
}
