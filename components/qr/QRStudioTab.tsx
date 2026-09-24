'use client';

import { QrCode, Sparkles } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import { useState } from 'react';
import { useProducts, useSettings } from '@/hooks/useAdminData';
import type { Product } from '@/types';
import { QRCodeGeneratorModal } from './QRCodeGeneratorModal';

export function QRStudioTab() {
  const { data: products = [] } = useProducts();
  const { data: settings } = useSettings();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalProduct, setQrModalProduct] = useState<Product | null>(null);
  const domain = settings?.seoConfig?.canonicalUrl || 'https://albarakahpremium.com';

  return (
<>
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            <div className="bg-gradient-to-br from-[#03251a] via-[#053828] to-[#0a5c36] text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-amber-400/30">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>আল-বারাকাহ প্রিমিয়াম অফিশিয়াল কিউআর ও স্টিকার স্টুডিও</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-serif tracking-tight text-white">
                  ব্রান্ডিং কিউআর কোড ও প্রোডাক্ট অথেনটিসিটি স্টিকার তৈরি করুন
                </h2>
                <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
                  কাস্টম ডোমেইন <strong className="text-amber-300">albarakahpremium.com</strong> এর সাথে সরিষার তেল ও অন্যান্য পণ্যের বোতলের গায়ের জন্য তৈরি করুন হাই-রেজোলিউশন (1200px) প্রিন্ট-রেডি লেবেল স্টিকার ও কিউআর কোড। গ্রাহক বোতলের কিউআর স্ক্যান করলেই প্রোডাক্টের সত্যতা যাচাই করতে পারবে।
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setQrModalProduct(null);
                      setIsQrModalOpen(true);
                    }}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-stone-950 font-black text-xs sm:text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>লঞ্চ করুন কিউআর ও বোতল স্টিকার জেনারেটর</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Product QR Grid */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base font-serif">
                    পণ্যের জন্য সরাসরি কিউআর ও স্টিকার তৈরি করুন
                  </h3>
                  <p className="text-xs text-stone-500">
                    যেকোনো প্রোডাক্ট সিলেক্ট করে এক ক্লিকে তার নির্দিষ্ট কিউআর কোড বা বোতল স্টিকার ডাউনলোড করুন
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between gap-3 bg-stone-50/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SafeImage
                        src={prod.image || (prod as any).imageUrl}
                        alt={prod.name}
                        className="w-12 h-12 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-stone-900 line-clamp-1">{prod.name}</div>
                        <div className="text-[11px] text-stone-500">{prod.category}</div>
                        <div className="text-[10px] font-mono text-emerald-700">albarakahpremium.com/?verify={prod.id}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setQrModalProduct(prod);
                        setIsQrModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>স্টিকার</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
      <QRCodeGeneratorModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} products={products} defaultProduct={qrModalProduct} customDomain={domain} />
    </>
  );
}
