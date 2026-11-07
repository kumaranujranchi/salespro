import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface CompanyLogoAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackName?: string;
}

export function CompanyLogoAvatar({ className = '', size = 'md', fallbackName }: CompanyLogoAvatarProps) {
  const { tenant, profile } = useAuth();
  const [imgError, setImgError] = useState(false);

  // Logo URL: Prefer tenant company logo, then profile image
  const appearance = tenant?.settings?.appearance as any;
  const logoUrl =
    appearance?.resolved_logo_url ||
    appearance?.logo_url ||
    profile?.image_url;

  // Name for initials: Company name first, then profile full name, then fallback
  const rawName = tenant?.name || fallbackName || profile?.full_name || 'RSP';

  const getInitials = (nameStr: string): string => {
    if (!nameStr) return 'SP';
    const words = nameStr.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      const single = words[0];
      return single.slice(0, Math.min(2, single.length)).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const initials = getInitials(rawName);

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-11 h-11 md:w-12 md:h-12 text-sm md:text-base',
    lg: 'w-12 h-12 md:w-14 md:h-14 text-base md:text-lg',
    xl: 'w-14 h-14 md:w-16 md:h-16 text-lg md:text-xl',
  }[size];

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt=""
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-xl object-contain bg-white/10 p-1 border-2 border-white/40 shadow-sm transition-all ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center font-bold tracking-wider text-white border-2 border-white/50 shadow-md select-none ${className}`}
      title={rawName}
    >
      {initials}
    </div>
  );
}

