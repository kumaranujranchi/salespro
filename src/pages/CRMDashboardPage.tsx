import { useMemo, useState } from 'react';
import { useQuery } from "convex/react";
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { KPICard } from '../components/ui/KPICard';
import { Link } from 'react-router-dom';
import {
  Users, TrendingUp, Clock, MapPin, CheckCircle2,
  XCircle, PhoneCall, Globe, UserPlus, Phone, UserCheck, Calendar, Info
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRM Dashboard</h1>
          <p className="text-gray-500">Overview of leads and conversion funnel</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Total Leads" value={stats.totalLeads} icon={Users} iconColor="text-blue-600" iconBgColor="bg-blue-100" />
        <KPICard title="Open" value={stats.openLeads} icon={Clock} iconColor="text-yellow-600" iconBgColor="bg-yellow-100" />
        <KPICard title="In Progress" value={stats.inProgress} icon={TrendingUp} iconColor="text-purple-600" iconBgColor="bg-purple-100" />
        <KPICard title="Site Visit" value={stats.siteVisitDone} icon={MapPin} iconColor="text-green-600" iconBgColor="bg-green-100" />
        <KPICard title="Converted" value={stats.converted} icon={CheckCircle2} iconColor="text-emerald-600" iconBgColor="bg-emerald-100" />
        <KPICard title="Walk-in" value={stats.walkInLeads} icon={Users} iconColor="text-orange-600" iconBgColor="bg-orange-100" />
      </div>

      {/* New Call Overview & Agent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Overview Widget */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-white">Call Overview</CardTitle>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold shadow-sm focus:outline-none cursor-pointer transition-all duration-200"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="all_time">All Time</option>
            </select>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 items-center">
            {/* Chart Area */}
            <div className="relative flex justify-center items-center h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    <Cell key="cell-0" fill="#7C3AED" />
                    <Cell key="cell-1" fill="#E9D5FF" className="dark:fill-slate-700" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
                <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
                  {percentage.toFixed(2)}%
                </div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Connected
                </div>
              </div>
            </div>

            {/* Breakup Details */}
            <div className="flex flex-col justify-center gap-5 sm:pl-8 sm:border-l border-slate-100 dark:border-white/5">
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
          </CardContent>
        </Card>

        {/* Agent Activity Widget */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-white">Agent Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center flex-1 py-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                {/* Runner Icon Style representation */}
                <Users size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
                  Active Agents
                  <span className="cursor-help text-slate-300 hover:text-slate-400 transition-colors" title="Agents who created at least one follow-up in the selected period">
                    <Info size={14} />
                  </span>
                </div>
                <div className="text-4xl font-extrabold text-slate-800 dark:text-white flex items-baseline">
                  {activeAgents}
                  <span className="text-lg font-bold text-slate-400 ml-1">
                    /{totalAgents}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card>
            <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
            <CardContent>
               <div className="space-y-4">
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
         
         <div className="space-y-4">
            <Link to="/leads" className="block">
               <Card className="bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  <CardContent className="p-6">
                     <h3 className="text-xl font-bold mb-1">Manage Leads</h3>
                     <p className="opacity-80 text-sm">View full lead list and follow-up history</p>
                  </CardContent>
               </Card>
            </Link>
            <Link to="/crm/pipeline" className="block">
               <Card className="bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                  <CardContent className="p-6">
                     <h3 className="text-xl font-bold mb-1">Sales Pipeline</h3>
                     <p className="opacity-80 text-sm">Visualize your conversion stages</p>
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
