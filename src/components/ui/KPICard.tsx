import { ReactNode } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  iconBgColor?: string;
  iconColor?: string;
  formatter?: (value: any) => ReactNode;
  valueClassName?: string;
  className?: string; // New Prop
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  iconBgColor = 'bg-indigo-50',
  iconColor = 'text-indigo-600',
  formatter,
  valueClassName = '',
  className = '', // Destructure
}: KPICardProps) {
  const isPositive = trend?.isPositive ?? true;

  // Determine gradient based on icon color prop for a matching theme
  let gradientFrom = 'from-slate-50';
  if (iconColor.includes('indigo')) gradientFrom = 'from-indigo-50';
  if (iconColor.includes('blue')) gradientFrom = 'from-blue-50';
  if (iconColor.includes('green') || iconColor.includes('emerald')) gradientFrom = 'from-emerald-50';
  if (iconColor.includes('rose') || iconColor.includes('red')) gradientFrom = 'from-rose-50';
  if (iconColor.includes('purple')) gradientFrom = 'from-purple-50';

  return (
    <div className={`relative group overflow-hidden bg-gradient-to-br ${gradientFrom} to-white dark:from-surface-highlight dark:to-surface-dark dark:border dark:border-white/5 rounded-xl md:rounded-3xl shadow-card-custom p-2 md:p-6 transition-all duration-300 hover:-translate-y-1 h-full ${className}`}>
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-transparent rounded-bl-full -mr-6 -mt-6 md:-mr-10 md:-mt-10 transition-transform group-hover:scale-110 pointer-events-none" />
      <div className={`absolute bottom-0 right-0 w-12 h-12 md:w-24 md:h-24 rounded-full opacity-5 hover:opacity-10 dark:opacity-20 blur-lg md:blur-2xl group-hover:opacity-10 dark:group-hover:opacity-30 transition-opacity ${iconBgColor.replace('bg-', 'bg-')}`} />

      <div className="relative flex justify-between items-start mb-2 md:mb-6">
        <div className={`p-1.5 md:p-3.5 rounded-lg md:rounded-2xl ${iconBgColor} ${iconColor} bg-opacity-80 dark:bg-opacity-20 dark:text-white ring-1 ring-black/5 dark:ring-white/10 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
          <Icon className="w-3.5 h-3.5 md:w-6 md:h-6 stroke-[2]" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full text-[9px] md:text-xs font-bold border ${isPositive
            ? 'bg-emerald-100/50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
            : 'bg-rose-100/50 text-rose-700 border-rose-100 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
            }`}>
            {isPositive ? <TrendingUp size={10} className="md:w-3.5 md:h-3.5" /> : <TrendingDown size={10} className="md:w-3.5 md:h-3.5" />}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-[9px] md:text-xs font-semibold text-slate-500 dark:text-text-muted mb-0 md:mb-1 tracking-wide uppercase truncate">{title}</p>
        <h3 className={`text-base md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate leading-tight ${valueClassName}`}>
          {formatter ? formatter(value) : value}
        </h3>
        {subtitle && (
          <p className="text-[9px] md:text-xs text-slate-400 dark:text-gray-500 mt-0.5 md:mt-2 font-medium flex items-center gap-1 truncate">
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-gray-600 shrink-0"></span>
            {subtitle}
          </p>
        )}
      </div>

      {/* Sparkline Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-12 md:h-16 opacity-0 group-hover:opacity-20 dark:group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
          <path d="M0 40 Q 25 35, 50 20 T 100 10 V 40 H 0 Z" fill="currentColor" className={iconColor} />
        </svg>
      </div>
    </div>
  );
}
