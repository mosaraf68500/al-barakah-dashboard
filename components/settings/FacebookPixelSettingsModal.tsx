'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Globe,
  Radio,
  Send,
  Trash2,
  ExternalLink,
  Code2,
  Zap,
  Activity,
  Layers,
  HelpCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { FacebookPixelConfig, FacebookPixelEventLog, DEFAULT_FACEBOOK_PIXEL_CONFIG } from '@/types';
import { sendTestPixelEvent, subscribeToPixelLogs, clearPixelLogs } from '@/lib/pixelTestLog';
import { SecretInput } from '@/components/shared/SecretInput';

interface FacebookPixelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: FacebookPixelConfig;
  onSaveConfig: (config: FacebookPixelConfig) => void;
}

export const FacebookPixelSettingsModal: React.FC<FacebookPixelSettingsModalProps> = ({
  isOpen,
  onClose,
  config = DEFAULT_FACEBOOK_PIXEL_CONFIG,
  onSaveConfig,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formData, setFormData] = useState<FacebookPixelConfig>({
    ...DEFAULT_FACEBOOK_PIXEL_CONFIG,
    ...config,
  });

  const [activeSubTab, setActiveSubTab] = useState<'PIXEL' | 'DOMAIN' | 'TESTER' | 'GUIDE'>('PIXEL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [eventLogs, setEventLogs] = useState<FacebookPixelEventLog[]>([]);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setFormData({
        ...DEFAULT_FACEBOOK_PIXEL_CONFIG,
        ...config,
      });
    }
  }, [config]);

  useEffect(() => {
    const unsub = subscribeToPixelLogs((logs) => {
      setEventLogs(logs);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    // The domain-verification <meta> tag is now rendered by the storefront from the saved setting (the admin no longer shares a <head> with it).
    onClose();
  };

  const handleFireTest = async (
    eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'
  ) => {
    // SIMULATED by default: the server only contacts Meta when ENABLE_LIVE_INTEGRATIONS=true.
    const res = await sendTestPixelEvent(eventName);
    setTestSuccessMessage(
      res.simulated
        ? `🧪 [SIMULATED] ইভেন্ট [${eventName}] শুধু লগে যোগ হয়েছে — ফেসবুকে কিছু পাঠানো হয়নি।`
        : res.success
        ? `✅ ফেসবুক ইভেন্ট [${eventName}] সফলভাবে ফায়ার করা হয়েছে!`
        : `⚠️ ${res.message}`
    );
    setTimeout(() => setTestSuccessMessage(null), 4000);
  };

  const hasPixel = Boolean(formData.pixelId && formData.pixelId.trim());
  const hasDomainVerification = Boolean(formData.domainVerificationCode && formData.domainVerificationCode.trim());

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden bg-stone-950/80 backdrop-blur-md flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'} animate-fadeIn`}>
      <div className={`bg-white w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col transition-all duration-200 ${
        isFullscreen ? 'h-full rounded-none border-none' : 'max-w-4xl h-[94vh] rounded-3xl'
      }`}>
        {/* Header - Pinned */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-stone-900 via-[#0a5c36] to-stone-900 text-white flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-serif font-black text-amber-100 truncate">
                  Facebook Pixel, CAPI & Domain Verification
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40 shrink-0">
                  Meta Ads Engine
                </span>
              </div>
              <p className="text-xs text-stone-300 truncate">
                কাস্টমার অ্যাকশন ট্র্যাকিং, ইভেন্ট অপটিমাইজেশন ও ফেসবুক ডোমেইন ভেরিফিকেশন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'স্বাভাবিক সাইজে ফিরুন' : 'ফুল স্ক্রিন করুন (Fullscreen)'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs - Pinned */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 bg-stone-50 border-b border-stone-200 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('PIXEL')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'PIXEL'
                ? 'border-emerald-700 text-emerald-900 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Radio className="w-4 h-4 text-blue-600" />
            <span>Pixel & CAPI সেটিংস</span>
            {hasPixel && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('DOMAIN')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'DOMAIN'
                ? 'border-emerald-700 text-emerald-900 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Domain Verification</span>
            {hasDomainVerification && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('TESTER')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'TESTER'
                ? 'border-emerald-700 text-emerald-900 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-600" />
            <span>লাইভ ইভেন্ট টেস্টার ({eventLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('GUIDE')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'GUIDE'
                ? 'border-emerald-700 text-emerald-900 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>গাইড ও টিপস</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PIXEL & CAPI SETTINGS */}
          {activeSubTab === 'PIXEL' && (
            <div className="space-y-6">
              {/* Status Header Alert */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  hasPixel
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {hasPixel ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm">
                    {hasPixel
                      ? `ফেসবুক পিক্সেল যুক্ত আছে (Pixel ID: ${formData.pixelId})`
                      : 'ফেসবুক পিক্সেল আইডি এখনও কনফিগার করা হয়নি'}
                  </div>
                  <div className="text-stone-600 leading-relaxed">
                    {hasPixel
                      ? 'ভিজিটরদের পেইজভিউ, কার্ট এবং পারচেজ ইভেন্ট স্বয়ংক্রিয়ভাবে ট্র্যাকিং হচ্ছে। আপনি নিচের টেস্টার দিয়ে ইভেন্ট টেস্ট করতে পারেন।'
                      : 'আপনার Meta Events Manager থেকে ১৫ বা ১৬ সংখ্যার Pixel / Dataset ID টি কপি করে নিচের ফিল্ডে বসান।'}
                  </div>
                </div>
              </div>

              {/* Pixel General Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-stone-900">Facebook Pixel সক্রিয় রাখুন</div>
                  <div className="text-xs text-stone-500">
                    ওয়েবসাইটে ফেসবুক ট্র্যাকিং কোড লাইভ কার্যকর থাকবে
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Pixel ID Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Facebook Pixel / Dataset ID <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="যেমন: 123456789012345"
                    value={formData.pixelId}
                    onChange={(e) => setFormData({ ...formData, pixelId: e.target.value.trim() })}
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-white border border-stone-300 text-stone-900 font-mono text-sm focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                  {formData.pixelId && (
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.pixelId, 'pxid')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                      title="Copy Pixel ID"
                    >
                      {copiedKey === 'pxid' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-500">
                  Meta Events Manager &gt; Data Sources &gt; Settings এ গিয়ে Dataset ID / Pixel ID খুঁজে পাবেন।
                </p>
              </div>

              {/* Conversions API (CAPI) Section */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-stone-900">
                        Meta Conversions API (CAPI) - সার্ভার ট্র্যাকিং
                      </div>
                      <div className="text-[11px] text-stone-500">
                        অ্যাড ব্লকার বা ব্রাউজার সীমাবদ্ধতা বাইপাস করে ১০০% অ্যাকুরেট পারচেজ ডেটা পাঠাতে সহায়ক
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableCapi}
                      onChange={(e) => setFormData({ ...formData, enableCapi: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {formData.enableCapi && (
                  <div className="space-y-4 pt-2 border-t border-stone-200">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-stone-700">
                        CAPI Access Token (Graph API)
                      </label>
                      <SecretInput
                        placeholder="EAAB..."
                        value={formData.accessToken || ''}
                        onChange={(e) => setFormData({ ...formData, accessToken: e.target.value.trim() })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
                      />
                      <p className="text-[10px] text-stone-500">
                        Meta Events Manager &gt; Settings &gt; Conversions API &gt; "Generate access token" থেকে টোকেন তৈরি করুন।
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-stone-700">
                        Test Event Code (ঐচ্ছিক - টেস্ট করার জন্য)
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: TEST72910"
                        value={formData.testEventCode || ''}
                        onChange={(e) => setFormData({ ...formData, testEventCode: e.target.value.trim() })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
                      />
                      <p className="text-[10px] text-stone-500">
                        Meta Events Manager &gt; Test Events ট্যাবের কোডটি এখানে দিলে লাইভ টেস্ট দেখা যাবে।
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Event Tracking Toggles Grid */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>ট্র্যাক করার ইভেন্টসমূহ (Standard Events)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="p-3 rounded-xl border border-stone-200 bg-white flex items-center justify-between cursor-pointer hover:bg-stone-50">
                    <div>
                      <div className="font-bold text-stone-800">1. PageView</div>
                      <div className="text-[11px] text-stone-500">প্রতিটি পেজ ভিজিটের সময়</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.trackPageView}
                      onChange={(e) => setFormData({ ...formData, trackPageView: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>

                  <label className="p-3 rounded-xl border border-stone-200 bg-white flex items-center justify-between cursor-pointer hover:bg-stone-50">
                    <div>
                      <div className="font-bold text-stone-800">2. ViewContent</div>
                      <div className="text-[11px] text-stone-500">প্রোডাক্ট বিস্তারিত বা ল্যান্ডিং পেজ দেখলে</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.trackViewContent}
                      onChange={(e) => setFormData({ ...formData, trackViewContent: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>

                  <label className="p-3 rounded-xl border border-stone-200 bg-white flex items-center justify-between cursor-pointer hover:bg-stone-50">
                    <div>
                      <div className="font-bold text-stone-800">3. AddToCart</div>
                      <div className="text-[11px] text-stone-500">কার্টে প্রোডাক্ট যোগ করার সময়</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.trackAddToCart}
                      onChange={(e) => setFormData({ ...formData, trackAddToCart: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>

                  <label className="p-3 rounded-xl border border-stone-200 bg-white flex items-center justify-between cursor-pointer hover:bg-stone-50">
                    <div>
                      <div className="font-bold text-stone-800">4. InitiateCheckout</div>
                      <div className="text-[11px] text-stone-500">অর্ডার ফর্মে প্রবেশ বা চেকআউট শুরু করলে</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.trackInitiateCheckout}
                      onChange={(e) => setFormData({ ...formData, trackInitiateCheckout: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>

                  <label className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 sm:col-span-2 flex items-center justify-between cursor-pointer hover:bg-emerald-50">
                    <div>
                      <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>5. Purchase (সর্বোচ্চ গুরুত্বপূণ ইভেন্ট)</span>
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        কাস্টমার সফল অর্ডার কনফার্ম করলে মোট টাকার পরিমাণ (Value), প্রোডাক্ট আইডি ও অর্ডার আইডি সহ
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.trackPurchase}
                      onChange={(e) => setFormData({ ...formData, trackPurchase: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOMAIN VERIFICATION */}
          {activeSubTab === 'DOMAIN' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-stone-900 text-white shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Meta Brand Safety & Domain Verification</span>
                </div>
                <h3 className="text-base sm:text-lg font-serif font-black">
                  albarakahpremium.com ডোমেইন ভেরিফিকেশন
                </h3>
                <p className="text-xs text-stone-200 leading-relaxed">
                  ফেসবুক বিজনেস ম্যানেজারে ডোমেইন ভেরিফাই থাকলে আপনার ফেসবুক অ্যাডের রূপান্তর (Conversion Tracking) সর্বোচ্চ পারফর্ম করবে এবং ল্যান্ডিং পেজে কোনো লিমিটেশন আসবে না।
                </p>
              </div>

              {/* Option 1: HTML Meta Tag Method (Easiest) */}
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      ১
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-stone-900">
                      পদ্ধতি ১: মেটা ট্যাগ ভেরিফিকেশন (সবচেয়ে সহজ ও দ্রুত)
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    সুপারিশকৃত
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Meta Business Settings &gt; Brand Safety &gt; Domains এ গিয়ে <code>albarakahpremium.com</code> অ্যাড করুন। এরপর "Add a meta-tag to your HTML source code" সিলেক্ট করে কোডটি নিচের বক্সে পেস্ট করুন:
                </p>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-700">
                    Meta-Tag Content Code / সম্পূর্ণ ট্যাগ
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder='যেমন: <meta name="facebook-domain-verification" content="abcdef1234567890" /> অথবা শুধু কোড'
                      value={formData.domainVerificationCode || ''}
                      onChange={(e) => setFormData({ ...formData, domainVerificationCode: e.target.value })}
                      className="w-full pl-4 pr-12 py-3 rounded-xl bg-white border border-stone-300 text-stone-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
                    />
                    {formData.domainVerificationCode && (
                      <button
                        type="button"
                        onClick={() => handleCopy(formData.domainVerificationCode || '', 'meta')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600"
                        title="Copy Code"
                      >
                        {copiedKey === 'meta' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {formData.domainVerificationCode ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>মেটা ট্যাগ কনফিগার করা আছে। সেভ বাটনে ক্লিক করলে ওয়েবসাইট হেডার-এ স্বয়ংক্রিয়ভাবে সক্রিয় হবে।</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 text-xs">
                    টিপস: ফেসবুক থেকে পাওয়া সম্পূর্ণ লাইনটি বা শুধু <code>content="..."</code> এর ভেতরের কোডটি পেস্ট করলেই চলবে।
                  </div>
                )}
              </div>

              {/* Option 2: DNS TXT Record Method */}
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-xs">
                    ২
                  </span>
                  <div className="text-xs sm:text-sm font-bold text-stone-900">
                    পদ্ধতি ২: DNS TXT রেকর্ড পদ্ধতি (Domain Registrar / Cloudflare / cPanel)
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  আপনি যদি আপনার ডোমেইন কন্ট্রোল প্যানেল (যেমন Cloudflare, Namecheap, cPanel) থেকে সরাসরি DNS ভেরিফাই করতে চান:
                </p>

                <div className="bg-stone-900 text-stone-100 p-4 rounded-xl font-mono text-xs space-y-2">
                  <div className="flex justify-between items-center text-stone-400 text-[11px] pb-2 border-b border-stone-800">
                    <span>DNS Record Configuration</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`facebook-domain-verification=${formData.domainVerificationCode || 'your_code'}`, 'dns')}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'dns' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy TXT Value</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-stone-500 block">Record Type:</span>
                      <span className="text-amber-400 font-bold">TXT</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Host / Name:</span>
                      <span className="text-white">@ (বা albarakahpremium.com)</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">TTL:</span>
                      <span className="text-white">Auto / 3600</span>
                    </div>
                  </div>
                  <div className="pt-2 text-stone-300">
                    <span className="text-stone-500">Value: </span>
                    <code>facebook-domain-verification={formData.domainVerificationCode || '[মেটা থেকে পাওয়া কোড]'}</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE EVENT TESTER */}
          {activeSubTab === 'TESTER' && (
            <div className="space-y-6">
              {testSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs animate-fadeIn flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{testSuccessMessage}</span>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Send className="w-4 h-4 text-emerald-600" />
                      <span>লাইভ ফেসবুক পিক্সেল ইভেন্ট টেস্ট করুন</span>
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      নিচের যেকোনো বাটনে ক্লিক করে সাথে সাথে ব্রাউজার ও মেটা ইভেন্টস ম্যানেজারে টেস্ট পাঠান
                    </p>
                  </div>
                  <div className="text-xs font-mono text-stone-600 bg-white px-3 py-1.5 rounded-lg border border-stone-200">
                    Pixel ID: {formData.pixelId || 'সেট করা হয়নি'}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleFireTest('PageView')}
                    className="p-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>PageView টেস্ট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFireTest('ViewContent')}
                    className="p-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <EyeIcon className="w-3.5 h-3.5 text-amber-600" />
                    <span>ViewContent টেস্ট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFireTest('AddToCart')}
                    className="p-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    <span>AddToCart টেস্ট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFireTest('InitiateCheckout')}
                    className="p-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Code2 className="w-3.5 h-3.5 text-orange-600" />
                    <span>Checkout টেস্ট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFireTest('Purchase')}
                    className="p-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors col-span-2 sm:col-span-2 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Purchase টেস্ট ফায়ার করুন (৳১,৩৫০)</span>
                  </button>
                </div>
              </div>

              {/* Event Activity Log Stream */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs space-y-0">
                <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                      রিয়েল-টাইম ইভেন্ট লগ ({eventLogs.length})
                    </span>
                  </div>
                  {eventLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => clearPixelLogs()}
                      className="text-xs text-stone-500 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>লগ মুছুন</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto font-mono text-xs">
                  {eventLogs.length === 0 ? (
                    <div className="p-8 text-center text-stone-400 font-sans text-xs">
                      এখনও কোনো ইভেন্ট ফায়ার করা হয়নি। উপরের বাটনগুলো দিয়ে টেস্ট করুন অথবা ওয়েবসাইটে ব্রাউজ ও অর্ডার দিন।
                    </div>
                  ) : (
                    eventLogs.map((log) => (
                      <div key={log.id} className="p-3.5 hover:bg-stone-50 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                log.status === 'SUCCESS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.status === 'TEST'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {log.eventName}
                            </span>
                            <span className="text-[10px] text-stone-400 font-sans">{log.method}</span>
                          </div>
                          <div className="text-[11px] text-stone-600 truncate max-w-md">
                            {JSON.stringify(log.data)}
                          </div>
                        </div>
                        <div className="text-[10px] text-stone-400 whitespace-nowrap">{log.timestamp}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STEP BY STEP GUIDE */}
          {activeSubTab === 'GUIDE' && (
            <div className="space-y-4 text-xs text-stone-700">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="font-bold text-amber-950 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>ফেসবুক অ্যাড ট্র্যাকিং ও আরও বেশি সেলস পাওয়ার কৌশল</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  সঠিকভাবে পিক্সেল ও ডোমেন ভেরিফিকেশন করা থাকলে ফেসবুক অ্যালগরিদম বুঝতে পারে কোন বয়সের, কোন এলাকার মানুষ আপনার সরিষার তেল বা আতর বেশি ক্রয় করছে। ফলে কম খরচে অনেক বেশি অর্ডার আসে।
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-1.5">
                  <div className="font-bold text-stone-900">ধাপ ১: Pixel ID কোথায় পাবেন?</div>
                  <ol className="list-decimal list-inside space-y-1 text-stone-600 pl-1">
                    <li>ফেসবুক <strong>Meta Events Manager</strong> এ যান (business.facebook.com/events_manager2)।</li>
                    <li>বামে <strong>Data Sources</strong> থেকে আপনার Pixel বা Dataset সিলেক্ট করুন।</li>
                    <li><strong>Settings</strong> ট্যাবে গিয়ে <code>Dataset ID</code> / <code>Pixel ID</code> কপি করে এখানে বসান।</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-1.5">
                  <div className="font-bold text-stone-900">ধাপ ২: ডোমেইন ভেরিফিকেশন কীভাবে কনফার্ম করবেন?</div>
                  <ol className="list-decimal list-inside space-y-1 text-stone-600 pl-1">
                    <li>Meta Business Settings এ <strong>Brand Safety &gt; Domains</strong> এ যান।</li>
                    <li><code>albarakahpremium.com</code> অ্যাড করে মেটা-ট্যাগ কোডটি এখানে সেভ করুন।</li>
                    <li>মেটা বিজনেস ম্যানেজারে গিয়ে সবুজ <strong>"Verify Domain"</strong> বাটনে ক্লিক করলেই ভেরিফায়েড হয়ে যাবে!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Footer Save & Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
            >
              বাতিল
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>সেটিংস সেভ করুন (Save Settings)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Mini Eye Icon helper
function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
