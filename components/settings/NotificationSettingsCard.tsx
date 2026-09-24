'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Send,
  CheckCircle,
  AlertCircle,
  Play,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { OrderNotificationConfig, DEFAULT_NOTIFICATION_CONFIG } from '@/types';
import { playOrderAlertSound, requestBrowserNotificationPermission } from '@/lib/audioAlert';
import { testTelegram } from '@/lib/api/settings';
import { SecretInput } from '@/components/shared/SecretInput';

interface NotificationSettingsCardProps {
  notificationConfig?: OrderNotificationConfig;
  onUpdateNotificationConfig?: (config: OrderNotificationConfig) => Promise<void> | void;
  showToast?: (message: string) => void;
}

export const NotificationSettingsCard: React.FC<NotificationSettingsCardProps> = ({
  notificationConfig = DEFAULT_NOTIFICATION_CONFIG,
  onUpdateNotificationConfig,
  showToast
}) => {
  const [config, setConfig] = useState<OrderNotificationConfig>(notificationConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<string>('default');
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestFeedback, setTelegramTestFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    setConfig(notificationConfig);
  }, [notificationConfig]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const handleSoundToggle = (enabled: boolean) => {
    const updated = { ...config, soundEnabled: enabled };
    setConfig(updated);
    if (enabled) {
      playOrderAlertSound(updated.soundType || 'cash');
    }
  };

  const handleSoundTypeChange = (type: 'cash' | 'chime' | 'bell') => {
    const updated = { ...config, soundType: type };
    setConfig(updated);
    playOrderAlertSound(type);
  };

  const handleTestSound = () => {
    playOrderAlertSound(config.soundType || 'cash');
    if (showToast) showToast(`🔊 সাউন্ড টেস্ট চালানো হয়েছে (${config.soundType || 'cash'})`);
  };

  const handleRequestBrowserPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      setConfig((prev) => ({ ...prev, browserPushEnabled: true }));
      if (showToast) showToast('✅ ব্রাউজার নোটিফিকেশন পারমিশন সক্রিয় হয়েছে!');
    } else {
      if (showToast) showToast('⚠️ ব্রাউজার নোটিফিকেশন পারমিশন দেওয়া হয়নি');
    }
  };

  const handleTelegramToggle = (enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      telegram: {
        ...prev.telegram,
        enabled,
      },
    }));
  };

  const handleTestTelegram = async () => {
    const token = config.telegram?.botToken?.trim();
    const chat = config.telegram?.chatId?.trim();

    if (!token || !chat) {
      setTelegramTestFeedback({
        type: 'error',
        message: 'অনুগ্রহ করে Telegram Bot Token এবং Chat ID উভয় তথ্যই পূরণ করুন!',
      });
      return;
    }

    setIsTestingTelegram(true);
    setTelegramTestFeedback(null);

    // SIMULATED by default: the server only contacts Telegram when ENABLE_LIVE_INTEGRATIONS=true.
    const raw = await testTelegram(token, chat).catch((e: Error) => ({ success: false, simulated: false, message: e.message }));
    const res = { success: raw.success, message: raw.message, error: raw.success ? undefined : raw.message };
    setIsTestingTelegram(false);

    if (res.success) {
      setTelegramTestFeedback({
        type: 'success',
        message: res.message || 'টেস্ট মেসেজ আপনার টেলিগ্রামে পাঠানো হয়েছে! অনুগ্রহ করে অ্যাপ চেক করুন।',
      });
      if (showToast) showToast('🎉 টেলিগ্রাম টেস্ট মেসেজ সফলভাবে পাঠানো হয়েছে!');
    } else {
      setTelegramTestFeedback({
        type: 'error',
        message: res.error || 'টেলিগ্রাম সার্ভারের সাথে সংযোগ করা যায়নি। টোকেন ও চ্যাট আইডি যাচাই করুন।',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onUpdateNotificationConfig) {
        await onUpdateNotificationConfig(config);
      }
      if (showToast) showToast('✅ অর্ডার নোটিফিকেশন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      if (showToast) showToast('সেটিংস সেভ করতে সমস্যা হয়েছে: ' + (err.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pt-4 border-t border-stone-200">
      <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 rounded-2xl border border-amber-300/80 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-stone-900">
                রিয়েল-টাইম অর্ডার নোটিফিকেশন ও অ্যালার্ট (Real-Time Order Alerts)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                Instant
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed max-w-2xl">
              ওয়েবসাইটে নতুন কোনো অর্ডার আসামাত্রই অ্যাডমিন ড্যাশবোর্ডে মিষ্টি সাউন্ড অ্যালার্ট বাজবে, ব্রাউজারে পপআপ আসবে এবং আপনার মোবাইল টেলিগ্রাম অ্যাপে তৎক্ষণাৎ কাস্টমারের বিবরণসহ মেসেজ চলে যাবে।
            </p>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>সেটিংস সেভ করুন</span>
              </>
            )}
          </button>
        </div>

        {/* 3 Notification Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Pillar 1: Admin Dashboard Sound */}
          <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${config.soundEnabled ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-400'}`}>
                  {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">ড্যাশবোর্ড সাউন্ড অ্যালার্ট</h4>
                  <p className="text-[10px] text-stone-500">নতুন অর্ডার আসলে অডিও রিং বাজবে</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSoundToggle(!config.soundEnabled)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  config.soundEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {config.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Sound Style Picker */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-semibold text-stone-700">সাউন্ডের ধরন (Tone Selection):</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: '💵 কা-চিং (Cash)', desc: 'ক্যাশ রেজিস্টার' },
                  { id: 'chime', label: '🔔 ক্রিস্টাল চাইম', desc: 'মিষ্টি বেল' },
                  { id: 'bell', label: '🛎️ কাউন্টার বেল', desc: 'সার্ভিস রিং' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSoundTypeChange(s.id as any)}
                    className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                      config.soundType === s.id
                        ? 'bg-amber-50/80 border-amber-400 text-amber-950 font-bold shadow-2xs'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700 text-xs'
                    }`}
                  >
                    <div className="text-[11px] truncate">{s.label}</div>
                    <div className="text-[9px] text-stone-400 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-3 h-3 text-amber-600 fill-amber-600" />
                  <span>সাউন্ড শুনুন (Test)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pillar 2: Browser Push Notifications */}
          <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${config.browserPushEnabled ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-400'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">ব্রাউজার পুশ নোটিফিকেশন</h4>
                  <p className="text-[10px] text-stone-500">ট্যাব ব্যাকগ্রাউন্ডে থাকলেও স্ক্রিনে পপআপ আসবে</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, browserPushEnabled: !config.browserPushEnabled })}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  config.browserPushEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {config.browserPushEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-stone-600">ব্রাউজার পারমিশন স্ট্যাটাস:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    browserPermission === 'granted'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : browserPermission === 'denied'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {browserPermission === 'granted'
                    ? 'অনুমোদিত (Granted)'
                    : browserPermission === 'denied'
                    ? 'নিষিদ্ধ (Denied)'
                    : 'অনুমতি প্রয়োজন (Default)'}
                </span>
              </div>

              {browserPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestBrowserPermission}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ব্রাউজার নোটিফিকেশন চালু করুন (Allow)</span>
                </button>
              )}

              <p className="text-[10px] text-stone-500 leading-normal pt-1">
                💡 নোট: এটি সক্রিয় থাকলে আপনি অন্য ব্রাউজার ট্যাবে কাজ করলেও কম্পিউটারের কোণায় নতুন অর্ডারের নোটিফিকেশন ভেসে উঠবে।
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 3: Telegram Mobile Instant Notification */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-sky-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-xs">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900">
                    টেলিগ্রাম ইনস্ট্যান্ট নোটিফিকেশন (Telegram Mobile Alert)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                    ১০০% ফ্রি
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  ওয়েবসাইটে অর্ডার হলে তৎক্ষণাৎ আপনার মোবাইল Telegram অ্যাপে নোটিফিকেশন ও সাউন্ড বেজে উঠবে
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTelegramToggle(!config.telegram?.enabled)}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                config.telegram?.enabled
                  ? 'bg-sky-600 text-white'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              {config.telegram?.enabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Disabled)'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Bot Token */}
            <div>
              <label className="text-[11px] font-bold text-stone-800 flex items-center justify-between">
                <span>Telegram Bot Token:</span>
                <span className="text-[10px] text-sky-700 font-normal">@BotFather থেকে নেওয়া</span>
              </label>
              <SecretInput
                value={config.telegram?.botToken || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    telegram: { ...config.telegram, botToken: e.target.value },
                  })
                }
                placeholder="e.g. 7123456789:AAHk..._xyz123"
                className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-900 focus:outline-hidden focus:border-sky-500"
              />
            </div>

            {/* Chat ID */}
            <div>
              <label className="text-[11px] font-bold text-stone-800 flex items-center justify-between">
                <span>Telegram Chat ID / Group ID:</span>
                <span className="text-[10px] text-sky-700 font-normal">@userinfobot দিয়ে দেখা যায়</span>
              </label>
              <input
                type="text"
                value={config.telegram?.chatId || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    telegram: { ...config.telegram, chatId: e.target.value },
                  })
                }
                placeholder="e.g. 123456789 বা গ্রুপের জন্য -100..."
                className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-900 focus:outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          {/* Helper Instructions & Test Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
            <div className="text-[11px] text-stone-500 space-y-0.5">
              <p>
                💡 <strong>টেলিগ্রাম বট তৈরির সহজ উপায়:</strong> Telegram-এ গিয়ে <code className="text-sky-700 font-bold">@BotFather</code> সার্চ করে <code>/newbot</code> লিখে নির্দেশ অনুসরণ করলেই ১ মিনিটে ফ্রি বট টোকেন পাওয়া যায়।
              </p>
              <p>
                বট বানানোর পর আপনার বটের লিংকে ঢুকে একবার <strong>/start</strong> চাপবেন, যেন বট আপনাকে মেসেজ পাঠাতে পারে।
              </p>
            </div>

            <button
              type="button"
              disabled={isTestingTelegram || !config.telegram?.botToken || !config.telegram?.chatId}
              onClick={handleTestTelegram}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 disabled:opacity-40 cursor-pointer"
            >
              {isTestingTelegram ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>টেস্ট মেসেজ পাঠান</span>
                </>
              )}
            </button>
          </div>

          {/* Test Feedback */}
          {telegramTestFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                telegramTestFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {telegramTestFeedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{telegramTestFeedback.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
