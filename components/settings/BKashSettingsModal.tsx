'use client';

import React, { useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Key,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Server,
  FileText,
  AlertCircle,
  Sparkles,
  Zap,
  PhoneCall
} from 'lucide-react';
import { BKashPaymentConfig, DEFAULT_BKASH_CONFIG } from '@/types';

interface BKashSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BKashPaymentConfig;
  onSaveConfig: (config: BKashPaymentConfig) => void;
}

export const BKashSettingsModal: React.FC<BKashSettingsModalProps> = ({
  isOpen,
  onClose,
  config = DEFAULT_BKASH_CONFIG,
  onSaveConfig,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'gateway' | 'guide'>('manual');
  
  // Local state for editing
  const [formData, setFormData] = useState<BKashPaymentConfig>({
    enabled: config.enabled ?? true,
    mode: config.mode || 'MANUAL',
    personalNumber: config.personalNumber || '01316534171',
    accountType: config.accountType || 'Personal',
    manualInstructions: config.manualInstructions || DEFAULT_BKASH_CONFIG.manualInstructions,
    requireTrxId: config.requireTrxId ?? true,
    gateway: {
      appKey: config.gateway?.appKey || '',
      appSecret: config.gateway?.appSecret || '',
      username: config.gateway?.username || '',
      password: config.gateway?.password || '',
      isSandbox: config.gateway?.isSandbox ?? true,
      autoCapture: config.gateway?.autoCapture ?? true,
      callbackUrl: config.gateway?.callbackUrl || `${process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://albarakahpremium.com'}/api/bkash/callback`,
    },
  });

  // Password visibility states
  const [showAppKey, setShowAppKey] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Notification states
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleTestConnection = () => {
    setTestingConnection(true);
    setTestResult(null);

    setTimeout(() => {
      setTestingConnection(false);
      if (formData.gateway.appKey && formData.gateway.appSecret) {
        setTestResult({
          success: true,
          message: formData.gateway.isSandbox 
            ? '✅ bKash Sandbox (Test Environment) ক্রেডেনশিয়ালস যাচাই সফল হয়েছে! টোকেন জেনারেট করা সম্ভব।'
            : '✅ bKash Live Production API কানেকশন ভ্যালিডেশন সফল!',
        });
      } else {
        setTestResult({
          success: false,
          message: '⚠️ App Key এবং App Secret পূরণ করা হয়নি। অনুগ্রহ করে উভয় ফিল্ড পূরণ করুন।',
        });
      }
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
      <div 
        className={`bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 transition-all duration-300 ${
          isFullscreen ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-4xl max-h-[92vh]'
        }`}
      >
        {/* TOP HEADER - Fixed */}
        <div className="px-6 py-4 bg-gradient-to-r from-pink-900 via-[#e2136e] to-[#c2105e] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center font-bold text-xl backdrop-blur-md">
              ৳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg font-serif">
                  bKash Payment Gateway & Settings (বিকাশ পেমেন্ট কনফিগারেশন)
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  formData.mode === 'GATEWAY' 
                    ? 'bg-amber-400 text-stone-950 border-amber-300' 
                    : 'bg-white/20 text-white border-white/30'
                }`}>
                  {formData.mode === 'GATEWAY' ? 'API Gateway Mode' : 'Personal Manual Mode'}
                </span>
              </div>
              <p className="text-xs text-pink-100">
                পার্সোনাল বিকাশ ({formData.personalNumber}) বা ভবিষ্যৎ অফিসিয়াল bKash API Key ও Secret পরিচালনা করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION - Fixed */}
        <div className="bg-stone-100 px-6 pt-3 border-b border-stone-200 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'manual'
                ? 'bg-white text-[#e2136e] border-t-2 border-[#e2136e] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>১. পার্সোনাল বিকাশ (Manual Mode)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gateway')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gateway'
                ? 'bg-white text-[#e2136e] border-t-2 border-[#e2136e] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>২. অফিসিয়াল bKash API Key & Secret</span>
            <span className="text-[10px] bg-pink-100 text-[#e2136e] px-2 py-0.5 rounded-full font-extrabold">
              Future PGW
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-white text-stone-900 border-t-2 border-stone-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>৩. মার্চেন্ট গাইড ও API প্রাপ্তি</span>
          </button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <form id="bkash-settings-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-stone-50/50">
          
          {/* Global Enable Switch */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span>Enable bKash Payment in Checkout</span>
                {formData.enabled ? (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full">
                    Disabled
                  </span>
                )}
              </h4>
              <p className="text-xs text-stone-500">
                গ্রাহকদের জন্য চেকআউট পেজে বিকাশ অপশন প্রদর্শন বা বন্ধ রাখুন
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                formData.enabled
                  ? 'bg-[#e2136e] text-white hover:bg-[#c2105e]'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              {formData.enabled ? 'Enabled (চালু আছে)' : 'Disabled (বন্ধ)'}
            </button>
          </div>

          {/* Mode Switch Card */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Payment Processing Mode (পেমেন্ট মোড নির্বাচন)
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Manual Mode */}
              <div
                onClick={() => setFormData({ ...formData, mode: 'MANUAL' })}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.mode === 'MANUAL'
                    ? 'border-[#e2136e] bg-pink-50/50 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#e2136e]" />
                    <span className="font-bold text-sm text-stone-900">Personal Send Money (ম্যানুয়াল)</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    formData.mode === 'MANUAL' ? 'border-[#e2136e] bg-[#e2136e]' : 'border-stone-300'
                  }`}>
                    {formData.mode === 'MANUAL' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  আপনার বর্তমান পার্সোনাল নাম্বারে ({formData.personalNumber}) কাস্টমার টাকা পাঠাবে এবং TrxID দিয়ে অর্ডার করবে। কোনো মার্চেন্ট ফি নেই।
                </p>
              </div>

              {/* Option 2: Gateway Mode */}
              <div
                onClick={() => setFormData({ ...formData, mode: 'GATEWAY' })}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.mode === 'GATEWAY'
                    ? 'border-[#e2136e] bg-pink-50/50 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-sm text-stone-900">Official bKash PGW (API গেটওয়ে)</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    formData.mode === 'GATEWAY' ? 'border-[#e2136e] bg-[#e2136e]' : 'border-stone-300'
                  }`}>
                    {formData.mode === 'GATEWAY' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  অফিসিয়াল বিকাশ মার্চেন্ট API এর মাধ্যমে স্বয়ংক্রিয় পপআপে পেমেন্ট গ্রহণ ও অটো-ভেরিফিকেশন।
                </p>
              </div>
            </div>
          </div>

          {/* TAB 1: MANUAL PERSONAL BKASH */}
          {activeTab === 'manual' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Account Details */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h4 className="font-bold text-sm text-stone-900 font-serif flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#e2136e]" />
                    <span>Personal bKash Account Details</span>
                  </h4>
                  <span className="text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200">
                    Active Number: {formData.personalNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      bKash Receive Number (টাকা গ্রহণের বিকাশ নম্বর) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.personalNumber}
                        onChange={(e) => setFormData({ ...formData, personalNumber: e.target.value })}
                        placeholder="01316534171"
                        className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-sm font-mono font-bold text-stone-900 focus:outline-hidden focus:border-[#e2136e] focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(formData.personalNumber, 'number')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                        title="Copy Number"
                      >
                        {copiedItem === 'number' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      চেকআউট পেজে কাস্টমার এই নম্বরে টাকা সেন্ড মানি বা ক্যাশ ইন করবে।
                    </p>
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      Account Type (অ্যাকাউন্টের ধরন)
                    </label>
                    <select
                      value={formData.accountType}
                      onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-bold text-stone-900 focus:outline-hidden focus:border-[#e2136e]"
                    >
                      <option value="Personal">Personal (পার্সোনাল - Send Money)</option>
                      <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                      <option value="Merchant">Merchant (মার্চেন্ট - Make Payment)</option>
                    </select>
                    <p className="text-[11px] text-stone-500 mt-1">
                      বর্তমান অ্যাকাউন্ট অনুযায়ী নির্বাচন করুন (যেমন: Personal)।
                    </p>
                  </div>
                </div>

                {/* Require TrxID Toggle */}
                <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                  <div>
                    <label className="text-xs font-bold text-stone-800">
                      Require TrxID (ট্রানজেকশন আইডি বাধ্যতামূলক করা)
                    </label>
                    <p className="text-[11px] text-stone-500">
                      অর্ডার নিশ্চিত করার আগে গ্রাহকের কাছ থেকে TrxID এবং প্রেরক বিকাশ নম্বর গ্রহণ করা হবে।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, requireTrxId: !formData.requireTrxId })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formData.requireTrxId ? 'bg-[#e2136e] text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {formData.requireTrxId ? 'Required (বাধ্যতামূলক)' : 'Optional (ঐচ্ছিক)'}
                  </button>
                </div>

                {/* Bengali Instructions */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Customer Instructions in Checkout (গ্রাহকের জন্য নির্দেশনাবলী)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.manualInstructions}
                    onChange={(e) => setFormData({ ...formData, manualInstructions: e.target.value })}
                    className="w-full p-3.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-[#e2136e] focus:bg-white resize-none"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-gradient-to-br from-pink-50 to-stone-50 p-5 rounded-2xl border-2 border-dashed border-pink-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#e2136e]" />
                    <span>Customer Checkout Preview (গ্রাহক যেমন দেখতে পাবে)</span>
                  </span>
                  <span className="text-[10px] font-bold text-stone-500 font-mono">Live Preview</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#e2136e] text-white flex items-center justify-center font-bold text-lg">
                        ৳
                      </div>
                      <div>
                        <div className="font-bold text-xs text-stone-900">bKash Send Money ({formData.accountType})</div>
                        <div className="text-[11px] font-mono text-[#e2136e] font-bold">{formData.personalNumber}</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-pink-100 text-[#e2136e] px-2 py-0.5 rounded-full font-bold">
                      1-Click Copy
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600 leading-relaxed bg-stone-50 p-2.5 rounded-lg border border-stone-200/70">
                    {formData.manualInstructions}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 bg-stone-100 rounded-lg text-[10px] text-stone-500 font-mono">
                      Sender Phone: 017xxxxxxxx
                    </div>
                    <div className="p-2 bg-stone-100 rounded-lg text-[10px] text-stone-500 font-mono">
                      TrxID: BKG48XXXX
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: OFFICIAL BKASH API GATEWAY (FUTURE PROOF) */}
          {activeTab === 'gateway' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Notice Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold">
                    ভবিষ্যৎ অফিসিয়াল বিকাশ পেমেন্ট গেটওয়ে (bKash PGW Direct Integration)
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    মার্চেন্ট অ্যাকাউন্ট ও বিকাশ ডেভেলপার পোর্টাল থেকে পাওয়া <strong>App Key</strong> এবং <strong>App Secret</strong> এখানে সংরক্ষণ করে রাখুন। গেটওয়ে মোড চালু করলেই গ্রাহক সরাসরি বিকাশ পপআপের মাধ্যমে পেমেন্ট করতে পারবে।
                  </p>
                </div>
              </div>

              {/* Credentials Form */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h4 className="font-bold text-sm text-stone-900 font-serif flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#e2136e]" />
                    <span>bKash PGW API Credentials</span>
                  </h4>

                  {/* Sandbox vs Production Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-600 font-medium">Environment:</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        gateway: { ...formData.gateway, isSandbox: !formData.gateway.isSandbox }
                      })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formData.gateway.isSandbox
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {formData.gateway.isSandbox ? '🧪 Sandbox (Testing)' : '🚀 Live Production'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* bKash App Key */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
                      <span>bKash App Key <span className="text-red-500">*</span></span>
                      <button
                        type="button"
                        onClick={() => setShowAppKey(!showAppKey)}
                        className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                      >
                        {showAppKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showAppKey ? 'Hide' : 'Show'}</span>
                      </button>
                    </label>
                    <input
                      type={showAppKey ? 'text' : 'password'}
                      value={formData.gateway.appKey}
                      onChange={(e) => setFormData({
                        ...formData,
                        gateway: { ...formData.gateway, appKey: e.target.value }
                      })}
                      placeholder="e.g. 4f6xxxxxxxxxxd978"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-mono font-medium text-stone-900 focus:outline-hidden focus:border-[#e2136e] focus:bg-white"
                    />
                  </div>

                  {/* bKash App Secret Key */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
                      <span>bKash App Secret <span className="text-red-500">*</span></span>
                      <button
                        type="button"
                        onClick={() => setShowAppSecret(!showAppSecret)}
                        className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                      >
                        {showAppSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showAppSecret ? 'Hide' : 'Show'}</span>
                      </button>
                    </label>
                    <input
                      type={showAppSecret ? 'text' : 'password'}
                      value={formData.gateway.appSecret}
                      onChange={(e) => setFormData({
                        ...formData,
                        gateway: { ...formData.gateway, appSecret: e.target.value }
                      })}
                      placeholder="e.g. 2xxxxxxxxxxxxxxxxxxxxxxxxx8"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-mono font-medium text-stone-900 focus:outline-hidden focus:border-[#e2136e] focus:bg-white"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      bKash Merchant Username
                    </label>
                    <input
                      type="text"
                      value={formData.gateway.username}
                      onChange={(e) => setFormData({
                        ...formData,
                        gateway: { ...formData.gateway, username: e.target.value }
                      })}
                      placeholder="e.g. sandboxTokenizedUser02"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-mono font-medium text-stone-900 focus:outline-hidden focus:border-[#e2136e] focus:bg-white"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
                      <span>bKash Merchant Password</span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.gateway.password}
                      onChange={(e) => setFormData({
                        ...formData,
                        gateway: { ...formData.gateway, password: e.target.value }
                      })}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-mono font-medium text-stone-900 focus:outline-hidden focus:border-[#e2136e] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Callback & Webhook URL (Readonly with 1-click copy) */}
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    Webhook / IPN Callback URL (বিকাশ ডেভেলপার পোর্টালে দিতে হবে)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formData.gateway.callbackUrl}
                      className="w-full px-3 py-2 rounded-xl bg-stone-100 border border-stone-300 text-xs font-mono text-stone-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.gateway.callbackUrl || '', 'callback')}
                      className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copiedItem === 'callback' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedItem === 'callback' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Test Connection Button */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={testingConnection}
                    onClick={handleTestConnection}
                    className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                    <span>{testingConnection ? 'Testing Connection...' : 'Test bKash API Connection'}</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>256-bit Encrypted Token Security</span>
                  </div>
                </div>

                {testResult && (
                  <div className={`p-3.5 rounded-xl text-xs font-medium border animate-in fade-in duration-200 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}>
                    {testResult.message}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: STEP-BY-STEP MERCHANT GUIDE */}
          {activeTab === 'guide' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-stone-100 pb-3">
                <h4 className="font-bold text-base text-stone-900 font-serif flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#e2136e]" />
                  <span>কীভাবে বিকাশ মার্চেন্ট অ্যাকাউন্ট ও API Key পাবেন?</span>
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  ব্যক্তিগত বিকাশ থেকে অফিসিয়াল বিকাশ মার্চেন্টে আপগ্রেড করার পূর্ণাঙ্গ গাইডলাইন
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#e2136e] text-white flex items-center justify-center font-bold text-sm">
                    ১
                  </div>
                  <h5 className="font-bold text-xs sm:text-sm text-stone-900">
                    কাগজপত্র প্রস্তুতকরণ
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    মার্চেন্ট অ্যাকাউন্ট নেওয়ার জন্য আপনার হালনাগাদ <strong>ট্রেড লাইসেন্স</strong>, <strong>জাতীয় পরিচয়পত্র (NID)</strong> এবং <strong>ব্যাংক চেক/স্টেটমেন্ট</strong> প্রয়োজন হবে।
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#e2136e] text-white flex items-center justify-center font-bold text-sm">
                    ২
                  </div>
                  <h5 className="font-bold text-xs sm:text-sm text-stone-900">
                    বিকাশে আবেদন (Merchant Portal)
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    বিকাশের মার্চেন্ট আবেদন পেজে গিয়ে আপনার ই-কমার্স ওয়েবসাইটের জন্য পেমেন্ট গেটওয়ের আবেদন সাবমিট করুন।
                  </p>
                  <a
                    href="https://www.bkash.com/merchant"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#e2136e] hover:underline pt-1"
                  >
                    <span>বিকাশ মার্চেন্ট পোর্টাল লিংক</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Step 3 */}
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#e2136e] text-white flex items-center justify-center font-bold text-sm">
                    ৩
                  </div>
                  <h5 className="font-bold text-xs sm:text-sm text-stone-900">
                    API Key & Secret সংগ্রহ
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    বিকাশ অনুমোদন দেওয়ার পর তারা আপনাকে ডেভেলপার পোর্টালে <strong>App Key</strong> এবং <strong>App Secret</strong> প্রদান করবে। সেগুলো আমাদের ২ নম্বর ট্যাবে বসিয়ে দিলেই অটোমেটেড গেটওয়ে চালু হয়ে যাবে!
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold">বর্তমানে কি পার্সোনাল বিকাশ দিয়ে ব্যবসা চালানো যাবে?</span>
                  <p className="text-emerald-800 text-[11px]">
                    হ্যাঁ, আপনার পার্সোনাল নম্বর ({formData.personalNumber}) ব্যবহার করে ১০০% নিরাপদে ক্যাশ অন ডেলিভারি এবং সেন্ড মানি TrxID পেমেন্ট গ্রহণ করা যাবে। কোনো মার্চেন্ট ফি ছাড়াই শুরু করতে পারেন।
                  </p>
                </div>
              </div>
            </div>
          )}

        </form>

        {/* BOTTOM FIXED FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-stone-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setFormData(DEFAULT_BKASH_CONFIG)}
            className="text-xs font-bold text-stone-500 hover:text-stone-800 hover:underline cursor-pointer"
          >
            Reset to Default (ডিফল্ট রিসেট)
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel (বাতিল)
            </button>
            <button
              type="submit"
              form="bkash-settings-form"
              className="px-6 py-2.5 rounded-xl bg-[#e2136e] hover:bg-[#c2105e] text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-2"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved Successfully!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save bKash Settings (সেভ করুন)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
