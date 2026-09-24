import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { AlBarakahLogo } from '@/components/shared/AlBarakahLogo';

/** Shared frame for /login and /verify-otp - keeps the legacy guard's look (dark green page, gold Cinzel wordmark, rounded card). */
export function AuthShell({ badge, children }: { badge: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#021810] text-stone-100 flex items-center justify-center p-4 selection:bg-[#D4AF37] selection:text-stone-950 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#021810] to-[#021810] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#052d20] border border-emerald-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-stone-950/60 border border-[#D4AF37]/40 shadow-inner mb-4">
            <AlBarakahLogo className="w-12 h-12" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-widest text-[#D4AF37] uppercase font-serif" style={{ fontFamily: "'Cinzel', Georgia, serif" }}>
            AL BARAKAH
          </h1>
          <p className="text-[11px] font-bold tracking-[0.25em] text-emerald-400 uppercase mt-0.5">RESTRICTED ADMIN GATEWAY</p>

          <div className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-[11px] text-emerald-300 w-fit mx-auto">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{badge}</span>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
