import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Download,
  RefreshCw,
  Search,
  Filter,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Calendar,
  Languages,
  Eye,
  Activity,
  Layers,
  Info,
} from 'lucide-react';
import {
  consentAdminService,
  DpdpConsentAuditLog,
  DpdpConsentSummary,
} from '../../lib/services';
import { getAuthToken } from '../../lib/auth-token';
import { getApiBaseUrl } from '../../lib/api';

export function ConsentAuditPage() {
  const [logs, setLogs] = useState<DpdpConsentAuditLog[]>([]);
  const [summary, setSummary] = useState<DpdpConsentSummary>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [languageFilter, setLanguageFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const limit = 25;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await consentAdminService.getAuditLogs({
        limit,
        offset: page * limit,
        action_type: actionFilter !== 'ALL' ? actionFilter : undefined,
        language: languageFilter !== 'ALL' ? languageFilter : undefined,
      });

      if (res?.success) {
        setLogs(res.logs || []);
        setSummary(res.summary || {});
        setTotal(res.total || 0);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load consent audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, languageFilter]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const token = getAuthToken();
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/v1/consent/export-csv`;

      const response = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate compliance CSV');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `DPDP_Consent_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter logs locally by search term
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.anonymous_id.toLowerCase().includes(term) ||
      log.id.toLowerCase().includes(term) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(term))
    );
  });

  const totalRecords = Number(summary.total_records || total || 0);
  const grantedCount = Number(summary.granted_count || 0);
  const rejectedCount = Number(summary.rejected_count || 0);
  const withdrawnCount = Number(summary.withdrawn_count || 0);
  const analyticsGranted = Number(summary.analytics_granted_count || 0);
  const marketingGranted = Number(summary.marketing_granted_count || 0);

  const optInRate = totalRecords > 0 ? Math.round((grantedCount / totalRecords) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              DPDP Act (India) Consent Audit Ledger
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>3-Year Statutory WORM Protected</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verifiable, tamper-proof proof of consent logs mandated under Chapter III & Rule 3(2) of India's DPDP Act, 2023.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating Report...' : 'Export Statutory CSV'}</span>
          </button>
        </div>
      </div>

      {/* 3-Year Retention Guarantee Notice */}
      <div className="bg-emerald-950/30 dark:bg-[#071d14] border border-emerald-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-white text-sm block mb-0.5">
              Immutable 3-Year Retention Guarantee (WORM Protection)
            </span>
            All consent records below are protected by an engine-level PostgreSQL database trigger preventing any{' '}
            <code className="text-emerald-400 font-mono bg-black/40 px-1 py-0.5 rounded">DELETE</code> or{' '}
            <code className="text-emerald-400 font-mono bg-black/40 px-1 py-0.5 rounded">UPDATE</code>. Every row represents legally binding evidence including SHA-256 notice text fingerprint, timestamp, and anonymized IP.
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Zero Deletions Allowed</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Proofs Logged</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalRecords.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">100% verifiably indexed</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Granted (Opt-In)</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{grantedCount.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">{optInRate}% acceptance rate</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Rejected (Essential Only)</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">{rejectedCount.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Non-essential blocked</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Withdrawn (Revoked)</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{withdrawnCount.toLocaleString()}</div>
          <div className="text-[11px] text-amber-500/80 mt-1">DPDP Sec 6(4) revocations</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Analytics Permitted</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{analyticsGranted.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">GTM/GA4 unlocked</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Marketing Permitted</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{marketingGranted.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Meta Pixel unlocked</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by UUID or IP..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(0);
              }}
              className="py-1.5 px-2.5 rounded-lg text-xs bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Actions</option>
              <option value="GRANTED">Granted (Accepted)</option>
              <option value="REJECTED">Rejected (Essential Only)</option>
              <option value="UPDATED">Updated (Customized)</option>
              <option value="WITHDRAWN">Withdrawn (Revoked)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Languages className="w-3.5 h-3.5" />
            <span>Lang:</span>
            <select
              value={languageFilter}
              onChange={(e) => {
                setLanguageFilter(e.target.value);
                setPage(0);
              }}
              className="py-1.5 px-2.5 rounded-lg text-xs bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All</option>
              <option value="en">English (en)</option>
              <option value="hi">हिन्दी (hi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-white/10 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC/IST)</th>
                <th className="py-3 px-4">Anonymous ID</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Granular Consents</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Masked IP</th>
                <th className="py-3 px-4">Notice Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>Loading immutable consent records...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No consent proofs match the active filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const date = new Date(log.created_at);
                  const formattedDate = date.toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        {formattedDate}
                      </td>

                      {/* Anonymous Identifier */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-900 dark:text-white">
                          <span>{log.anonymous_id.slice(0, 14)}...</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(log.anonymous_id, log.id)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Copy Anonymous UUID"
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Action Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.action_type === 'GRANTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> GRANTED
                          </span>
                        )}
                        {log.action_type === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                        )}
                        {log.action_type === 'UPDATED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            <RefreshCw className="w-3 h-3" /> UPDATED
                          </span>
                        )}
                        {log.action_type === 'WITHDRAWN' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" /> WITHDRAWN
                          </span>
                        )}
                      </td>

                      {/* Granular Toggles */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold" title="Strictly Necessary Essential">
                            Ess: ON
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              log.preferences_analytics
                                ? 'bg-blue-500/10 text-blue-400 font-semibold'
                                : 'bg-slate-500/10 text-slate-500'
                            }`}
                            title="Analytics & Performance"
                          >
                            Ana: {log.preferences_analytics ? 'ON' : 'OFF'}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              log.preferences_marketing
                                ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                                : 'bg-slate-500/10 text-slate-500'
                            }`}
                            title="Marketing & Pixels"
                          >
                            Mkt: {log.preferences_marketing ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </td>

                      {/* Language */}
                      <td className="py-3 px-4 whitespace-nowrap uppercase font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                          {log.language === 'hi' ? 'हिन्दी (hi)' : 'English (en)'}
                        </span>
                      </td>

                      {/* Masked IP */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {log.ip_address || '0.0.0.0'}
                      </td>

                      {/* SHA-256 Hash */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span title={log.notice_text_hash}>{log.notice_text_hash.slice(0, 12)}...</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(log.notice_text_hash, `hash_${log.id}`)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Copy Full Notice SHA-256 Fingerprint"
                          >
                            {copiedId === `hash_${log.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-900 dark:text-white">{filteredLogs.length}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{total}</strong> statutory records
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="font-mono text-[11px]">Page {page + 1}</span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= total || loading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
