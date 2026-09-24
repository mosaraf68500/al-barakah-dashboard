'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, RefreshCw, Smartphone } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { ApiError } from '@/lib/api/http';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { useToast } from '@/providers/ToastProvider';

const schema = z.object({ code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code.') });
type Values = z.infer<typeof schema>;

const RESEND_SECONDS = 30;

export default function VerifyOtpPage() {
  const router = useRouter();
  const { pendingEmail, verifyOtp, resendOtp } = useAdminAuth();
  const showToast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [sending, setSending] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { code: '' } });
  const code = watch('code') || '';

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const fail = (msg: string) => {
    setError(msg);
    showToast(msg, 'error');
  };

  const reason = (e: unknown, fallback: string) => {
    const code = e instanceof ApiError ? e.code : undefined;
    if (code === 'INVALID_OTP' || code === 'OTP_EXPIRED') return 'কোড ভুল, অথবা মেয়াদ শেষ। আবার দিন, না হলে নতুন কোড পাঠান।';
    if (code === 'OTP_DELIVERY_FAILED') return 'ইমেইলে কোড পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন।';
    if (code === 'ACCOUNT_LOCKED' || code === 'TOO_MANY_REQUESTS' || code === 'TOO_MANY_OTP_REQUESTS') return 'অনেকবার ভুল হয়েছে। একটু পরে আবার চেষ্টা করুন।';
    if (e instanceof Error && e.message && e.message !== code) return e.message;
    return fallback;
  };

  const onSubmit = async (v: Values) => {
    setError(null);
    try {
      await verifyOtp(v.code);
      showToast('লগইন সফল হয়েছে। ড্যাশবোর্ড খোলা হচ্ছে।');
      router.replace('/dashboard');
    } catch (e) {
      fail(reason(e, 'কোড যাচাই হয়নি। আবার চেষ্টা করুন।'));
    }
  };

  const onResend = async () => {
    setSending(true);
    setError(null);
    try {
      await resendOtp();
      setCooldown(RESEND_SECONDS);
      showToast('নতুন কোড ইমেইলে পাঠানো হয়েছে।');
    } catch (e) {
      fail(reason(e, 'নতুন কোড পাঠানো যায়নি। আবার চেষ্টা করুন।'));
    } finally {
      setSending(false);
    }
  };

  const message = errors.code?.message || error;

  return (
    <AuthShell badge="Step 2: 2-Factor OTP Verification">
      <div className="mt-4 space-y-4">
        <div className="text-center space-y-1.5 pb-1">
          <div className="inline-flex p-2.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-[#D4AF37] mb-1">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white font-serif" style={{ fontFamily: "'Cinzel', Georgia, serif" }}>
            Enter 6-Digit Verification Code
          </h3>
          <p className="text-xs text-stone-300">
            A 6-digit code has been sent to <span className="font-bold text-[#D4AF37]">{pendingEmail ?? 'your email'}</span>
          </p>
          <p className="text-[11px] text-emerald-400/90 font-medium">(Check inbox &amp; spam &bull; Code valid for 5 minutes)</p>
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/60 text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>{message}</div>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit, (errs) => {
            if (errs.code?.message) fail('কোডটি ৬ সংখ্যার হতে হবে।');
          })}
          className="space-y-4"
          noValidate
        >
          <div>
            <label className="block text-[11px] font-semibold text-stone-300 mb-1.5 uppercase tracking-wider text-center">Verification Code (OTP)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              placeholder="Enter 6-digit OTP"
              id="admin-otp-input"
              {...register('code')}
              className="w-full px-4 py-3 rounded-xl bg-black/60 border border-emerald-600/60 text-white placeholder-stone-600 text-center font-mono text-base sm:text-lg font-bold tracking-wider focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || code.trim().length < 6}
            id="admin-otp-submit-btn"
            className="w-full py-3.5 rounded-xl bg-[#CFA43B] hover:bg-[#b88f30] text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Unlock Admin Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between pt-2 border-t border-emerald-900/60 text-xs">
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || sending}
            className="text-emerald-400 hover:text-emerald-300 disabled:text-stone-500 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cooldown > 0 || sending ? '' : 'animate-pulse'}`} />
            <span>{sending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP Code'}</span>
          </button>

          <button type="button" onClick={() => router.push('/login')} className="text-stone-400 hover:text-white cursor-pointer">
            Back
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
