'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Eye, 
  Copy, 
  Check, 
  Save, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Flame, 
  ShieldCheck, 
  Truck,
  PhoneCall,
  Layout,
  Share2,
  FileText,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Product, ProductLandingPageConfig, LandingPageVariant } from '@/types';
import { getCalculatedPrice } from '@/lib/catalog/pricing';

interface LandingPageAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSaveLandingPage: (productId: string, config: ProductLandingPageConfig) => void;
  onPreviewLandingPage: (product: Product) => void;
}

export const LandingPageAdminModal: React.FC<LandingPageAdminModalProps> = ({
  isOpen,
  onClose,
  product,
  onSaveLandingPage,
  onPreviewLandingPage,
}) => {
  if (!isOpen) return null;

  const existingConfig = product.landingPage || {};
  const isOil = (product.name || '').includes('তেল') || (product.name || '').toLowerCase().includes('oil');
  const hasMustardCopy = !isOil && (
    (existingConfig.bannerNote || '').includes('৫ লিটার') || 
    (existingConfig.guaranteeText || '').includes('তেলের ঝাঁঝ') ||
    (existingConfig.variants?.[0]?.label || '').includes('লিটার বোতল')
  );

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [enabled, setEnabled] = useState(existingConfig.enabled ?? true);
  const [headline, setHeadline] = useState(existingConfig.headline || product.name);
  const [subheadline, setSubheadline] = useState(existingConfig.subheadline || product.description);
  const [highlightBadge, setHighlightBadge] = useState(existingConfig.highlightBadge || '🔥 সীমিত সময়ের স্পেশাল অফার - ক্যাশ অন ডেলিভারি');
  const [bannerNote, setBannerNote] = useState(
    (!hasMustardCopy && existingConfig.bannerNote && !existingConfig.bannerNote.includes('৫ লিটার ফ্যামিলি প্যাক'))
      ? existingConfig.bannerNote
      : '🎉 ১০০% আসল ও বিশুদ্ধ প্রিমিয়াম কোয়ালিটি পণ্য • সারা বাংলাদেশে দ্রুত হোম ডেলিভারি!'
  );
  const [customerHelpline, setCustomerHelpline] = useState(existingConfig.customerHelpline || '01316534171');
  const [guaranteeTitle, setGuaranteeTitle] = useState(existingConfig.guaranteeTitle || '১০০% খাঁটি মান ও সন্তুষ্টির নিশ্চয়তা');
  const [guaranteeText, setGuaranteeText] = useState(
    (!hasMustardCopy && existingConfig.guaranteeText && !existingConfig.guaranteeText.includes('তেলের ঝাঁঝ'))
      ? existingConfig.guaranteeText 
      : 'পার্সেল হাতে পেয়ে ডেলিভারি ম্যানের উপস্থিতিতে পণ্য দেখে নিশ্চিত হয়ে তবেই বাকি মূল্য পরিশোধ করবেন। বিন্দুমাত্র অসন্তুষ্টি থাকলে সাথে সাথে হেল্পলাইনে কল করে সমাধান নিতে পারবেন।'
  );

  // Key benefits bullets
  const [keyBenefits, setKeyBenefits] = useState<string[]>(
    (product.features && product.features.length > 0)
      ? product.features
      : (!hasMustardCopy && existingConfig.keyBenefits && existingConfig.keyBenefits.length > 0 && !existingConfig.keyBenefits.some(b => b.includes('ঘানি ভাঙা')))
      ? existingConfig.keyBenefits
      : [
          '১০০% খাঁটি ও সর্বোচ্চ প্রিমিয়াম কোয়ালিটি',
          'সম্পূর্ণ নির্ভেজাল ও স্বাস্থ্যসম্মত উপাদান',
          'নিরাপদ ও আকর্ষণীয় সুরক্ষিত প্যাকেজিং',
          'সারা বাংলাদেশে দ্রুত ও নির্ভরযোগ্য হোম ডেলিভারি'
        ]
  );
  const [newBenefitInput, setNewBenefitInput] = useState('');

  // Variants from sizes or existing config
  const initialVariants: LandingPageVariant[] = (product.sizes && product.sizes.length > 0)
    ? product.sizes.map((s, idx) => {
        const baseVar = product.sizes![0];
        const price = getCalculatedPrice(product.price, baseVar, s);
        const originalPrice = product.originalPrice ? getCalculatedPrice(product.originalPrice, baseVar, s) : undefined;
        return {
          id: `v-${idx + 1}`,
          label: s,
          size: s,
          price,
          originalPrice,
          isPopular: idx === 0,
          freeDelivery: false,
        };
      })
    : (!hasMustardCopy && existingConfig.variants && existingConfig.variants.length > 0)
    ? existingConfig.variants
    : [
        {
          id: 'v-standard',
          label: product.weight || product.name,
          size: product.weight || 'Standard',
          price: product.price,
          originalPrice: product.originalPrice,
          isPopular: true,
          freeDelivery: false,
        }
      ];

  const [variants, setVariants] = useState<LandingPageVariant[]>(initialVariants);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAdCopy, setCopiedAdCopy] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'variants' | 'ad_templates'>('content');

  // The ad link must point at the STOREFRONT (legacy used the admin's own origin because both lived in one SPA).
  const fullAdUrl = `${process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://albarakahpremium.com'}/product/${encodeURIComponent(product.slug || product.id)}`;

  const sampleAdCopy = `🌿 ১০০% আসল ও বিশুদ্ধ ${product.name}!
✨ প্রিমিয়াম কোয়ালিটি — পরিবারের সুস্বাস্থ্যে আপসহীন খাঁটি মান।

✅ সম্পূর্ণ নির্ভেজাল ও স্বাস্থ্যসম্মত।
✅ নিরাপদ ও আকর্ষণীয় প্যাকেজিং।
🚚 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (পণ্য দেখে নেওয়ার সুবিধা)।
📦 ডেলিভারি চার্জ: ঢাকার ভেতরে ৳৮০, ঢাকার বাইরে ৳১৬০।

👉 সরাসরি অর্ডার করতে নিচের লিংকে ক্লিক করুন:
${fullAdUrl}

📞 হেল্পলাইন: ${customerHelpline}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullAdUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyAdCopy = () => {
    navigator.clipboard.writeText(sampleAdCopy);
    setCopiedAdCopy(true);
    setTimeout(() => setCopiedAdCopy(false), 2500);
  };

  const handleAddBenefit = () => {
    if (!newBenefitInput.trim()) return;
    setKeyBenefits([...keyBenefits, newBenefitInput.trim()]);
    setNewBenefitInput('');
  };

  const handleRemoveBenefit = (idx: number) => {
    setKeyBenefits(keyBenefits.filter((_, i) => i !== idx));
  };

  const handleAddVariant = () => {
    const newV: LandingPageVariant = {
      id: `v-${Date.now()}`,
      label: 'নতুন প্যাকেজ সাইজ',
      size: '1 Unit',
      price: 500,
      originalPrice: 600,
      isPopular: false,
      freeDelivery: false,
    };
    setVariants([...variants, newV]);
  };

  const handleUpdateVariant = (index: number, field: keyof LandingPageVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const newConfig: ProductLandingPageConfig = {
      enabled,
      headline: headline.trim(),
      subheadline: subheadline.trim(),
      highlightBadge: highlightBadge.trim(),
      bannerNote: bannerNote.trim(),
      customerHelpline: customerHelpline.trim(),
      guaranteeTitle: guaranteeTitle.trim(),
      guaranteeText: guaranteeText.trim(),
      keyBenefits: keyBenefits.filter(b => Boolean(b && b.trim())),
      variants: variants,
      trustPoints: existingConfig.trustPoints,
      faqs: existingConfig.faqs,
    };

    onSaveLandingPage(product.id, newConfig);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center overflow-hidden ${isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'} animate-in fade-in duration-200`}>
      <div 
        className={`bg-white border border-stone-200 shadow-2xl flex flex-col overflow-hidden text-stone-900 transition-all duration-200 ${
          isFullscreen 
            ? 'w-full h-full rounded-none border-none' 
            : 'w-full max-w-5xl h-[95vh] rounded-2xl sm:rounded-3xl'
        }`}
      >
        
        {/* Header - Fixed & Pinned */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 px-2.5 py-0.5 rounded-full shadow-2xs">
                FACEBOOK ADS STUDIO
              </span>
              <span className="text-xs text-emerald-200 truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
            </div>
            <h2 className="text-base sm:text-xl font-bold truncate text-white">
              ফেসবুক অ্যাড ও সেলস ল্যান্ডিং পেজ কাস্টমাইজার
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isFullscreen ? 'স্বাভাবিক সাইজে ফিরুন' : 'ফুল স্ক্রিন করুন (Fullscreen)'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Top Ad Link Banner - Fixed & Pinned */}
        <div className="bg-emerald-50 border-b border-emerald-200/80 px-4 py-2.5 sm:px-6 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs sm:text-sm shrink-0">
          <div className="flex items-center gap-2 text-emerald-950 font-medium min-w-0 flex-1">
            <Share2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="shrink-0 font-bold text-xs text-emerald-900">অ্যাড লিংক:</span>
            <code className="bg-white px-2.5 py-1 rounded-lg border border-emerald-300 font-mono text-[11px] sm:text-xs text-emerald-800 select-all truncate flex-1 max-w-full">
              {fullAdUrl}
            </code>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              type="button"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'কপি হয়েছে!' : 'লিংক কপি'}</span>
            </button>

            <button
              onClick={() => {
                const tempProd = {
                  ...product,
                  landingPage: {
                    enabled,
                    headline,
                    subheadline,
                    highlightBadge,
                    bannerNote,
                    customerHelpline,
                    guaranteeTitle,
                    guaranteeText,
                    keyBenefits,
                    variants,
                  }
                };
                onPreviewLandingPage(tempProd);
              }}
              type="button"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>লাইভ প্রিভিউ</span>
            </button>
          </div>
        </div>

        {/* Tabs Bar - Fixed & Pinned */}
        <div className="flex border-b border-stone-200 bg-stone-100/70 px-3 sm:px-6 gap-1 sm:gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'content'
                ? 'border-emerald-700 text-emerald-900 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-t-lg'
            }`}
          >
            ১. টেক্সট ও বিবরণ (Content)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'variants'
                ? 'border-emerald-700 text-emerald-900 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-t-lg'
            }`}
          >
            ২. প্যাকেজ ও দাম (Pricing)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ad_templates')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ad_templates'
                ? 'border-emerald-700 text-emerald-900 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-t-lg'
            }`}
          >
            ৩. ফেসবুক অ্যাড কপি (Ad Copy)
          </button>
        </div>

        {/* Tab Body - Dedicated Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          
          {/* TAB 1: CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-5">
              
              {/* Enable toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="space-y-0.5">
                  <span className="font-bold text-stone-900 text-sm">ল্যান্ডিং পেজ স্ট্যাটাস</span>
                  <p className="text-xs text-stone-500">এই প্রোডাক্টের জন্য ডেডিকেটেড সেলস ল্যান্ডিং পেজ চালু রাখুন</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>

              {/* Main Headline */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  মূল শিরোনাম (Landing Page Headline):
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="যেমন: ঐতিহ্যবাহী কাঠের ঘানি ভাঙা ১০০% খাঁটি দেশি সরিষার তেল"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-stone-900 text-sm font-semibold"
                />
              </div>

              {/* Subheadline */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  উপ-শিরোনাম (Subheadline / Hook):
                </label>
                <textarea
                  rows={2}
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="যেমন: তীব্র ঝাঁঝ, প্রাকৃতিক সোনালী রং এবং অতুলনীয় সুবাস — পরিবারের সুস্বাস্থ্যে সেরা পুষ্টির নিশ্চয়তা।"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-stone-900 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Highlight Badge */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    টপ হাইলাইট ব্যাজ (Top Badge):
                  </label>
                  <input
                    type="text"
                    value={highlightBadge}
                    onChange={(e) => setHighlightBadge(e.target.value)}
                    placeholder="🔥 ফেসবুক স্পেশাল অফার - ক্যাশ অন ডেলিভারি"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-stone-900 text-sm"
                  />
                </div>

                {/* Helpline Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    কাস্টমার হেল্পলাইন নম্বর:
                  </label>
                  <input
                    type="text"
                    value={customerHelpline}
                    onChange={(e) => setCustomerHelpline(e.target.value)}
                    placeholder="01712-345678"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-stone-900 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Special Offer / Free Delivery Banner Note */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  টপ অফার স্ট্রিপ বার্তা (Top Announcement Bar):
                </label>
                <input
                  type="text"
                  value={bannerNote}
                  onChange={(e) => setBannerNote(e.target.value)}
                  placeholder="🎉 আজকের বিশেষ অফার: ৫ লিটার ফ্যামিলি প্যাক নিলে ডেলিভারি সম্পূর্ণ ফ্রি!"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-stone-900 text-sm"
                />
              </div>

              {/* Key Benefits Bullet Points */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  পণ্যের বিশেষ গুণাবলী ও উপকারিতা (Key Benefits):
                </label>
                
                <div className="space-y-2">
                  {keyBenefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => {
                          const updated = [...keyBenefits];
                          updated[idx] = e.target.value;
                          setKeyBenefits(updated);
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newBenefitInput}
                    onChange={(e) => setNewBenefitInput(e.target.value)}
                    placeholder="নতুন উপকারিতা পয়েন্ট লিখুন..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBenefit();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-sm border border-stone-300 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>যোগ করুন</span>
                  </button>
                </div>
              </div>

              {/* Guarantee Section */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  মানিব্যাক ও রিটার্ন গ্যারান্টি লেখা:
                </label>
                <input
                  type="text"
                  value={guaranteeTitle}
                  onChange={(e) => setGuaranteeTitle(e.target.value)}
                  placeholder="১০০% খাঁটি মানের নিশ্চয়তা ও সহজ রিটার্ন গ্যারান্টি"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 text-stone-900 text-sm font-semibold"
                />
                <textarea
                  rows={2}
                  value={guaranteeText}
                  onChange={(e) => setGuaranteeText(e.target.value)}
                  placeholder="ডেলিভারি ম্যান থাকা অবস্থায় বোতলের মুখ সামান্য খুলে তেলের ঝাঁঝ, ঘনত্ব ও সুবাস নিজে পরীক্ষা করুন..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 text-stone-900 text-sm"
                />
              </div>

            </div>
          )}

          {/* TAB 2: VARIANTS & PRICING */}
          {activeTab === 'variants' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">প্যাকেজ ও ভ্যারিয়েন্ট তালিকা</h3>
                  <p className="text-xs text-stone-500">ল্যান্ডিং পেজে কাস্টমার যে সাইজগুলো সিলেক্ট করে অর্ডার করতে পারবে</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>প্যাকেজ যোগ করুন</span>
                </button>
              </div>

              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <div key={v.id || idx} className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      
                      {/* Label & Size */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[11px] font-bold text-stone-600 block">প্যাকেজের নাম:</label>
                        <input
                          type="text"
                          value={v.label}
                          onChange={(e) => handleUpdateVariant(idx, 'label', e.target.value)}
                          placeholder="যেমন: ১ লিটার বোতল"
                          className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-sm font-semibold"
                        />
                      </div>

                      {/* Selling Price */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[11px] font-bold text-stone-600 block">বিক্রয় মূল্য (৳):</label>
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => handleUpdateVariant(idx, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="350"
                          className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-sm font-mono font-bold text-emerald-800"
                        />
                      </div>

                      {/* Original Price */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[11px] font-bold text-stone-600 block">রেগুলার মূল্য (৳):</label>
                        <input
                          type="number"
                          value={v.originalPrice || ''}
                          onChange={(e) => handleUpdateVariant(idx, 'originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="400"
                          className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-sm font-mono text-stone-500"
                        />
                      </div>

                      {/* Delete */}
                      <div className="sm:col-span-2 flex justify-end pt-5">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="প্যাকেজ ডিলিট করুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* Checkboxes: Best Seller & Free Delivery */}
                    <div className="flex items-center gap-6 pt-2 border-t border-stone-200/60 text-xs">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={v.isPopular}
                          onChange={(e) => handleUpdateVariant(idx, 'isPopular', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="font-bold text-stone-800">🌟 বেস্ট সেলার ব্যাজ দেখাও</span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={v.freeDelivery}
                          onChange={(e) => handleUpdateVariant(idx, 'freeDelivery', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="font-bold text-emerald-800">🚚 এই সাইজে ফ্রি ডেলিভারি দাও</span>
                      </label>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: AD COPY TEMPLATES */}
          {activeTab === 'ad_templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">ফেসবুক অ্যাড ক্যাপশন টেমপ্লেট</h3>
                  <p className="text-xs text-stone-500">ফেসবুক বিজ্ঞাপনের জন্য তৈরি করা রেডিমেড বাংলা ক্যাপশন</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAdCopy}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  {copiedAdCopy ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAdCopy ? 'ক্যাপশন কপি হয়েছে!' : 'পুরো ক্যাপশন কপি করুন'}</span>
                </button>
              </div>

              <div className="bg-stone-900 text-emerald-300 p-5 rounded-2xl font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed border border-stone-800 selection:bg-emerald-500 selection:text-white">
                {sampleAdCopy}
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                <span className="font-bold block">💡 ফেসবুক অ্যাড রান করার নিয়ম:</span>
                <p>
                  ১. ফেসবুক অ্যাড ম্যানেজারে গিয়ে **Sales / Conversion** ক্যাম্পেইন সিলেক্ট করুন।<br />
                  ২. উপরের ক্যাপশনটি বিজ্ঞাপনের প্রাইমারি টেক্সট হিসেবে পেস্ট করুন।<br />
                  ৩. ডেস্টিনেশন URL বক্সে আপনার এই ল্যান্ডিং পেজের লিংকটি দিন।
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions - Fixed & Pinned */}
        <div className="bg-stone-50 border-t border-stone-200 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-stone-100 text-stone-700 font-bold rounded-xl text-xs sm:text-sm border border-stone-300 transition-colors cursor-pointer shadow-2xs"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>সংরক্ষণ করুন (Save Changes)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
