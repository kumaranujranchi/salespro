import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { KPICard } from '../ui/KPICard';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CelebrationCards } from '../sales-executive/CelebrationCards';
import {
  TrendingUp, DollarSign, Target,
  Award, MapPin, Briefcase,
  Activity, Building
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { format } from 'date-fns';

const LeaderboardItem = ({ rank, name, area, image_url }: { rank: number, name: string, area: number, image_url?: string | null }) => {
  const getBorderColor = (rank: number) => {
    if (rank === 1) return 'border-yellow-400';
    if (rank === 2) return 'border-gray-300';
    if (rank === 3) return 'border-orange-400';
    return 'border-blue-100 dark:border-blue-500/20';
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-orange-400 text-white';
    return 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
  };

  return (
    <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors group">
      <div className="flex items-center gap-4">
        <div className={`relative w-12 h-12 rounded-full border-2 p-0.5 ${getBorderColor(rank)}`}>
          {image_url ? (
            <img src={image_url} alt={name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-sm font-bold text-slate-400 dark:text-gray-400">
              {name.charAt(0)}
            </div>
          )}
          <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ring-1 ring-white dark:ring-surface-highlight ${getRankBg(rank)}`}>
            {rank}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{name}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">Sales Executive</span>
        </div>
      </div>
      <div className="text-right">
        <span className="block font-bold text-gray-900 dark:text-gray-200">{area.toLocaleString()}</span>
        <span className="text-xs text-gray-500 dark:text-gray-500 font-medium">Sq ft</span>
      </div>
    </div>
  );
};

export function TeamLeaderDashboard() {
  const { profile } = useAuth();
  
  const tenantId = profile?.tenant_id as Id<"tenants">;
  const profileId = profile?.id as Id<"profiles">;

  const permissions = profile?.role_details?.permissions?.dashboard || {
    sales_view: 'team',
    kpi_cards: true,
    project_performance: true,
    leaderboard: true,
    upcoming_events: true,
    recent_activity: true
  };
  const salesView = permissions.sales_view || 'team';

  // Convex Queries
  const overview = useQuery(api.sales.getSalesOverview, 
    (tenantId && profileId) ? { tenant_id: tenantId, executive_id: profileId, view: salesView } : "skip"
  );
  
  const mtdLeaderboard = useQuery(api.sales.getLeaderboard, 
    tenantId ? { tenant_id: tenantId, timeFilter: 'this_month', roleFilter: 'all' } : "skip"
  );
  
  const ytdLeaderboard = useQuery(api.sales.getLeaderboard, 
    tenantId ? { tenant_id: tenantId, timeFilter: 'this_year', roleFilter: 'all' } : "skip"
  );

  const loading = !overview;

  if (loading) {
    return <LoadingSpinner size="lg" fullScreen />;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-900/80 dark:to-teal-900/80 rounded-3xl p-8 shadow-2xl shadow-emerald-200 dark:shadow-none border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-white">
          <div className="flex items-center gap-5">
            <div className="p-1 bg-white/20 rounded-2xl backdrop-blur-sm">
              {profile?.image_url ? (
                <img src={profile.image_url} alt={profile.full_name || 'User'} className="w-16 h-16 rounded-xl object-cover border-2 border-white/50" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-bold border-2 border-white/50">
                  {profile?.full_name?.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome Back, {profile?.full_name?.split(' ')[0]}!</h1>
              <p className="text-emerald-50 text-base font-medium opacity-90">Monitor your team's sales performance and operational targets.</p>
            </div>
          </div>
          <div className="px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-sm font-semibold shadow-inner">
            {format(new Date(), 'EEEE, do MMMM')}
          </div>
        </div>
      </div>

      {permissions.kpi_cards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="MTD Team Sales"
            value={overview.mySales}
            icon={TrendingUp}
            iconBgColor="bg-blue-500/10"
            iconColor="text-blue-600"
          />
          <KPICard
            title="MTD Revenue"
            value={overview.monthlyRevenue}
            icon={DollarSign}
            formatter={(val) => formatCurrency(val, true)}
            iconBgColor="bg-emerald-500/10"
            iconColor="text-emerald-600"
          />
          <KPICard
            title="YTD Team Sales"
            value={overview.ytdSalesCount}
            icon={Award}
            iconBgColor="bg-purple-500/10"
            iconColor="text-purple-600"
          />
          <KPICard
            title="YTD Total Revenue"
            value={overview.ytdRevenue}
            icon={Target}
            formatter={(val) => formatCurrency(val, true)}
            iconBgColor="bg-orange-500/10"
            iconColor="text-orange-600"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {salesView !== 'none' && (
          <Card className="lg:col-span-2 rounded-3xl border-0 shadow-lg shadow-gray-200/50 dark:shadow-none ring-1 ring-gray-100 dark:ring-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="text-emerald-500" size={20} />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview.salesTrend}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {salesView !== 'none' && (
          <Card className="rounded-3xl border-0 shadow-lg shadow-gray-200/50 dark:shadow-none ring-1 ring-gray-100 dark:ring-white/10 overflow-hidden">
            <CardHeader className="border-b border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Target className="text-blue-500" size={20} />
                Monthly Team Targets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-400 font-bold text-[10px] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">Executive</th>
                      <th className="px-4 py-3 text-right">Progress</th>
                      <th className="px-4 py-3 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                    {overview.teamTargets.map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">{t.name}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-[10px] text-gray-400 font-medium mb-1">
                            {t.achievedAmount.toLocaleString()} / {t.targetAmount.toLocaleString()}
                          </div>
                          <div className="w-24 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full ml-auto overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${t.percentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(t.percentage, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">{t.percentage.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {permissions.project_performance && (
          <Card className="rounded-3xl border-0 shadow-lg shadow-gray-200/50 dark:shadow-none ring-1 ring-gray-100 dark:ring-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="text-purple-500" size={20} />
                Project Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {overview.projectStats.map((p: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 overflow-hidden relative group">
                    <div className="relative z-10">
                      <h4 className="font-bold text-gray-800 dark:text-white truncate">{p.name}</h4>
                      <p className="text-xs text-gray-400 mt-1 font-medium">{p.area.toLocaleString()} sq ft sold by team</p>
                    </div>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Building size={40} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {permissions.recent_activity && (
          <Card className="rounded-3xl border-0 shadow-lg shadow-gray-200/50 dark:shadow-none ring-1 ring-gray-100 dark:ring-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <MapPin className="text-rose-500" size={20} />
                Operational Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl text-center">
                  <span className="block text-2xl font-black text-rose-600 dark:text-rose-400">{overview.siteVisits.total}</span>
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Site Visits</span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl text-center">
                  <span className="block text-2xl font-black text-blue-600 dark:text-blue-400">{overview.siteVisits.avgPerExec.toFixed(1)}</span>
                  <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Avg/Exec</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl text-center">
                  <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">{overview.siteVisits.conversionRate.toFixed(1)}%</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Conversion</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {permissions.leaderboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4 bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="p-2 bg-amber-50 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-500/30">
                    <Award size={20} />
                  </div>
                  Monthly Top Performers
                </CardTitle>
                <div className="px-3 py-1 bg-amber-100 dark:bg-amber-500/20 rounded-full text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider ring-1 ring-amber-200/50 dark:ring-amber-500/30">
                  MTD
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {(mtdLeaderboard || []).length > 0 ? (
                  mtdLeaderboard?.map((entry, index) => (
                    <LeaderboardItem
                      key={entry.id}
                      rank={index + 1}
                      name={entry.name}
                      area={entry.revenue} // The leaderboard query currently returns revenue sorted data
                      image_url={entry.image_url}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400 italic">No sales data recorded this month</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4 bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-500/30">
                    <Award size={20} />
                  </div>
                  Yearly Top Performers
                </CardTitle>
                <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider ring-1 ring-indigo-200/50 dark:ring-indigo-500/30">
                  YTD
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {(ytdLeaderboard || []).length > 0 ? (
                  ytdLeaderboard?.map((entry, index) => (
                    <LeaderboardItem
                      key={entry.id}
                      rank={index + 1}
                      name={entry.name}
                      area={entry.revenue}
                      image_url={entry.image_url}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400 italic">No sales data recorded this year</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {permissions.upcoming_events && (
        <CelebrationCards />
      )}
    </div>
  );
}
