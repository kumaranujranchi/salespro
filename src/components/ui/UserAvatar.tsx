import { useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({
  src,
  name,
  size = 'md',
  className = ''
}: UserAvatarProps) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setHasError(false);
  }

  const rawName = (typeof name === 'string' ? name : '').trim();
  const initials = rawName
    ? rawName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'U';

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
    xl: 'w-12 h-12 text-base font-bold'
  }[size];

  const isValidUrl = Boolean(
    src &&
    typeof src === 'string' &&
    src.trim() !== '' &&
    src !== 'null' &&
    src !== 'undefined' &&
    (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image/') || src.startsWith('/'))
  );

  if (isValidUrl && !hasError) {
    return (
      <img
        src={src!}
        alt=""
        onError={() => setHasError(true)}
        className={`${sizeClasses} rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/10 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${className}`}
    >
      {initials}
    </div>
  );
}
