// LOCAL DEV ONLY — floating "page tour" bar (bottom-left).
// Steps through every page in DEV_PAGES for the signed-in role. Each stop is
// marked automatically: redirected to /login or /unauthorized → "blocked",
// a runtime error on the page → "broken". You can also mark it by hand.
// Rendered by DevRoleSwitcher, which is code-split behind `import.meta.env.DEV`.

import { useEffect, useRef, useState } from 'react';
import { StatusBadge, STATUS_STYLE } from './DevStatusBadge';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, CheckCircle2, Ban, Bug, Route as RouteIcon } from 'lucide-react';
import { DEV_PAGES, PageStatus, getPageStatuses, getTourIndex, setPageStatus, setTourIndex, useDevPagesVersion } from '../../lib/dev-pages';

export default function DevPageTour({ roleKey }: { roleKey: string }) {
  useDevPagesVersion();
  const index = getTourIndex();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorSeen, setErrorSeen] = useState(false);
  // Collapsed to a small circle by default; remembered for this browser tab.
  const [expanded, setExpanded] = useState(() => {
    try {
      return sessionStorage.getItem('crm_dev_tour_open') === '1';
    } catch {
      return false;
    }
  });
  const toggleExpanded = () =>
    setExpanded((v) => {
      try {
        sessionStorage.setItem('crm_dev_tour_open', v ? '0' : '1');
      } catch {
        // ignore
      }
      return !v;
    });
  const page = index === null ? null : DEV_PAGES[index];
  const statuses = getPageStatuses(roleKey);
  const lastPath = useRef<string | null>(null);
  // location.key when we navigated; results are only judged once it changes.
  const navKey = useRef<string | null>(null);

  // Navigate to the current stop when it changes.
  useEffect(() => {
    if (!page || lastPath.current === page.path) return;
    lastPath.current = page.path;
    setErrorSeen(false);
    navKey.current = location.key;
    navigate(page.path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, navigate]);

  // Any uncaught runtime error while on this stop marks it broken.
  useEffect(() => {
    if (!page) return;
    const onError = () => {
      setErrorSeen(true);
      setPageStatus(roleKey, page.path, 'broken');
    };
    window.addEventListener('error', onError);
    return () => window.removeEventListener('error', onError);
  }, [page, roleKey]);

  // Redirects away from the stop mean this role can't open it. Otherwise,
  // once it has rendered for a moment without errors, mark it OK.
  useEffect(() => {
    if (!page || lastPath.current !== page.path || location.key === navKey.current) return;
    const here = location.pathname;
    if (here !== page.path && (here === '/login' || here === '/unauthorized')) {
      setPageStatus(roleKey, page.path, 'blocked');
      return;
    }
    if (here !== page.path) return;
    const t = window.setTimeout(() => {
      const current = getPageStatuses(roleKey)[page.path];
      if (!current && !errorSeen) setPageStatus(roleKey, page.path, 'ok');
    }, 1500);
    return () => window.clearTimeout(t);
  }, [page, location.pathname, location.key, roleKey, errorSeen]);

  if (index === null || !page) return null;

  const go = (next: number) => {
    if (next < 0 || next >= DEV_PAGES.length) {
      setTourIndex(null);
      return;
    }
    setTourIndex(next);
  };
  const mark = (s: PageStatus) => {
    setPageStatus(roleKey, page.path, statuses[page.path] === s ? null : s);
  };
  const done = Object.keys(statuses).length;
  const progress = done / DEV_PAGES.length;
  const RING = 2 * Math.PI * 22; // circumference of the r=22 progress ring

  return (
    <div className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-[10000] flex flex-col items-start gap-3 text-xs font-sans antialiased">
      {expanded && (
    <div className="w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl animate-in slide-in-from-bottom-6 duration-300">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 font-bold">
          <RouteIcon className="w-3.5 h-3.5 text-emerald-500" /> Page tour
          <span className="font-normal text-slate-400">
            {index + 1}/{DEV_PAGES.length} · {done} checked
          </span>
        </div>
        <button onClick={() => setTourIndex(null)} title="End tour" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="End page tour">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">{page.group}</span>
          <span className="font-semibold truncate">{page.label}</span>
          <StatusBadge status={statuses[page.path]} />
        </div>
        <div className="font-mono text-[11px] text-slate-500 truncate">
          {page.path}
          {location.pathname !== page.path && <span className="text-amber-600 dark:text-amber-400"> → {location.pathname}</span>}
        </div>
        {page.access && <div className="text-[11px] text-slate-400">Access: {page.access}</div>}
      </div>

      <div className="flex items-center gap-1 px-3 pb-2">
        <button onClick={() => mark('ok')} title="Looks good" className={`flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 ${statuses[page.path] === 'ok' ? STATUS_STYLE.ok : ''}`}>
          <CheckCircle2 className="w-3.5 h-3.5" /> OK
        </button>
        <button onClick={() => mark('broken')} title="Something is wrong on this page" className={`flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 ${statuses[page.path] === 'broken' ? STATUS_STYLE.broken : ''}`}>
          <Bug className="w-3.5 h-3.5" /> Broken
        </button>
        <button onClick={() => mark('blocked')} title="This role can't open it" className={`flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 ${statuses[page.path] === 'blocked' ? STATUS_STYLE.blocked : ''}`}>
          <Ban className="w-3.5 h-3.5" /> Blocked
        </button>
        <div className="flex-1" />
        <button onClick={() => go(index - 1)} disabled={index === 0} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40" aria-label="Previous page">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => go(index + 1)} className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-semibold" aria-label="Next page">
          {index + 1 === DEV_PAGES.length ? 'Finish' : 'Next'} <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
      )}

      {/* Small circle buttons, styled like SalePro's AI chat button. */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleExpanded()}
          title={`Page tour: ${page.label} (${index + 1}/${DEV_PAGES.length}, ${done} checked)`}
          aria-label="Toggle page tour"
          aria-expanded={expanded}
          className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-2xl hover:scale-110 hover:shadow-emerald-300/30 transition-all duration-300 cursor-pointer focus:outline-none"
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
            <circle
              cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={RING} strokeDashoffset={RING * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-500"
            />
          </svg>
          {expanded ? (
            <X size={20} className="rotate-90 transition-transform duration-200" />
          ) : (
            <span className="text-[11px] font-bold tabular-nums leading-none">{index + 1}</span>
          )}
          {statuses[page.path] === 'broken' && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
          )}
        </button>
        {!expanded && (
          <button
            onClick={() => go(index + 1)}
            title={index + 1 === DEV_PAGES.length ? 'Finish tour' : `Next: ${DEV_PAGES[index + 1].label}`}
            aria-label="Next page"
            className="flex items-center justify-center w-8 h-8 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-white/10 rounded-full shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer focus:outline-none"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
