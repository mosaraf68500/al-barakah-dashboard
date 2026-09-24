'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Password-style input with a show/hide toggle. Used for EVERY secret/credential field in the admin settings forms
 * (Steadfast key/secret, Pathao secret/password, bKash secrets, Telegram bot token, Facebook CAPI token) - ADMIN_MIGRATION_PLAN Q24.
 */
export function SecretInput({ className = '', ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...rest} type={visible ? 'text' : 'password'} autoComplete="off" spellCheck={false} className={`${className} pr-10`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
        title={visible ? 'Hide' : 'Show'}
        aria-label={visible ? 'Hide secret' : 'Show secret'}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
