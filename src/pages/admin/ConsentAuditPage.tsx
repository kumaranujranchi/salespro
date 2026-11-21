import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Download,
  RefreshCw,
  Search,
  Filter,
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
  Trash2,
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Consent Audit Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit logs of visitor and lead consent preferences recorded across landing pages.
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
            <span>{isExporting ? 'Generating Report...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border-2 border-slate-200 dark:border-white/10 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Proofs Logged</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5">{totalRecords.toLocaleString()}</div>
          <div className="text-xs font-medium text-slate-500 mt-1">100% verifiably indexed</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800/60 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Granted (Opt-In)</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5">{grantedCount.toLocaleString()}</div>
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1">{optInRate}% acceptance rate</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700/80 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Rejected (Essential Only)</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-200 mt-1.5">{rejectedCount.toLocaleString()}</div>
          <div className="text-xs font-medium text-slate-500 mt-1">Non-essential blocked</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800/60 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Withdrawn (Revoked)</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1.5">{withdrawnCount.toLocaleString()}</div>
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-1">DPDP Sec 6(4) revocations</div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-800/60 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">Analytics Permitted</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1.5">{analyticsGranted.toLocaleString()}</div>
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mt-1">GTM/GA4 unlocked</div>
        </div>

        <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border-2 border-purple-200 dark:border-purple-800/60 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-400">Marketing Permitted</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1.5">{marketingGranted.toLocaleString()}</div>
          <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mt-1">Meta Pixel unlocked</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border-2 border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by UUID or IP..."
            className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(0);
              }}
              className="py-1.5 px-2.5 rounded-lg text-xs bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white font-bold cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              <option value="GRANTED">Granted (Accepted)</option>
              <option value="REJECTED">Rejected (Essential Only)</option>
              <option value="UPDATED">Updated (Customized)</option>
              <option value="WITHDRAWN">Withdrawn (Revoked)</option>
              <option value="DATA_ERASED">Data Erased (Section 12)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
            <Languages className="w-3.5 h-3.5 text-slate-500" />
            <span>Lang:</span>
            <select
              value={languageFilter}
              onChange={(e) => {
                setLanguageFilter(e.target.value);
                setPage(0);
              }}
              className="py-1.5 px-2.5 rounded-lg text-xs bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white font-bold cursor-pointer"
            >
              <option value="ALL">All</option>
              <option value="en">English (en)</option>
              <option value="hi">हिन्दी (hi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="rounded-xl bg-white dark:bg-surface-dark border-2 border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 font-extrabold border-b-2 border-slate-200 dark:border-white/10 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Timestamp (UTC/IST)</th>
                <th className="py-3.5 px-4">Anonymous ID</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Granular Consents</th>
                <th className="py-3.5 px-4">Language</th>
                <th className="py-3.5 px-4">Masked IP</th>
                <th className="py-3.5 px-4">Notice Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-semibold">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>Loading immutable consent records...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-semibold">
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
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300 font-bold text-xs">
                        {formattedDate}
                      </td>

                      {/* Anonymous Identifier */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                          <span>{log.anonymous_id.slice(0, 14)}...</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(log.anonymous_id, log.id)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Copy Anonymous UUID"
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Action Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.action_type === 'GRANTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> GRANTED
                          </span>
                        )}
                        {log.action_type === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-xs">
                            <XCircle className="w-3.5 h-3.5 text-slate-600" /> REJECTED
                          </span>
                        )}
                        {log.action_type === 'UPDATED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700 shadow-xs">
                            <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> UPDATED
                          </span>
                        )}
                        {log.action_type === 'WITHDRAWN' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> WITHDRAWN
                          </span>
                        )}
                        {log.action_type === 'DATA_ERASED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700 shadow-xs">
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" /> DATA ERASED
                          </span>
                        )}
                      </td>

                      {/* Granular Toggles */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-bold" title="Strictly Necessary Essential">
                            Ess: ON
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold border ${
                              log.preferences_analytics
                                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}
                            title="Analytics & Performance"
                          >
                            Ana: {log.preferences_analytics ? 'ON' : 'OFF'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold border ${
                              log.preferences_marketing
                                ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}
                            title="Marketing & Pixels"
                          >
                            Mkt: {log.preferences_marketing ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </td>

                      {/* Language */}
                      <td className="py-3.5 px-4 whitespace-nowrap uppercase font-mono text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                          {log.language === 'hi' ? 'हिन्दी (hi)' : 'English (en)'}
                        </span>
                      </td>

                      {/* Masked IP */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        {log.ip_address || '0.0.0.0'}
                      </td>

                      {/* SHA-256 Hash */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span title={log.notice_text_hash} className="font-semibold">{log.notice_text_hash.slice(0, 12)}...</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(log.notice_text_hash, `hash_${log.id}`)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Copy Full Notice SHA-256 Fingerprint"
                          >
                            {copiedId === `hash_${log.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
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
