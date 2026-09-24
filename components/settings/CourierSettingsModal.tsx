'use client';

import React, { useState } from 'react';
import { Truck, Check, X, Shield, Key, Lock, Globe, Store, RefreshCw, ExternalLink, HelpCircle } from 'lucide-react';
import { SecretInput } from '@/components/shared/SecretInput';
import { CourierConfig } from '@/types';

interface CourierSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CourierConfig;
  onSave: (newConfig: CourierConfig) => void;
}

export const CourierSettingsModal: React.FC<CourierSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'steadfast' | 'pathao' | 'general'>('steadfast');
  const [formData, setFormData] = useState<CourierConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[94vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
        
        {/* Header (Fixed Top) */}
        <div className="px-5 sm:px-7 py-4.5 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0a5c36]/10 text-[#0a5c36] flex items-center justify-center font-bold shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-900 font-serif leading-tight">
                Courier Integration Settings (কুরিয়ার এপিআই সেটিংস)
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                Steadfast & Pathao One-Click Automated Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Fixed under header) */}
        <div className="px-5 sm:px-7 pt-4 pb-2 shrink-0 bg-white">
          <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200">
            <button
              type="button"
              onClick={() => setActiveTab('steadfast')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'steadfast'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Steadfast</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pathao')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'pathao'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Pathao</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>General Rules</span>
            </button>
          </div>
        </div>

        {/* Form Body (Scrollable Middle Section) */}
        <form id="courier-settings-form" onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 sm:px-7 py-3 space-y-4">
          
          {/* STEADFAST TAB */}
          {activeTab === 'steadfast' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-950">Steadfast Courier Automation</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 text-[10px] font-black uppercase">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    স্ট্যাডফাস্ট মার্চেন্ট প্যানেল থেকে <strong>API Key</strong> এবং <strong>Secret Key</strong> কপি করে নিচের বক্সে দিন।
                  </p>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-emerald-950 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.steadfast.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        steadfast: { ...formData.steadfast, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                  <span>Enable</span>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-stone-400" />
                    <span>Steadfast API Key</span>
                  </label>
                  <SecretInput
                    value={formData.steadfast.apiKey}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        steadfast: { ...formData.steadfast, apiKey: e.target.value },
                      })
                    }
                    placeholder="e.g. stdf_apikey_xxxxxxxxxxxx"
                    className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Steadfast Secret Key</span>
                  </label>
                  <SecretInput
                    value={formData.steadfast.secretKey}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        steadfast: { ...formData.steadfast, secretKey: e.target.value },
                      })
                    }
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-stone-400" />
                    <span>Base API Endpoint</span>
                  </label>
                  <input
                    type="text"
                    value={formData.steadfast.baseUrl || 'https://portal.steadfast.com.bd'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        steadfast: { ...formData.steadfast, baseUrl: e.target.value },
                      })
                    }
                    className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-600 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PATHAO TAB */}
          {activeTab === 'pathao' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-red-50/70 border border-red-200/80 rounded-2xl flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-950">Pathao Courier Automation</span>
                  </div>
                  <p className="text-[11px] text-red-800 leading-relaxed">
                    পাঠাও মার্চেন্ট ডেভেলপার পোর্টাল থেকে সংগৃহীত ক্লায়েন্ট আইডি, সিক্রেট ও ইউজারনেম নিচে প্রদান করুন।
                  </p>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-red-950 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.pathao.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pathao: { ...formData.pathao, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-red-600 cursor-pointer"
                  />
                  <span>Enable</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700">Pathao Client ID</label>
                  <input
                    type="text"
                    value={formData.pathao.clientId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pathao: { ...formData.pathao, clientId: e.target.value },
                      })
                    }
                    placeholder="e.g. 1024"
                    className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700">Client Secret</label>
                  <SecretInput
                    value={formData.pathao.clientSecret}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pathao: { ...formData.pathao, clientSecret: e.target.value },
                      })
                    }
                    placeholder="••••••••••••••••"
                    className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700">Merchant Email / Username</label>
                  <input
                    type="text"
                    value={formData.pathao.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pathao: { ...formData.pathao, username: e.target.value },
                      })
                    }
                    placeholder="merchant@example.com"
                    className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700">Password</label>
                  <SecretInput
                    value={formData.pathao.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pathao: { ...formData.pathao, password: e.target.value },
                      })
                    }
                    placeholder="••••••••"
                    className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-stone-400" />
                    <span>Store ID (পাঠাও মার্চেন্ট স্টোর আইডি)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pathao.storeId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pathao: { ...formData.pathao, storeId: e.target.value },
                      })
                    }
                    placeholder="e.g. 12345"
                    className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <label className="text-xs font-bold text-stone-800 block">Default Courier Provider (ডিফল্ট কুরিয়ার)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      formData.defaultCourier === 'steadfast'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="defaultCourier"
                      value="steadfast"
                      checked={formData.defaultCourier === 'steadfast'}
                      onChange={() => setFormData({ ...formData, defaultCourier: 'steadfast' })}
                      className="text-emerald-600"
                    />
                    <span className="text-xs">Steadfast Courier</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      formData.defaultCourier === 'pathao'
                        ? 'border-red-600 bg-red-50/50 text-red-950 font-bold'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="defaultCourier"
                      value="pathao"
                      checked={formData.defaultCourier === 'pathao'}
                      onChange={() => setFormData({ ...formData, defaultCourier: 'pathao' })}
                      className="text-red-600"
                    />
                    <span className="text-xs">Pathao Courier</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-900">Auto-dispatch on Order Confirm</div>
                  <div className="text-[11px] text-stone-500">
                    অর্ডার স্ট্যাটাস Confirmed করার সাথে সাথে কুরিয়ারে এন্ট্রি হবে
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoSendOnConfirm}
                  onChange={(e) =>
                    setFormData({ ...formData, autoSendOnConfirm: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions (Fixed Bottom) */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-stone-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-stone-50/90">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Keys are securely stored & proxied server-side</span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="courier-settings-form"
              className="px-5 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              {isSaved ? <Check className="w-4 h-4" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved Successfully!' : 'Save Credentials'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
