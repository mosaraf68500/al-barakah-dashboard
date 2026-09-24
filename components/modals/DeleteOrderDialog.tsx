'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { getCustomerAddress, getCustomerName, getCustomerPhone, getCustomerZip, getOrderTotal, getPaymentMethod, getShippingZone } from '@/lib/domain/orderAccessors';
import { getOrderStatus } from '@/lib/domain/orderStatus';
import type { Order } from '@/types';

export function DeleteOrderDialog({ order, onCancel, onConfirm }: { order: Order; onCancel: () => void; onConfirm: () => void }) {


  return (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-stone-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900 font-serif">
                  অর্ডার ডিলিট নিশ্চিতকরণ
                </h3>
                <p className="text-xs text-stone-500">Delete Order Confirmation</p>
              </div>
            </div>

            {/* Order Snapshot Box */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                <span className="font-mono font-bold text-stone-900">
                  #{order.id.slice(-6).toUpperCase()}
                </span>
                <span className="text-stone-500 text-[11px]">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">কাস্টমার নাম:</span>
                <span className="font-bold text-stone-900">{getCustomerName(order)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">মোবাইল নম্বর:</span>
                <span className="font-mono font-semibold text-stone-800">{getCustomerPhone(order)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">মোট বিল (Total):</span>
                <span className="font-bold text-[#0a5c36]">৳{Math.round(getOrderTotal(order)).toLocaleString()}</span>
              </div>
              {order.items && order.items.length > 0 && (
                <div className="pt-1 text-[11px] text-stone-500 truncate">
                  আইটেম: {order.items.map(it => `${it.product?.name || it.name || it.productNameSnapshot || 'Item'} (${it.quantity})`).join(', ')}
                </div>
              )}
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-800 leading-relaxed font-medium">
              ⚠️ আপনি কি নিশ্চিতভাবে এই অর্ডারটি মুছে ফেলতে চান? এটি ফায়ারবেস ক্লাউড ডাটাবেজ থেকে স্থায়ীভাবে রিমুভ হয়ে যাবে।
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
