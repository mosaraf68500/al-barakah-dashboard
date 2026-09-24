'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Eye, EyeOff, KeyRound, Mail, RefreshCw, Send } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { ApiError } from '@/lib/api/http';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { useToast } from '@/providers/ToastProvider';

const schema = z.object({
  email: z.string().trim().email('সঠিক ইমেইল ঠিকানা দিন।'),
  password: z.string().min(1, 'পাসওয়ার্ড দিন।'),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const showToast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const fail = (msg: string) => {
    setError(msg);
    showToast(msg, 'error');
  };

  const onSubmit = async (v: Values) => {
    setError(null);
    try {
      await login(v.email, v.password);
      showToast('পরের ধাপে যাচ্ছেন। কোড ইমেইলে না এলে পাসওয়ার্ড ভুল ছিল — লগইন পেজ থেকে আবার চেষ্টা করুন।');
      router.push('/verify-otp');
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      if (code === 'OTP_DELIVERY_FAILED') fail('ইমেইলে কোড পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন।');
      else if (e instanceof Error && e.message && e.message !== code) fail(e.message);
      else fail('লগইন হয়নি। ইমেইল ও পাসওয়ার্ড মিলিয়ে আবার চেষ্টা করুন।');
    }
  };

  const fieldError = errors.email?.message || errors.password?.message || error;

  return (
    <AuthShell badge="Step 1: Email & Password">
      {fieldError && (
        <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-600/60 text-xs text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{fieldError}</div>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit, (errs) => {
          const msg = errs.email?.message || errs.password?.message;
          if (msg) fail(msg);
        })}
        className="mt-5 space-y-3 p-4 rounded-2xl bg-black/40 border border-emerald-700/40"
        noValidate
      >
        <div>
          <label className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5 mb-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>অ্যাডমিন ইমেইল</span>
          </label>
          <input
            type="email"
            autoComplete="username"
            autoFocus
            placeholder="admin@example.com"
            {...register('email')}
            className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-emerald-700/60 text-white placeholder-stone-500 text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5 mb-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            <span>পাসওয়ার্ড</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter password"
              {...register('password')}
              className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-emerald-700/60 text-white placeholder-stone-500 text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold transition-all cursor-pointer border border-emerald-500/40 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>যাচাই কোড পাঠানো হচ্ছে...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>লগইন ওটিপি কোড পাঠান</span>
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
