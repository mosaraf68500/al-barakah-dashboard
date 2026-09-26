'use client';

import { AlertTriangle, Check, CheckCircle, Database, Globe, HardDriveDownload, QrCode, Radio, RefreshCw, Settings, ShieldCheck, Sparkles, Star, Truck, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createBackup, restoreBackup, saveSettings } from '@/lib/api';
import { qk, useAuditLogs, useInvalidate, useProducts, useSettings } from '@/hooks/useAdminData';
import { DEFAULT_COURIER_CONFIG } from '@/lib/domain/constants';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { DEFAULT_BKASH_CONFIG, DEFAULT_FACEBOOK_PIXEL_CONFIG, DEFAULT_NOTIFICATION_CONFIG, DEFAULT_SEO_CONFIG } from '@/types';
import type { DeliveryConfig, OrderNotificationConfig, Product } from '@/types';
import type { AdminSettings, DatabaseBackupPayload } from '@/types/admin';
import { BKashSettingsModal } from './BKashSettingsModal';
import { CourierSettingsModal } from './CourierSettingsModal';
import { FacebookPixelSettingsModal } from './FacebookPixelSettingsModal';
import { NotificationSettingsCard } from './NotificationSettingsCard';
import { SeoSettingsModal } from './SeoSettingsModal';
import { QRCodeGeneratorModal } from '@/components/qr/QRCodeGeneratorModal';

export function SettingsTab() {
  const showToast = useToast();
  const invalidate = useInvalidate();
  const { isSuperAdmin } = useAdminAuth();
  const { data: settings } = useSettings();
  const bkashConfig = settings?.bkashConfig ?? DEFAULT_BKASH_CONFIG;
  const courierConfig = settings?.courierConfig ?? DEFAULT_COURIER_CONFIG;
  const seoConfig = settings?.seoConfig ?? DEFAULT_SEO_CONFIG;
  const facebookPixelConfig = settings?.facebookPixelConfig ?? DEFAULT_FACEBOOK_PIXEL_CONFIG;
  const notificationConfig = settings?.notificationConfig ?? DEFAULT_NOTIFICATION_CONFIG;
  const deliveryConfig = settings?.deliveryConfig;
  const enableCustomerReviews = settings?.enableCustomerReviews ?? true;

  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isPixelModalOpen, setIsPixelModalOpen] = useState(false);
  const [isBkashModalOpen, setIsBkashModalOpen] = useState(false);
  const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalProduct, setQrModalProduct] = useState<Product | null>(null);
  const { data: products = [] } = useProducts();

  // Store settings form (legacy kept storeName / supportPhone in local state only and never saved them - now persisted).
  const [storeName, setStoreName] = useState(settings?.storeName ?? 'Al Barakah Premium');
  const [supportPhone, setSupportPhone] = useState(settings?.supportPhone ?? '+880 1700-000000');
  const [insideDhakaDelivery, setInsideDhakaDelivery] = useState(deliveryConfig?.insideDhakaCharge ?? 80);
  const [outsideDhakaDelivery, setOutsideDhakaDelivery] = useState(deliveryConfig?.outsideDhakaCharge ?? 160);
  const [subDhakaDelivery, setSubDhakaDelivery] = useState(deliveryConfig?.subDhakaCharge ?? 100);
  const [isSubDhakaEnabled, setIsSubDhakaEnabled] = useState(deliveryConfig?.enableSubDhaka ?? false);
  const [isFreeDeliveryEnabled, setIsFreeDeliveryEnabled] = useState(deliveryConfig?.enableFreeDelivery ?? false);
  const [freeDeliveryThresholdAmount, setFreeDeliveryThresholdAmount] = useState(deliveryConfig?.freeDeliveryThreshold ?? 2000);
  const [estInsideDhakaText, setEstInsideDhakaText] = useState(deliveryConfig?.estimatedInsideDhakaDays ?? '১-২ কার্যদিবস');
  const [estOutsideDhakaText, setEstOutsideDhakaText] = useState(deliveryConfig?.estimatedOutsideDhakaDays ?? '২-৪ কার্যদিবস');
  const [deliveryNoticeStr, setDeliveryNoticeStr] = useState(deliveryConfig?.deliveryNotice ?? 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।');
  const [requireAdvanceDeliveryCharge, setRequireAdvanceDeliveryCharge] = useState(deliveryConfig?.requireAdvanceDeliveryCharge ?? true);
  const [advanceDeliveryNotice, setAdvanceDeliveryNotice] = useState(deliveryConfig?.advanceDeliveryNotice ?? 'ফেক অর্ডার ও অনাকাঙ্ক্ষিত রিটার্ন রোধে শুধুমাত্র ডেলিভারি চার্জ অগ্রিম বিকাশ করতে হবে।');

  // Adopt the saved values once (first load) without clobbering edits on later refetches.
  const hydrated = useRef(false);
  useEffect(() => {
    if (!settings || hydrated.current) return;
    hydrated.current = true;
    const d = settings.deliveryConfig;
    setStoreName(settings.storeName ?? 'Al Barakah Premium');
    setSupportPhone(settings.supportPhone ?? '+880 1700-000000');
    setInsideDhakaDelivery(d.insideDhakaCharge ?? 80);
    setOutsideDhakaDelivery(d.outsideDhakaCharge ?? 160);
    setSubDhakaDelivery(d.subDhakaCharge ?? 100);
    setIsSubDhakaEnabled(d.enableSubDhaka ?? false);
    setIsFreeDeliveryEnabled(d.enableFreeDelivery ?? false);
    setFreeDeliveryThresholdAmount(d.freeDeliveryThreshold ?? 2000);
    setEstInsideDhakaText(d.estimatedInsideDhakaDays ?? '১-২ কার্যদিবস');
    setEstOutsideDhakaText(d.estimatedOutsideDhakaDays ?? '২-৪ কার্যদিবস');
    setDeliveryNoticeStr(d.deliveryNotice ?? 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।');
    setRequireAdvanceDeliveryCharge(d.requireAdvanceDeliveryCharge ?? true);
    setAdvanceDeliveryNotice(d.advanceDeliveryNotice ?? '');
  }, [settings]);

  const save = async (partial: Partial<AdminSettings>) => {
    await saveSettings(partial);
    await invalidate(qk.settings);
  };

  const handleSaveDeliverySettings = async () => {
    const updated: DeliveryConfig = {
      insideDhakaCharge: Number(insideDhakaDelivery) || 0,
      outsideDhakaCharge: Number(outsideDhakaDelivery) || 0,
      subDhakaCharge: Number(subDhakaDelivery) || 0,
      enableSubDhaka: Boolean(isSubDhakaEnabled),
      freeDeliveryThreshold: Number(freeDeliveryThresholdAmount) || 0,
      enableFreeDelivery: Boolean(isFreeDeliveryEnabled),
      estimatedInsideDhakaDays: estInsideDhakaText.trim(),
      estimatedOutsideDhakaDays: estOutsideDhakaText.trim(),
      deliveryNotice: deliveryNoticeStr.trim(),
      requireAdvanceDeliveryCharge: Boolean(requireAdvanceDeliveryCharge),
      advanceDeliveryNotice: advanceDeliveryNotice.trim(),
    };
    await save({ deliveryConfig: updated, storeName: storeName.trim(), supportPhone: supportPhone.trim() });
    showToast('✅ ডেলিভারি চার্জ ও অগ্রিম পেমেন্ট পলিসি সফলভাবে সেভ হয়েছে!');
  };

  const onToggleCustomerReviews = async (enabled: boolean) => {
    await save({ enableCustomerReviews: enabled });
    showToast(enabled ? '✅ কাস্টমার রিভিউ সিস্টেম চালু করা হয়েছে' : '🚫 কাস্টমার রিভিউ সিস্টেম বন্ধ করা হয়েছে');
  };
  const onUpdateNotificationConfig = async (cfg: OrderNotificationConfig) => save({ notificationConfig: cfg });

  // ---- audit log viewer (super_admin)
  const [auditRequested, setAuditRequested] = useState(false);
  const audit = useAuditLogs(isSuperAdmin && auditRequested);
  const auditLogs = audit.data ?? [];
  const isLoadingAuditLogs = audit.isFetching;
  const handleLoadAuditLogs = () => {
    if (!auditRequested) setAuditRequested(true);
    else void audit.refetch();
  };

  // ---- backup / restore
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [restoreProgressMsg, setRestoreProgressMsg] = useState<string | null>(null);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<DatabaseBackupPayload | null>(null);

  const handleDownloadFullBackup = async () => {
    try {
      setIsExportingBackup(true);
      const backupData = await createBackup();
      const anchor = document.createElement('a');
      anchor.setAttribute('href', `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`);
      anchor.setAttribute('download', `albarakah_db_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      showToast('সম্পূর্ণ ডাটাবেস ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!');
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleFileUploadForRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as DatabaseBackupPayload;
        if (!parsed || !parsed.data) {
          showToast('ভুল ফরম্যাটের ব্যাকআপ ফাইল। দয়া করে সঠিক JSON ব্যাকআপ ফাইল নির্বাচন করুন।', 'error');
          return;
        }
        setPendingRestoreData(parsed);
        setShowRestoreConfirmModal(true);
      } catch {
        showToast('ফাইলটি সঠিক JSON ফরম্যাটে নেই।', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreData) return;
    try {
      setIsRestoringBackup(true);
      setRestoreProgressMsg('রিস্টোর শুরু হচ্ছে...');
      const res = await restoreBackup(pendingRestoreData);
      setShowRestoreConfirmModal(false);
      setPendingRestoreData(null);
      await invalidate(qk.products, qk.categories, qk.orders, qk.reviews, qk.settings);
      showToast(`ডাটাবেস সফলভাবে রিস্টোর হয়েছে! (${res.counts.products} প্রোডাক্ট, ${res.counts.orders} অর্ডার, ${res.counts.categories} ক্যাটাগরি)`);
    } finally {
      setIsRestoringBackup(false);
      setRestoreProgressMsg(null);
    }
  };

  return (
<>
          <div className="p-6 sm:p-8 space-y-6 w-full">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">Store Configuration & Logistics</h3>
                  <p className="text-xs text-stone-500">স্টোরের সাধারণ তথ্য, ডেলিভারি চার্জ ও ব্যাকআপ সেটিংস পরিবর্তন করুন</p>
                </div>
                <button
                  onClick={handleSaveDeliverySettings}
                  className="px-5 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* 1. General Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider text-stone-600">General Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700">Store Title</label>
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-hidden focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-700">Support Hotline Phone</label>
                      <input
                        type="text"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-hidden focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Delivery Charge & Shipping Rules (Customizable) */}
                <div className="pt-4 border-t border-stone-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#0a5c36]" />
                        <span>Delivery Charges & Shipping Rules (ডেলিভারি চার্জ সেটিংস)</span>
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        চেকআউট পেজে গ্রাহকদের জন্য এরিয়া ভিত্তিক ডেলিভারি চার্জ ও ফ্রি ডেলিভারি সীমা নির্ধারণ করুন
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      Live Dynamic
                    </span>
                  </div>

                  {/* Core Rates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                      <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                        <span>Inside Dhaka Delivery (৳)</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">ঢাকা সিটির ভিতরে</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={insideDhakaDelivery}
                          onChange={(e) => setInsideDhakaDelivery(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-hidden focus:border-emerald-600"
                        />
                        <span className="absolute right-3 top-2 text-xs font-bold text-stone-400">৳</span>
                      </div>
                      <input
                        type="text"
                        placeholder="আনুমানিক সময় (যেমন: ১-২ কার্যদিবস)"
                        value={estInsideDhakaText}
                        onChange={(e) => setEstInsideDhakaText(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-[11px] text-stone-700 focus:outline-hidden"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                      <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                        <span>Outside Dhaka Delivery (৳)</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">ঢাকা সিটির বাইরে</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={outsideDhakaDelivery}
                          onChange={(e) => setOutsideDhakaDelivery(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-hidden focus:border-emerald-600"
                        />
                        <span className="absolute right-3 top-2 text-xs font-bold text-stone-400">৳</span>
                      </div>
                      <input
                        type="text"
                        placeholder="আনুমানিক সময় (যেমন: ২-৪ কার্যদিবস)"
                        value={estOutsideDhakaText}
                        onChange={(e) => setEstOutsideDhakaText(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-[11px] text-stone-700 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Dhaka Suburb Option */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-stone-800">
                          Dhaka Suburb / উপশহর জোন (সাভার, গাজীপুর, কেরানীগঞ্জ)
                        </p>
                        <p className="text-[11px] text-stone-500">
                          ঢাকা পার্শ্ববর্তী অঞ্চলের জন্য আলাদা বিশেষ ডেলিভারি চার্জ সক্রিয় করুন
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSubDhakaEnabled(!isSubDhakaEnabled)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSubDhakaEnabled ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {isSubDhakaEnabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    {isSubDhakaEnabled && (
                      <div className="pt-2 flex items-center gap-3">
                        <label className="text-xs font-bold text-stone-700 whitespace-nowrap">Suburb Charge (৳):</label>
                        <input
                          type="number"
                          min="0"
                          value={subDhakaDelivery}
                          onChange={(e) => setSubDhakaDelivery(Number(e.target.value))}
                          className="w-32 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-hidden focus:border-emerald-600"
                        />
                      </div>
                    )}
                  </div>

                  {/* Free Delivery Threshold */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Free Delivery Promotion (ফ্রি ডেলিভারি অফার)</span>
                        </p>
                        <p className="text-[11px] text-stone-600">
                          নির্দিষ্ট টাকার বেশি কেনাকাটা করলে গ্রাহককে স্বয়ংক্রিয় ফ্রি ডেলিভারি প্রদান করুন
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFreeDeliveryEnabled(!isFreeDeliveryEnabled)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isFreeDeliveryEnabled ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {isFreeDeliveryEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {isFreeDeliveryEnabled && (
                      <div className="pt-2 flex items-center gap-3">
                        <label className="text-xs font-bold text-emerald-950 whitespace-nowrap">
                          ন্যূনতম অর্ডার মূল্য (৳):
                        </label>
                        <input
                          type="number"
                          min="100"
                          value={freeDeliveryThresholdAmount}
                          onChange={(e) => setFreeDeliveryThresholdAmount(Number(e.target.value))}
                          className="w-36 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-stone-900 focus:outline-hidden"
                        />
                        <span className="text-[11px] text-stone-600">বা তার বেশি অর্ডারে ডেলিভারি চার্জ ০ টাকা হবে</span>
                      </div>
                    )}
                  </div>

                  {/* Checkout Notice */}
                  <div>
                    <label className="text-xs font-bold text-stone-700">Checkout Delivery Notice (গ্রাহকের জন্য মেসেজ)</label>
                    <input
                      type="text"
                      value={deliveryNoticeStr}
                      onChange={(e) => setDeliveryNoticeStr(e.target.value)}
                      placeholder="যেমন: সারা বাংলাদেশে দ্রুততম সময়ে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-hidden focus:border-emerald-600 text-stone-800"
                    />
                  </div>

                  {/* Advance Delivery Charge & Fake Order Prevention */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50/70 to-amber-50/50 border border-pink-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#e2136e]" />
                          <span>Advance Delivery Charge Requirement (অগ্রিম ডেলিভারি চার্জ মোড)</span>
                        </label>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          ফেক অর্ডার ও অনাকাঙ্ক্ষিত কুরিয়ার রিটার্ন রোধ করতে ক্যাশ অন ডেলিভারিতে শুধুমাত্র ডেলিভারি চার্জ অগ্রিম বিকাশে গ্রহণ করুন।
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRequireAdvanceDeliveryCharge(!requireAdvanceDeliveryCharge)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          requireAdvanceDeliveryCharge
                            ? 'bg-[#e2136e] text-white shadow-xs'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {requireAdvanceDeliveryCharge ? 'বাধ্যতামূলক (ON)' : 'ঐচ্ছিক (OFF)'}
                      </button>
                    </div>

                    {requireAdvanceDeliveryCharge && (
                      <div className="pt-2 border-t border-pink-200/60 space-y-2">
                        <label className="text-[11px] font-bold text-stone-800">
                          গ্রাহকের জন্য অগ্রিম পেমেন্ট নির্দেশনা মেসেজ:
                        </label>
                        <input
                          type="text"
                          value={advanceDeliveryNotice}
                          onChange={(e) => setAdvanceDeliveryNotice(e.target.value)}
                          placeholder="ফেক অর্ডার ও রিটার্ন রোধে শুধুমাত্র ডেলিভারি চার্জ অগ্রিম বিকাশ করতে হবে।"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-pink-200 text-xs font-medium focus:outline-hidden focus:border-[#e2136e] text-stone-900"
                        />
                        <p className="text-[10px] text-pink-800 font-medium">
                          💡 পরামর্শ: গ্রাহক মোট বিলের সাথে স্পষ্ট দেখতে পাবেন "অগ্রিম প্রদেয়: ৳{insideDhakaDelivery}/৳{outsideDhakaDelivery}" এবং "ক্যাশ অন ডেলিভারি: ৳বাকি টাকা"।
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Customer Reviews Toggle */}
                <div className="pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        Customer Reviews & Rating System
                      </label>
                      <p className="text-[11px] text-stone-500">
                        Enable or disable product reviews and customer star ratings across all product pages.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onToggleCustomerReviews) {
                          onToggleCustomerReviews(!enableCustomerReviews);
                        }
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        enableCustomerReviews
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {enableCustomerReviews ? 'ON (সক্রিয়)' : 'OFF (বন্ধ)'}
                    </button>
                  </div>
                </div>

                {/* bKash Payment & PGW API Card */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="p-4 bg-pink-50/60 rounded-2xl border border-pink-200/80 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[#e2136e] text-white flex items-center justify-center font-bold text-xs">
                          ৳
                        </div>
                        <span className="text-xs font-bold text-stone-900">
                          bKash Payment Gateway & Personal Number Settings
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600">
                        পার্সোনাল বিকাশ নম্বর (<strong className="font-mono text-[#e2136e]">{bkashConfig.personalNumber}</strong>) বা ভবিষ্যৎ অফিসিয়াল bKash PGW API Credentials কনফিগার করুন
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bkashConfig.enabled ? 'bg-pink-100 text-[#e2136e] border border-pink-200' : 'bg-stone-200 text-stone-600'
                        }`}>
                          Status: {bkashConfig.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-stone-700 border border-stone-200">
                          Mode: {bkashConfig.mode === 'GATEWAY' ? 'API Gateway' : `Manual (${bkashConfig.accountType})`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsBkashModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#e2136e] hover:bg-[#c2105e] text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configure bKash</span>
                    </button>
                  </div>
                </div>

                {/* Courier Settings Card in Store Settings */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#0a5c36]" />
                        <span className="text-xs font-bold text-stone-900">
                          One-Click Courier Integration (Steadfast & Pathao)
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600">
                        API Credentials, Auto-dispatch rules এবং Courier Portal সেটিংস কনফিগার করুন
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          courierConfig.steadfast.enabled ? 'bg-emerald-200 text-emerald-950' : 'bg-stone-200 text-stone-600'
                        }`}>
                          Steadfast: {courierConfig.steadfast.enabled ? 'Active' : 'Disabled'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          courierConfig.pathao.enabled ? 'bg-red-200 text-red-950' : 'bg-stone-200 text-stone-600'
                        }`}>
                          Pathao: {courierConfig.pathao.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCourierModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configure API</span>
                    </button>
                  </div>
                </div>

                {/* Global SEO & Social Sharing Management Card */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-amber-500/10 rounded-2xl border border-emerald-300/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-emerald-800" />
                          <span className="text-xs font-bold text-stone-900">
                            Global SEO, Meta Description & Social Share Banners (গ্লোবাল এসইও ও সোশ্যাল শেয়ার)
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-stone-950 uppercase">
                            Dynamic
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          গুগল সার্চ ও ফেসবুক/হোয়াটসঅ্যাপে লিংক শেয়ারিং ব্যানার, ব্রাউজার টাইটেল এবং মেটা ডেসক্রিপশন ডাইনামিকভাবে পরিবর্তন করুন কোনো কোড এডিট ছাড়াই।
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-stone-700 border border-stone-200 truncate max-w-xs">
                            Title: {seoConfig?.metaTitle || 'Al Barakah Premium'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                            {seoConfig?.ogImage ? '✓ Custom Social Banner' : 'Default Banner'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsSeoModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0a5c36] to-[#08482a] hover:from-[#08482a] hover:to-[#053828] text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-2 shrink-0"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>SEO & Share Studio</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Facebook Pixel & CAPI Settings Card */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 rounded-2xl border border-blue-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-blue-700" />
                          <span className="text-xs font-bold text-stone-900">
                            Facebook Pixel, Conversions API (CAPI) & Domain Verification
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            facebookPixelConfig.pixelId ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-stone-200 text-stone-600'
                          }`}>
                            {facebookPixelConfig.pixelId ? 'Active' : 'Not Configured'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          বিজ্ঞাপন অপটিমাইজেশন, অ্যাড ইভেন্ট ট্র্যাকিং (Purchase, AddToCart, PageView) ও মেটা বিজনেস ডোমেন ভেরিফিকেশন কোড কনফিগার করুন।
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-stone-700 border border-stone-200">
                            Pixel ID: {facebookPixelConfig.pixelId || 'None'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            facebookPixelConfig.enableCapi ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}>
                            CAPI: {facebookPixelConfig.enableCapi ? 'Enabled' : 'Off'}
                          </span>
                          {facebookPixelConfig.domainVerificationCode && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              ✓ Domain Verified
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPixelModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-2 shrink-0"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Pixel & CAPI Settings</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-time Order Notification & Alerts Card */}
                <NotificationSettingsCard
                  notificationConfig={notificationConfig}
                  onUpdateNotificationConfig={onUpdateNotificationConfig}
                  showToast={showToast}
                />

                {/* Database Backup & Disaster Recovery Card */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="p-4 sm:p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-800" />
                          <span className="text-xs font-bold text-stone-900">
                            Database Backup & Disaster Recovery (ডাটাবেস ব্যাকআপ ও রিস্টোর)
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          এক ক্লিকে সম্পূর্ণ স্টোরের ডাটা (Products, Orders, Categories, Reviews, Settings) অফলাইনে ডাউনলোড করে সংরক্ষণ করুন অথবা ব্যাকআপ ফাইল থেকে রিস্টোর করুন।
                        </p>
                        <p className="text-[11px] text-rose-700 font-semibold leading-relaxed">
                          ⚠️ সতর্কতা: ব্যাকআপ ফাইলে গ্রাহকদের ব্যক্তিগত তথ্য (নাম, ফোন, ঠিকানা) এবং API সিক্রেট/টোকেন থাকে। ফাইলটি পাসওয়ার্ডের মতো গোপনে রাখুন এবং কারো সাথে শেয়ার করবেন না।
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {/* Export / Download Backup Button */}
                      <button
                        type="button"
                        disabled={isExportingBackup}
                        onClick={handleDownloadFullBackup}
                        className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isExportingBackup ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Exporting Backup...</span>
                          </>
                        ) : (
                          <>
                            <HardDriveDownload className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Download Full Backup (JSON)</span>
                          </>
                        )}
                      </button>

                      {/* Restore From File Input Button */}
                      <label className="px-4 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5 text-stone-600" />
                        <span>Restore From Backup File</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleFileUploadForRestore}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="text-[10px] text-stone-500 bg-white p-2.5 rounded-xl border border-stone-200/80 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0a5c36] shrink-0" />
                      <span>ব্যাকআপ নেওয়া ফাইলটি যেকোনো সময় রিস্টোর করে পূর্বের সমস্ত ডেটা ফিরিয়ে আনা যাবে।</span>
                    </div>
                  </div>
                </div>

                {/* QR Code & Bottle Authenticity Stickers Card */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 rounded-2xl border border-amber-300/60 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-amber-800" />
                          <span className="text-xs font-bold text-stone-900">
                            QR Code & Bottle Authenticity Stickers (আল-বারাকাহ ব্রান্ডিং কিউআর ও স্টিকার জেনারেটর)
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          আপনার কাস্টম ডোমেইন <strong className="text-amber-900">https://albarakahpremium.com</strong> এবং খাঁটি সরিষার তেলের বোতলের জন্য হাই-রেজোলিউশন কিউআর কোড ও প্রিন্ট-রেডি বোতল স্টিকার তৈরি করে সরাসরি ডাউনলোড (PNG/SVG) করুন।
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setQrModalProduct(null);
                          setIsQrModalOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-2 shrink-0"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Open QR Studio</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5. Security audit log viewer (super_admin only) */}
                {isSuperAdmin && (
                  <div className="pt-4 border-t border-stone-200 space-y-4">
                    {/* Security Audit Logs Viewer */}
                    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <span className="text-xs font-bold text-stone-900">
                              সুপার অ্যাডমিন সিকিউরিটি অডিট লগ (Security Audit Logs)
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            অ্যাডমিন প্যানেলে যেকোনো লগইন বা গুরুত্বপূর্ণ কার্যক্রমের হিস্ট্রি ও অডিট ট্রেইল।
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleLoadAuditLogs}
                          disabled={isLoadingAuditLogs}
                          className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAuditLogs ? 'animate-spin text-emerald-600' : 'text-stone-600'}`} />
                          <span>{isLoadingAuditLogs ? 'লোড হচ্ছে...' : 'অডিট লগ দেখুন'}</span>
                        </button>
                      </div>

                      {auditLogs.length > 0 && (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-left text-xs border border-stone-200 rounded-xl overflow-hidden">
                            <thead className="bg-stone-100 text-stone-700 font-bold">
                              <tr>
                                <th className="p-2.5">অ্যাকশন</th>
                                <th className="p-2.5">অ্যাডমিন</th>
                                <th className="p-2.5">স্ট্যাটাস</th>
                                <th className="p-2.5">তারিখ ও সময়</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                              {auditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-stone-50">
                                  <td className="p-2.5 font-medium text-stone-900">{log.action}</td>
                                  <td className="p-2.5 font-mono text-[11px] text-stone-600">{log.adminEmail}</td>
                                  <td className="p-2.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-[11px] text-stone-500">
                                    {new Date(log.timestamp).toLocaleString('bn-BD')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-3">
                  <button
                    onClick={handleSaveDeliverySettings}
                    className="px-6 py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Save All Store & Delivery Settings</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

      {showRestoreConfirmModal && pendingRestoreData && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-stone-900 font-serif">
                  ডাটাবেস রিস্টোর নিশ্চিতকরণ (Confirm Restore)
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  আপনি কি নির্বাচিত ব্যাকআপ ফাইলটি রিস্টোর করতে চান? এই ফাইলের ডাটা দিয়ে ডাটাবেস আপডেট ও সিঙ্ক হবে।
                </p>
              </div>

              {/* Backup Summary details */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">ব্যাকআপ তারিখ:</span>
                  <span className="font-bold text-stone-800">
                    {pendingRestoreData.backupDate ? new Date(pendingRestoreData.backupDate).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">প্রোডাক্ট সংখ্যা:</span>
                  <span className="font-bold text-stone-800">{pendingRestoreData.data.products?.length || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">ক্যাটাগরি সংখ্যা:</span>
                  <span className="font-bold text-stone-800">{pendingRestoreData.data.categories?.length || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">অর্ডার রেকর্ড:</span>
                  <span className="font-bold text-stone-800">{pendingRestoreData.data.orders?.length || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">রিভিউ সংখ্যা:</span>
                  <span className="font-bold text-stone-800">{pendingRestoreData.data.reviews?.length || 0} টি</span>
                </div>
              </div>

              {restoreProgressMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0a5c36]" />
                  <span>{restoreProgressMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isRestoringBackup}
                  onClick={() => {
                    setShowRestoreConfirmModal(false);
                    setPendingRestoreData(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  disabled={isRestoringBackup}
                  onClick={handleConfirmRestore}
                  className="px-5 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isRestoringBackup ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>রিস্টোর হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>হ্যাঁ, রিস্টোর করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCourierModalOpen && (
      <CourierSettingsModal
        isOpen
        onClose={() => setIsCourierModalOpen(false)}
        config={courierConfig}
        onSave={async (newCfg) => {
          await save({ courierConfig: newCfg });
          setIsCourierModalOpen(false);
          showToast('Courier API credentials saved successfully!');
        }}
      />
      )}
      {isPixelModalOpen && (
      <FacebookPixelSettingsModal
        isOpen
        onClose={() => setIsPixelModalOpen(false)}
        config={facebookPixelConfig}
        onSaveConfig={async (cfg) => {
          await save({ facebookPixelConfig: cfg });
          showToast('Facebook Pixel & CAPI settings saved successfully!');
        }}
      />
      )}
      {isBkashModalOpen && (
      <BKashSettingsModal
        isOpen
        onClose={() => setIsBkashModalOpen(false)}
        config={bkashConfig}
        onSaveConfig={async (cfg) => {
          await save({ bkashConfig: cfg });
          showToast('bKash Payment settings saved successfully!');
        }}
      />
      )}
      {isSeoModalOpen && (
      <SeoSettingsModal
        isOpen
        onClose={() => setIsSeoModalOpen(false)}
        seoConfig={seoConfig}
        onSave={async (cfg) => {
          await save({ seoConfig: cfg });
          showToast('গ্লোবাল এসইও ও মেটা সেটিংস সফলভাবে সেভ হয়েছে!');
        }}
      />
      )}
      <QRCodeGeneratorModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        products={products}
        defaultProduct={qrModalProduct}
        customDomain={seoConfig.canonicalUrl || 'https://albarakahpremium.com'}
      />
    </>
  );
}
