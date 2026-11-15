import { useMemo, useState } from 'react';
import { useQuery } from "../lib/reactive";
import { api, Id } from '../lib/api-endpoints';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { KPICard } from '../components/ui/KPICard';
import { Link } from 'react-router-dom';
import {
  Users, TrendingUp, Clock, MapPin, CheckCircle2,
  XCircle, PhoneCall, Globe, UserPlus, Phone, UserCheck, Calendar, Info,
  ChevronDown, ArrowRight
} from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function CRMDashboardPage() {
  const { profile } = useAuth();
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'all_time'>('today');
  const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
  
  const stats = useQuery(api.leads.getDashboardStats, profile?.tenant_id ? {
    tenant_id: profile.tenant_id as Id<"tenants">,
    executive_id: normalizedRole === 'sales_executive' ? profile.id as Id<"profiles"> : undefined,
    callerProfileId: profile.id as Id<"profiles">
  } : "skip");

  const periodStats = useMemo(() => {
    if (!stats?.callOverview) return { total: 0, connected: 0 };
    return stats.callOverview[timeFilter] || { total: 0, connected: 0 };
  }, [stats, timeFilter]);

  const activeAgents = useMemo(() => {
    if (!stats?.agentActivity) return 0;
    return stats.agentActivity[timeFilter] || 0;
  }, [stats, timeFilter]);

  const totalAgents = useMemo(() => {
    if (!stats?.agentActivity) return 0;
    return stats.agentActivity.total || 0;
  }, [stats]);

  const percentage = useMemo(() => {
    if (periodStats.total === 0) return 0;
    return (periodStats.connected / periodStats.total) * 100;
  }, [periodStats]);

  const chartData = useMemo(() => {
    if (periodStats.total === 0) {
      return [
        { name: 'Connected', value: 0 },
        { name: 'Unconnected', value: 1 }
      ];
    }
    return [
      { name: 'Connected', value: periodStats.connected },
      { name: 'Unconnected', value: Math.max(0, periodStats.total - periodStats.connected) }
    ];
  }, [periodStats]);

  if (!stats) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center pb-1 sm:pb-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">CRM Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500">Overview of leads and conversion funnel</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <KPICard title="Total Leads" value={stats.totalLeads} icon={Users} iconColor="text-blue-600" iconBgColor="bg-blue-100" />
        <KPICard title="Open" value={stats.openLeads} icon={Clock} iconColor="text-yellow-600" iconBgColor="bg-yellow-100" />
        <KPICard title="In Progress" value={stats.inProgress} icon={TrendingUp} iconColor="text-purple-600" iconBgColor="bg-purple-100" />
        <KPICard title="Site Visit" value={stats.siteVisitDone} icon={MapPin} iconColor="text-green-600" iconBgColor="bg-green-100" />
        <KPICard title="Converted" value={stats.converted} icon={CheckCircle2} iconColor="text-emerald-600" iconBgColor="bg-emerald-100" />
        <KPICard title="Walk-in" value={stats.walkInLeads} icon={Users} iconColor="text-orange-600" iconBgColor="bg-orange-100" />
      </div>

      {/* Call Overview & Agent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Call Overview Widget */}
        <Card className="lg:col-span-2 overflow-hidden rounded-2xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                <PhoneCall size={16} />
              </div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Call Overview</CardTitle>
            </div>
            
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="appearance-none pl-3 pr-7 py-1.5 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold shadow-xs focus:outline-none cursor-pointer hover:bg-purple-100/60 transition-colors"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="all_time">All Time</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 items-center">
              {/* Chart Area */}
              <div className="relative flex justify-center items-center h-32 sm:h-36 min-w-0 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={58}
                      outerRadius={78}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      <Cell key="cell-0" fill="#7C3AED" />
                      <Cell key="cell-1" fill="#E9D5FF" className="dark:fill-slate-700" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {percentage.toFixed(2)}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Connected
                  </div>
                </div>
              </div>

              {/* Mobile 2-Column Stats Micro-Grid (Visible on mobile only) */}
              <div className="grid grid-cols-2 gap-2.5 w-full sm:hidden">
                <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">Connected</span>
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {periodStats.connected}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">calls</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Total Dialed</span>
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {periodStats.total}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">calls</span>
                  </div>
                </div>
              </div>

              {/* Desktop Breakup Details (100% Preserved for Desktop) */}
              <div className="hidden sm:flex flex-col justify-center gap-5 sm:pl-8 sm:border-l border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-10 rounded-full bg-[#7C3AED]" />
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Connected</div>
                    <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5">
                      {periodStats.connected}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-10 rounded-full bg-[#E9D5FF] dark:bg-slate-700" />
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Total</div>
                    <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5">
                      {periodStats.total}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Activity Widget */}
        <Card className="flex flex-col justify-between overflow-hidden rounded-2xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Users size={16} />
              </div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Agent Activity</CardTitle>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0}% Active
            </span>
          </CardHeader>
          <CardContent className="flex flex-col justify-between flex-1 p-4 sm:p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0 border border-emerald-500/20">
                <Users size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 font-medium">
                  Active Sales Agents
                  <span className="cursor-help text-slate-300 hover:text-slate-400 transition-colors" title="Agents who created at least one follow-up in the selected period">
                    <Info size={13} />
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-baseline mt-0.5">
                  {activeAgents}
                  <span className="text-base sm:text-lg font-bold text-slate-400 ml-1">
                    /{totalAgents}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Progress Bar & Micro pills for Mobile and Desktop */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="w-full h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalAgents > 0 ? Math.min(100, (activeAgents / totalAgents) * 100) : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{activeAgents} Engaged</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                  <span>{Math.max(0, totalAgents - activeAgents)} Idle</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
         <Card className="rounded-2xl shadow-xs">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-white/5">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Leads by Source</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
               <div className="space-y-3.5">
                  <SourceBar label="Referral" count={stats.referralLeads || 0} total={stats.totalLeads} color="bg-indigo-500" />
                  <SourceBar label="99acres" count={stats.acresLeads || 0} total={stats.totalLeads} color="bg-yellow-500" />
                  <SourceBar label="MagicBrick" count={stats.magicBrickLeads || 0} total={stats.totalLeads} color="bg-red-500" />
                  <SourceBar label="Housing" count={stats.housingLeads || 0} total={stats.totalLeads} color="bg-blue-500" />
                  <SourceBar label="Meta" count={stats.metaLeads || 0} total={stats.totalLeads} color="bg-pink-500" />
                  <SourceBar label="Google" count={stats.googleLeads || 0} total={stats.totalLeads} color="bg-emerald-500" />
                  <SourceBar label="Walk-in" count={stats.walkInLeads || 0} total={stats.totalLeads} color="bg-gray-500" />
               </div>
            </CardContent>
         </Card>
         
         <div className="space-y-3 sm:space-y-4">
            <Link to="/leads" className="block group">
               <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all rounded-2xl shadow-xs border-0">
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                     <div>
                        <h3 className="text-base sm:text-lg font-bold mb-0.5">Manage Leads</h3>
                        <p className="opacity-80 text-xs">View full lead list and follow-up timeline</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                        <ArrowRight size={16} />
                     </div>
                  </CardContent>
               </Card>
            </Link>
            <Link to="/crm/pipeline" className="block group">
               <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-all rounded-2xl shadow-xs border-0">
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                     <div>
                        <h3 className="text-base sm:text-lg font-bold mb-0.5">Sales Pipeline</h3>
                        <p className="opacity-80 text-xs">Visualize conversion stages & deal velocity</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                        <ArrowRight size={16} />
                     </div>
                  </CardContent>
               </Card>
            </Link>
         </div>
      </div>
    </div>
  );
}

function SourceBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
   const percentage = total > 0 ? (count / total) * 100 : 0;
   return (
      <div className="space-y-1">
         <div className="flex justify-between text-sm">
            <span>{label}</span>
            <span className="font-bold">{count}</span>
         </div>
         <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
         </div>
      </div>
   );
}
