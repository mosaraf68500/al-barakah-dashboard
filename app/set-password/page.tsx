'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, KeyRound, RefreshCw } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { ApiError, post } from '@/lib/api/http';

export default function SetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') || '');
    setReady(true);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('এই লিংকটি সঠিক নয়। ইনভাইট মেইলের Set password বাটন আবার খুলুন।');
      return;
    }
    if (password.length < 12) {
      setError('পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে।');
      return;
    }
    if (password !== confirm) {
      setError('দুইবার একই পাসওয়ার্ড দিন।');
      return;
    }
    setSaving(true);
    try {
      await post('/v1/admin-auth/set-password', { token, password });
      setDone(true);
    } catch (err) {
      const code = err instanceof ApiError ? err.code || err.message : '';
      setError(
        code === 'INVALID_OR_EXPIRED_TOKEN'
          ? 'এই লিংকের মেয়াদ শেষ, অথবা আগেই ব্যবহার হয়েছে। অ্যাডমিন থেকে আবার ইনভাইট পাঠান।'
          : 'পাসওয়ার্ড সেট হয়নি। ইনভাইট মেইলের লিংক আবার খুলুন।',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell badge="Set your admin password">
      {done ? (
        <div className="mt-5 space-y-3 p-4 rounded-2xl bg-black/40 border border-emerald-700/40 text-xs leading-relaxed text-stone-200">
          <p>পাসওয়ার্ড সেট হয়েছে। এখন লগইন পেজে ইনভাইট যাওয়া ইমেইল এবং এই পাসওয়ার্ড দিন।</p>
          <p>তখনই ৬ ডিজিটের কোড সেই ইমেইলে যাবে। তার আগে কোড আসে না।</p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold cursor-pointer border border-emerald-500/40"
          >
            লগইন পেজে যান
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-3 p-4 rounded-2xl bg-black/40 border border-emerald-700/40" noValidate>
          <p className="text-xs leading-relaxed text-stone-300">ইনভাইট মেইলে যে ইমেইল ছিল, পাসওয়ার্ড সেই অ্যাকাউন্টের জন্য সেট হবে। এখানে ইমেইল আবার লিখতে হবে না।</p>

          {(ready && !token) || error ? (
            <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-600/60 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error || 'এই লিংকটি সঠিক নয়। ইনভাইট মেইলের Set password বাটন আবার খুলুন।'}</div>
            </div>
          ) : null}

          <div>
            <label className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5 mb-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>নতুন পাসওয়ার্ড</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-emerald-700/60 text-white placeholder-stone-500 text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5 mb-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>পাসওয়ার্ড আবার দিন</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-emerald-700/60 text-white placeholder-stone-500 text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !ready}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold transition-all cursor-pointer border border-emerald-500/40 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>সেট হচ্ছে...</span>
              </>
            ) : (
              <span>পাসওয়ার্ড সেট করুন</span>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
