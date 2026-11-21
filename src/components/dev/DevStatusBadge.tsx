// LOCAL DEV ONLY — status pill for the Dev Mode page checklist.
import type { PageStatus } from '../../lib/dev-pages';

// eslint-disable-next-line react-refresh/only-export-components
export const STATUS_STYLE: Record<PageStatus, string> = {
  ok: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  blocked: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  broken: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

export function StatusBadge({ status }: { status?: PageStatus }) {
  if (!status) return null;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLE[status]}`}>{status}</span>
  );
}
