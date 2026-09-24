'use client';

import { SafeImage } from '@/components/shared/SafeImage';
import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Share2,
  Search,
  Upload,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  ImageIcon,
  ShieldCheck,
  Tag,
  Link,
  Eye,
  Info,
  Layers,
  Crop
} from 'lucide-react';
import { SeoConfig, DEFAULT_SEO_CONFIG } from '@/types';
import { compressImageFile } from '@/lib/imageCompressor';
import { ImageCropZoomModal } from '@/components/shared/ImageCropZoomModal';

interface SeoSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  seoConfig: SeoConfig;
  onSave: (config: SeoConfig) => Promise<void>;
}

const PRESET_THEMES: { name: string; desc: string; config: Partial<SeoConfig> }[] = [
  {
    name: '🌟 ডিফল্ট আল-বারাকাহ লাক্সারি ও অর্গানিক',
    desc: 'খাঁটি মধু, কাঠের ঘানি সরিষার তেল, কালোজিরা তেল ও লাক্সারি আতর',
    config: {
      metaTitle: 'Al Barakah Premium — Luxury Islamic Lifestyle & Organic Products',
      metaDescription: 'আল বারাকাহ প্রিমিয়াম — শতভাগ খাঁটি কাঠের ঘানি সরিষার তেল, প্রাকৃতিক মধু, প্রিমিয়াম আতর, সুন্নাহ আইটেম ও ইসলামিক লাইফস্টাইল পণ্য। ক্যাশ অন ডেলিভারি সারা বাংলাদেশে।',
      ogImage: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&q=80&w=1200',
      keywords: 'Al Barakah Premium, কাঠের ঘানি সরিষার তেল, সুন্দরবনের মধু, কালোজিরা তেল, প্রিমিয়াম আতর, Sunnah Products Bangladesh',
      siteName: 'Al Barakah Premium',
      canonicalUrl: 'https://albarakahpremium.com',
    },
  },
  {
    name: '🌿 স্পেশাল সরিষার তেল ও পুষ্টি ক্যাম্পেইন',
    desc: 'ঘানির খাঁটি সরিষার তেল স্পেশাল ফোকাস ও মেটা বিবরণ',
    config: {
      metaTitle: 'খাঁটি কাঠের ঘানির সরিষার তেল | Al Barakah Premium Organic Oil',
      metaDescription: 'প্রথম চাপের কোল্ড প্রেসড ১০০% খাঁটি সরিষার তেল। কোনো কেমিক্যাল ও ভেজাল ছাড়া সরাসরি প্রস্তুতকৃত স্বাস্থ্যকর তেল অর্ডার করুন আল বারাকাহ প্রিমিয়ামে।',
      ogImage: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=1200',
      keywords: 'সরিষার তেল, কোল্ড প্রেস সরিষার তেল, খাঁটি ঘানির তেল, Mustard Oil Bangladesh, Al Barakah Pure Oil',
      siteName: 'Al Barakah Premium Organic',
      canonicalUrl: 'https://albarakahpremium.com',
    },
  },
  {
    name: '🌙 ঈদ ও মাহে রমজান অফার',
    desc: 'রমজান ও উৎসবের স্পেশাল অফার ব্যানার ও ডেসক্রিপশন',
    config: {
      metaTitle: 'ঈদ ও রমজান স্পেশাল কালেকশন | Al Barakah Premium Exclusive Offers',
      metaDescription: 'পবিত্র রমজান ও ঈদ উপলক্ষ্যে আল বারাকাহ প্রিমিয়ামের খাঁটি মধু, প্রিমিয়াম জাফরান, কস্তুরী আতর ও অর্গানিক কম্বো প্যাকে বিশেষ মূল্যছাড়!',
      ogImage: 'https://images.unsplash.com/photo-1584278860047-22db9ff82bed?auto=format&fit=crop&q=80&w=1200',
      keywords: 'Eid Offers, Ramadan Discount Bangladesh, Pure Honey, Attar, Al Barakah Eid Collection',
      siteName: 'Al Barakah Premium',
      canonicalUrl: 'https://albarakahpremium.com',
    },
  },
];

export const SeoSettingsModal: React.FC<SeoSettingsModalProps> = ({
  isOpen,
  onClose,
  seoConfig,
  onSave,
}) => {
  const [formData, setFormData] = useState<SeoConfig>(seoConfig || DEFAULT_SEO_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'google' | 'social'>('google');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  // BUG_FIXES.md: the legacy dashboard opened the crop modal without telling it where to put the result, so the cropped image was dropped.
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  useEffect(() => {
    if (seoConfig) {
      setFormData(seoConfig);
    }
  }, [seoConfig]);

  if (!isOpen) return null;

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploadingImg(true);
      const compressed = await compressImageFile(file, 1200, 630, 0.85);
      setFormData((prev) => ({ ...prev, ogImage: compressed }));
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleApplyPreset = (presetConfig: Partial<SeoConfig>) => {
    setFormData((prev) => ({
      ...prev,
      ...presetConfig,
    }));
  };

  const handleResetToDefault = () => {
    if (window.confirm('আপনি কি ডিফল্ট SEO সেটিংসে রিসেট করতে চান?')) {
      setFormData(DEFAULT_SEO_CONFIG);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSave(formData);
      setSaveSuccessNotice('গ্লোবাল এসইও ও সোশ্যাল শেয়ার সেটিংস সফলভাবে ক্লাউড ডাটাবেজে সেভ হয়েছে!');
      setTimeout(() => {
        setSaveSuccessNotice(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to save SEO settings:', err);
      alert('সেটিংস সেভ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSaving(false);
    }
  };

  const titleLength = formData.metaTitle?.length || 0;
  const descLength = formData.metaDescription?.length || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#03251a] via-[#053828] to-[#0a5c36] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg tracking-tight font-serif text-white">
                  Global SEO & Social Share Manager
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 uppercase tracking-wider">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                গুগল সার্চ ও ফেসবুক/হোয়াটসঅ্যাপে লিংক শেয়ারিং ব্যানার ও মেটা টাইটেল পরিবর্তন করুন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {saveSuccessNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessNotice}</span>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>রেডিমেড প্রিসেট থিমসমূহ (1-Click Presets):</span>
              </span>
              <span className="text-[10px] text-stone-500 font-medium">ক্লিক করে ইনস্ট্যান্ট পূরণ করুন</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESET_THEMES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset.config)}
                  className="p-2.5 text-left rounded-xl bg-white border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer group space-y-1 shadow-xs"
                >
                  <p className="text-[11px] font-bold text-stone-900 group-hover:text-emerald-800 line-clamp-1">
                    {preset.name}
                  </p>
                  <p className="text-[10px] text-stone-500 line-clamp-1 leading-relaxed">
                    {preset.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Card (Google vs Facebook/Social Switcher) */}
          <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-lg border border-stone-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-stone-200">
                  লাইভ প্রিভিউ (কাস্টমার ও সোশ্যাল মিডিয়ায় কেমন দেখাবে):
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('google')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === 'google'
                      ? 'bg-[#4285F4] text-white shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Search className="w-3 h-3" />
                  <span>Google Search</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('social')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === 'social'
                      ? 'bg-[#1877F2] text-white shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Share2 className="w-3 h-3" />
                  <span>Facebook / Social</span>
                </button>
              </div>
            </div>

            {/* Google Search Live Preview */}
            {activePreviewTab === 'google' && (
              <div className="bg-white text-stone-900 p-4 rounded-xl border border-stone-300 font-sans shadow-xs space-y-1 animate-in fade-in">
                <div className="flex items-center gap-2 text-[12px] text-stone-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[9px] font-bold">
                    A
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-stone-900 text-xs leading-none">
                      {formData.siteName || 'Al Barakah Premium'}
                    </span>
                    <span className="text-[11px] text-stone-500 truncate max-w-sm">
                      {formData.canonicalUrl || 'https://albarakahpremium.com'}
                    </span>
                  </div>
                </div>
                <h4 className="text-[#1a0dab] hover:underline text-base sm:text-lg font-medium leading-snug cursor-pointer pt-0.5">
                  {formData.metaTitle || 'Al Barakah Premium — Luxury Islamic Lifestyle & Organic Products'}
                </h4>
                <p className="text-[#4d5156] text-xs sm:text-sm leading-relaxed line-clamp-2 pt-0.5">
                  {formData.metaDescription ||
                    'An elegant, premium eCommerce platform for Al Barakah Premium in Bangladesh, featuring pure organic honey, extra virgin mustard oil, luxury attars, and lifestyle.'}
                </p>
              </div>
            )}

            {/* Facebook / Social Share Card Live Preview */}
            {activePreviewTab === 'social' && (
              <div className="bg-[#f0f2f5] text-stone-900 rounded-xl border border-stone-300 overflow-hidden shadow-xs animate-in fade-in max-w-md mx-auto">
                <div className="relative w-full h-44 sm:h-48 bg-stone-200 overflow-hidden group">
                  {formData.ogImage ? (
                    <SafeImage
                      src={formData.ogImage}
                      alt="Social Preview Banner"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 space-y-1">
                      <ImageIcon className="w-8 h-8 stroke-1" />
                      <span className="text-xs">ব্যানার ছবি আপলোড করুন</span>
                    </div>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-bold backdrop-blur-xs">
                    1200 × 630 Ratio
                  </span>
                </div>
                <div className="p-3 bg-white border-t border-stone-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                    {formData.canonicalUrl ? formData.canonicalUrl.replace('https://', '') : 'albarakahpremium.com'}
                  </span>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-1 leading-tight">
                    {formData.metaTitle || 'Al Barakah Premium — Luxury Islamic Lifestyle & Organic Products'}
                  </h5>
                  <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                    {formData.metaDescription ||
                      'আল বারাকাহ প্রিমিয়াম — শতভাগ খাঁটি কাঠের ঘানি সরিষার তেল, প্রাকৃতিক মধু, প্রিমিয়াম আতর ও সুন্নাহ কালেকশন।'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Meta Title */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Global SEO Meta Title (গ্লোবাল ব্রাউজার ও সার্চ টাইটেল) *</span>
                </label>
                <span
                  className={`text-[11px] font-mono font-bold ${
                    titleLength >= 40 && titleLength <= 65
                      ? 'text-emerald-600'
                      : titleLength > 65
                      ? 'text-amber-600'
                      : 'text-stone-400'
                  }`}
                >
                  {titleLength}/60 chars {titleLength >= 40 && titleLength <= 65 ? '✓ অপটিমাল' : ''}
                </span>
              </div>
              <input
                type="text"
                required
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="যেমন: Al Barakah Premium — Luxury Islamic Lifestyle & Organic Products"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              />
              <p className="text-[10px] text-stone-500">
                গুগল সার্চ ও ব্রাউজার ট্যাবে এটি প্রথম প্রদর্শিত হয়। ৫০-৬০ অক্ষরের মধ্যে রাখা সবচেয়ে ভালো।
              </p>
            </div>

            {/* Meta Description */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Meta Description (সার্চ ইঞ্জিন ও সোশ্যাল বিবরণ) *</span>
                </label>
                <span
                  className={`text-[11px] font-mono font-bold ${
                    descLength >= 120 && descLength <= 165
                      ? 'text-emerald-600'
                      : descLength > 165
                      ? 'text-amber-600'
                      : 'text-stone-400'
                  }`}
                >
                  {descLength}/160 chars {descLength >= 120 && descLength <= 165 ? '✓ অপটিমাল' : ''}
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="আপনার স্টোরের মূল বিশেষত্ব, খাঁটি পণ্য, অর্গানিক সরিষার তেল ও আতরের বিবরণ সংক্ষেপে লিখুন..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white leading-relaxed"
              />
            </div>

            {/* Social Share Image (OG Image) */}
            <div className="space-y-2 md:col-span-2 bg-stone-50/80 p-4 rounded-2xl border border-stone-200">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Social Media OpenGraph Banner (লিংক শেয়ারিং আকর্ষণীয় ছবি) *</span>
              </label>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                ফেসবুক, মেসেঞ্জার, হোয়াটসঅ্যাপ বা টুইটারে আপনার ওয়েবসাইটের লিংক শেয়ার করলে এই ছবিটি বড় প্রিভিউ কার্ড হিসেবে ফুটে উঠবে।
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                {/* Thumbnail Preview */}
                <div className="relative w-32 h-20 rounded-xl bg-white border border-stone-300 overflow-hidden shrink-0 shadow-xs flex items-center justify-center group">
                  {formData.ogImage ? (
                    <>
                      <SafeImage
                        src={formData.ogImage}
                        alt="OG Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {(
                        <button
                          type="button"
                          onClick={() => setCropSrc(formData.ogImage)}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-[10px] font-bold transition-opacity cursor-pointer"
                        >
                          <Crop className="w-3 h-3 text-emerald-400" />
                          <span>Crop</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <ImageIcon className="w-6 h-6 text-stone-300" />
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer transition-all shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingImg ? 'প্রসেসিং হচ্ছে...' : 'ছবি আপলোড করুন (Upload Banner)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingImg}
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {formData.ogImage && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ogImage: '' })}
                        className="px-3 py-2 rounded-xl bg-stone-200 hover:bg-rose-100 text-stone-700 hover:text-rose-700 text-xs font-bold cursor-pointer transition-colors"
                      >
                        মুছুন
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-500 font-bold whitespace-nowrap">বা URL লিংক:</span>
                    <input
                      type="url"
                      value={formData.ogImage}
                      onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Focus Keywords */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                <span>Search Keywords (সার্চ ট্যাগ ও কি-ওয়ার্ড)</span>
              </label>
              <input
                type="text"
                value={formData.keywords || ''}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="যেমন: সরিষার তেল, খাঁটি মধু, আতর, আল বারাকাহ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              />
              <p className="text-[10px] text-stone-400">কমা (,) দিয়ে আলাদা করুন</p>
            </div>

            {/* Site / Brand Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Brand & Site Name (ব্র্যান্ড নাম)</span>
              </label>
              <input
                type="text"
                value={formData.siteName || ''}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                placeholder="যেমন: Al Barakah Premium"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              />
            </div>

            {/* Canonical Website URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-emerald-700" />
                <span>Canonical Website URL (মূল ডোমেইন লিংক)</span>
              </label>
              <input
                type="url"
                value={formData.canonicalUrl || ''}
                onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                placeholder="https://albarakahpremium.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white font-mono text-[11px]"
              />
            </div>

            {/* Twitter Handle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                <span>Social / Twitter Handle (ইউজারনেম)</span>
              </label>
              <input
                type="text"
                value={formData.twitterHandle || ''}
                onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                placeholder="@albarakahpremium"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ডিফল্টে রিসেট</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
              >
                বাতিল (Cancel)
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0a5c36] to-[#08482a] hover:from-[#08482a] hover:to-[#053828] text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>ক্লাউডে সেভ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>সেভ করুন (Save SEO Settings)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ImageCropZoomModal
        isOpen={cropSrc !== null}
        imageSrc={cropSrc || ''}
        onClose={() => setCropSrc(null)}
        onApply={(dataUrl) => setFormData((prev) => ({ ...prev, ogImage: dataUrl }))}
        aspectRatio={1200 / 630}
        outputWidth={1200}
        outputHeight={630}
        title="সোশ্যাল শেয়ার ব্যানার ক্রপ ও জুম করুন"
      />
    </div>
  );
};
