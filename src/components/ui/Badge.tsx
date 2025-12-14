import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-white dark:text-slate-900',
    success: 'bg-green-100 text-green-800 dark:bg-[#00E576]/20 dark:text-[#00E576]',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
