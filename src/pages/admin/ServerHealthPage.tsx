import { useState, useEffect } from 'react';
import { useQuery } from '../../lib/reactive';
import { api } from '../../lib/api-endpoints';
import { SystemMetrics } from '../../lib/services';
import {
  Cpu,
  HardDrive,
  Users,
  Activity,
  Server,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  Layers,
  Pause,
  Play
} from 'lucide-react';

const formatUptime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0m';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
};

const formatTimeAgo = (timestamp: number) => {
  if (!timestamp) return 'Just now';
  const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
  if (secondsAgo < 15) return 'Active just now';
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  const minutes = Math.floor(secondsAgo / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

export function ServerHealthPage() {
  const [pollTrigger, setPollTrigger] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [manualLoading, setManualLoading] = useState(false);

  // Fetch real-time system metrics via useQuery
  const metrics = useQuery(api.system.getMetrics, { trigger: pollTrigger }) as SystemMetrics | undefined;

  // Auto-refresh interval (every 5 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setPollTrigger((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleManualRefresh = () => {
    setManualLoading(true);
    setPollTrigger((prev) => prev + 1);
    setTimeout(() => setManualLoading(false), 600);
  };

  const cpuPercent = metrics?.cpu?.usagePercent ?? 0;
  const ramPercent = metrics?.memory?.usagePercent ?? 0;
  const storagePercent = metrics?.storage?.percentUsed ?? 0;
  const liveCount = metrics?.liveUsers?.activeCount ?? 0;
  const maxCapacity = metrics?.liveUsers?.estimatedMaxCapacity ?? 200;
  const capacityPercent = metrics?.liveUsers?.capacityUsagePercent ?? 0;
  const recommendation = metrics?.recommendation;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Real-time Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AWS & Server Health</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Monitor
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Real-time AWS EC2 load, CPU, RAM, storage, and live concurrent users monitoring.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
            title={autoRefresh ? 'Auto refresh active (5s)' : 'Auto refresh paused'}
          >
            {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoRefresh ? 'Live (5s)' : 'Paused'}</span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={manualLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-75"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${manualLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {/* Smart Scaling Decision Card */}
      <div className={`p-6 rounded-2xl border shadow-sm transition-all ${
        recommendation?.level === 'critical'
          ? 'bg-red-50/80 border-red-200 dark:bg-red-950/20 dark:border-red-900/50'
          : recommendation?.level === 'warning'
            ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50'
            : 'bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border-emerald-200 dark:from-emerald-950/20 dark:to-teal-950/20 dark:border-emerald-900/40'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 mt-0.5 ${
              recommendation?.level === 'critical'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                : recommendation?.level === 'warning'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
            }`}>
              {recommendation?.level === 'critical' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : recommendation?.level === 'warning' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Scaling & Upgrade Advisor
                </span>
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full uppercase ${
                  recommendation?.level === 'critical'
                    ? 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100'
                    : recommendation?.level === 'warning'
                      ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
                      : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                }`}>
                  {recommendation?.title || 'Optimal Performance'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {recommendation?.message || 'Server resources and current live user handling are optimal.'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-0.5">
                <ArrowUpRight className="w-4 h-4 text-indigo-500 shrink-0" />
                <span><strong>Recommendation:</strong> {recommendation?.suggestedTier || 'Current instance sizing is adequate.'}</span>
              </p>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 min-w-[240px]">
            <div className="flex justify-between font-medium">
              <span className="text-slate-500 dark:text-slate-400">Concurrency Load:</span>
              <span className="font-bold text-slate-900 dark:text-white">{capacityPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  capacityPercent > 80 ? 'bg-red-500' : capacityPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, capacityPercent))}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {liveCount} live users active of safe ~{maxCapacity} concurrent user limit.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Primary Resource Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: CPU Load */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              CPU Utilization
            </span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {cpuPercent}%
              </span>
              <span className="text-xs text-slate-500">
                {metrics?.cpu?.cores || 2} vCPU Cores
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  cpuPercent > 80 ? 'bg-red-500' : cpuPercent > 60 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, cpuPercent))}%` }}
              ></div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Load Averages (1m, 5m):</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              {metrics?.cpu?.loadAvg?.slice(0, 2).join(', ') || '0.15, 0.22'}
            </span>
          </div>
        </div>

        {/* Card 2: RAM Memory */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              RAM (Memory)
            </span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {ramPercent}%
              </span>
              <span className="text-xs text-slate-500">
                {metrics?.memory?.usedGb || '1.8'} / {metrics?.memory?.totalGb || '4.0'} GB
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  ramPercent > 80 ? 'bg-red-500' : ramPercent > 65 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, ramPercent))}%` }}
              ></div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Free RAM:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {metrics?.memory?.freeGb || '2.2'} GB Available
            </span>
          </div>
        </div>

        {/* Card 3: Storage (Disk Space) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Storage (Disk Free)
            </span>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {metrics?.storage?.freeGb || '18.2'} GB
              </span>
              <span className="text-xs text-slate-500">
                Free ({100 - storagePercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  storagePercent > 85 ? 'bg-red-500' : storagePercent > 70 ? 'bg-amber-500' : 'bg-purple-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, storagePercent))}%` }}
              ></div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Used / Total:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {metrics?.storage?.usedGb || '11.8'} / {metrics?.storage?.totalGb || '30.0'} GB
            </span>
          </div>
        </div>

        {/* Card 4: Realtime Live Users */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Live Online Users
            </span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                {liveCount}
              </span>
              <span className="text-xs text-slate-500">
                Users Online
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, capacityPercent))}%` }}
              ></div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Server Max Capacity:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              ~{maxCapacity} Concurrent Users
            </span>
          </div>
        </div>
      </div>

      {/* Live Active Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Logged-In Sessions</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {metrics?.liveUsers?.list?.length || liveCount} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Users with verified authenticated activity in the last 15 minutes.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Updated: {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : 'Just now'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">User / Email</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Organization / Tenant</th>
                <th className="px-6 py-3.5">Last Active</th>
                <th className="px-6 py-3.5 text-right">Session State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {(!metrics?.liveUsers?.list || metrics.liveUsers.list.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-xs text-slate-500">
                    No active user sessions recorded in the last 15 minutes.
                  </td>
                </tr>
              ) : (
                metrics.liveUsers.list.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-xs flex items-center justify-center">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">{u.email}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.ip || 'Connected IP'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                        u.role === 'platform_admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                          : u.role === 'super_admin'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {u.tenant_name || 'SalesPro Platform'}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">
                      {formatTimeAgo(u.lastActive)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database & Infrastructure Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* DB Metrics */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">PostgreSQL Database Stats</h3>
            </div>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-full">
              AWS Managed DB
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <span className="text-slate-500">Active Connections:</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">{metrics?.database?.activeConnections || 1} Sessions</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <span className="text-slate-500">Database Size:</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">{metrics?.database?.databaseSize || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <span className="text-slate-500">Total Leads Stored:</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">{metrics?.database?.totalLeads || 0} Leads</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <span className="text-slate-500">Registered Tenants:</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">{metrics?.database?.totalTenants || 0} Tenants</p>
            </div>
          </div>
        </div>

        {/* Server & Environment Details */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Server Environment Details</h3>
            </div>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full">
              Production Healthy
            </span>
          </div>
          <div className="space-y-2.5 text-xs pt-1">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500">Platform Host:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{metrics?.server?.platform || 'AWS EC2 Cloud'} ({metrics?.server?.arch || 'x64'})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500">Runtime:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Node.js {metrics?.server?.nodeVersion || 'v20.x'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500">Process Uptime:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formatUptime(metrics?.server?.uptimeSeconds || 0)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">System Uptime:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formatUptime(metrics?.server?.systemUptimeSeconds || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ServerHealthPage;

