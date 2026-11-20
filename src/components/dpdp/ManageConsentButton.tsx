import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ManageConsentButtonProps {
  className?: string;
  variant?: 'floating' | 'inline';
}

export function ManageConsentButton({ className = '', variant = 'floating' }: ManageConsentButtonProps) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dpdp_open_preferences'));
    }
  };

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer ${className}`}
        aria-label="Manage Cookie and Privacy Preferences"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Manage Cookie Preferences</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#071d14]/90 hover:bg-[#0b2b1e] border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-medium shadow-lg shadow-black/50 backdrop-blur-md transition-all active:scale-95 cursor-pointer ${className}`}
      title="DPDP Act (India) Cookie & Privacy Settings"
      aria-label="Manage Cookie & Privacy Settings"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      <span className="hidden sm:inline">Cookie Preferences</span>
    </button>
  );
}
