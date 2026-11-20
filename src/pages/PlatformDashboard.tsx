import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '../lib/reactive';
import { api } from '../lib/api-endpoints';
import { consentAdminService, DpdpConsentSummary } from '../lib/services';
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Lock,
  ArrowRight,
  Database
} from 'lucide-react';

interface Tenant {
  _id: string;
  _creationTime: number;
  subscription_status: string;
}

export function PlatformDashboard() {
  const tenants = useQuery(api.tenants.list) as Tenant[] | undefined;
  const [consentSummary, setConsentSummary] = useState<DpdpConsentSummary | null>(null);

  useEffect(() => {
    consentAdminService.getAuditLogs({ limit: 1 })
      .then((res) => {
        if (res?.success && res.summary) {
          setConsentSummary(res.summary);
        }
      })
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    if (!tenants) return { total: 0, newThisMonth: 0, trial: 0, active: 0 };
    
    return {
      total: tenants.length,
      newThisMonth: tenants.filter((t: Tenant) => {
        const d = new Date(t._creationTime);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
      trial: tenants.filter((t: Tenant) => t.subscription_status === 'trial' || t.subscription_status === 'trialing').length,
      active: tenants.filter((t: Tenant) => t.subscription_status === 'active').length
    };
  }, [tenants]);

  if (tenants === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Monitor SaaS growth and tenant health.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tenants</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.total}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">New (This Month)</p>
              <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">+{stats.newThisMonth}</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Trials</p>
              <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{stats.trial}</h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Paid / Active</p>
              <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{stats.active}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* DPDP Act (India) Compliance & 3-Year Retention Hub */}
      <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/30 rounded-2xl p-6 shadow-md shadow-emerald-500/5 relative overflow-hidden">
        {/* Subtle decorative emerald accent glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-xs">
                🇮🇳 DPDP Act, 2023 Statutory Compliance
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shadow-xs">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 3-Year Immutable WORM
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Privacy &amp; Cookie Consent Audit Ledger
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-normal">
              Verifiable proof of consent records for CRM landing page visitors. Protected by engine-level database triggers that prevent accidental update or deletion.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative z-10">
            <Link
              to="/platform/consent-audit"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/25 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Consent Audit Ledger</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Quick Metrics */}
        {consentSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 relative z-10">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Total Logged Proofs</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                {Number(consentSummary.total_records || 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/70 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">Granted (Opt-In)</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {Number(consentSummary.granted_count || 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Rejected (Essential Only)</span>
              <span className="text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-1 block">
                {Number(consentSummary.rejected_count || 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-amber-50/70 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800/70 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">Withdrawn (Revoked)</span>
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
                {Number(consentSummary.withdrawn_count || 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
