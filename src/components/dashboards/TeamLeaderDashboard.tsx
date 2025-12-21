import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
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
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, isSameMonth, parseISO } from 'date-fns';

// --- Interfaces ---
interface DashboardMetrics {
  mtdSales: number;
  mtdRevenue: number;
  mtdSalesGrowth: number;
  mtdRevenueGrowth: number;
  ytdSales: number;
  ytdRevenue: number;
  ytdSalesGrowth: number;
  ytdRevenueGrowth: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl: string | null;
  revenue: number;
  area: number;
  salesCount: number;
  targetAchievement: number;
  trend: 'up' | 'down' | 'neutral';
}

interface TeamTargetStatus {
  id: string;
  name: string;
  targetAmount: number;
  achievedAmount: number;
  shortfall: number;
  percentage: number;
}

interface OperationalData {
  projects: { name: string; status: string; salesSqFt: number; imageUrl: string | null }[];
  siteVisits: { total: number; avgPerExec: number; conversionRate: number };
}



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
  const [loading, setLoading] = useState(true);

  // State
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    mtdSales: 0, mtdRevenue: 0, mtdSalesGrowth: 0, mtdRevenueGrowth: 0,
    ytdSales: 0, ytdRevenue: 0, ytdSalesGrowth: 0, ytdRevenueGrowth: 0
  });
  const [salesTrend, setSalesTrend] = useState<{ name: string; revenue: number; area: number }[]>([]);
  const [areaLeaderboard, setAreaLeaderboard] = useState<{ mtd: LeaderboardEntry[]; ytd: LeaderboardEntry[] }>({ mtd: [], ytd: [] });
  const [teamTargets, setTeamTargets] = useState<TeamTargetStatus[]>([]);
  const [operational, setOperational] = useState<OperationalData>({
    projects: [],
    siteVisits: { total: 0, avgPerExec: 0, conversionRate: 0 }
  });

  const permissions = profile?.role_details?.permissions?.dashboard || {
    sales_view: 'team',
    kpi_cards: true,
    project_performance: true,
    leaderboard: true,
    upcoming_events: true,
    recent_activity: true
  };
  const salesView = permissions.sales_view || 'team';

  const loadAllData = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      const now = new Date();
      const currentYearStart = startOfYear(now).toISOString();
      const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
      const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

      // 1. Fetch Team Members
      const { data: teamMembers } = await supabase
        .from('profiles')
        .select('id, full_name, image_url, created_at')
        .eq('reporting_manager_id', profile.id)
        .eq('is_active', true);

      const teamIds = teamMembers?.map(m => m.id) || [];

      if ((salesView as string) === 'none') {
        setMetrics({
          mtdSales: 0, mtdRevenue: 0, mtdSalesGrowth: 0, mtdRevenueGrowth: 0,
          ytdSales: 0, ytdRevenue: 0, ytdSalesGrowth: 0, ytdRevenueGrowth: 0
        });
        setLoading(false);
        return;
      }

      // 2. Fetch Sales Data
      let salesQuery = supabase.from('sales').select('*');

      if (salesView === 'self') {
        salesQuery = salesQuery.eq('sales_executive_id', profile.id);
      } else if (salesView === 'team') {
        salesQuery = salesQuery.in('sales_executive_id', teamIds);
      }

      const { data: allSales } = await salesQuery;
      const sales = allSales || [];
      
      // 3. Calculate MTD Metrics
      const mtdSalesData = sales.filter(s => isSameMonth(parseISO(s.sale_date), now));
      const lastMonthSalesData = sales.filter(s => {
        const d = parseISO(s.sale_date);
        return d >= parseISO(lastMonthStart) && d <= parseISO(lastMonthEnd);
      });

      const mtdRevenue = mtdSalesData.reduce((sum, s) => sum + (s.total_revenue || 0), 0);
      const lastMonthRevenue = lastMonthSalesData.reduce((sum, s) => sum + (s.total_revenue || 0), 0);

      // 4. Calculate YTD Metrics
      const ytdSalesData = sales.filter(s => parseISO(s.sale_date) >= parseISO(currentYearStart));
      const ytdRevenue = ytdSalesData.reduce((sum, s) => sum + (s.total_revenue || 0), 0);

      // Growth Logic
      const cardMetrics: DashboardMetrics = {
        mtdSales: mtdSalesData.length,
        mtdRevenue: mtdRevenue,
        mtdSalesGrowth: lastMonthSalesData.length ? ((mtdSalesData.length - lastMonthSalesData.length) / lastMonthSalesData.length) * 100 : 100,
        mtdRevenueGrowth: lastMonthRevenue ? ((mtdRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 100,
        ytdSales: ytdSalesData.length,
        ytdRevenue: ytdRevenue,
        ytdSalesGrowth: 0,
        ytdRevenueGrowth: 0
      };
      setMetrics(cardMetrics);

      // 5. Sales Trend
      const trendData = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const mKey = format(d, 'MMM');
        const mSales = sales.filter(s => isSameMonth(parseISO(s.sale_date), d));
        trendData.push({
          name: mKey,
          revenue: mSales.reduce((sum, s) => sum + (s.total_revenue || 0), 0),
          area: mSales.reduce((sum, s) => sum + (Number(s.area_sqft) || 0), 0)
        });
      }
      setSalesTrend(trendData);

      // 6. Leaderboard
      const execMap = new Map<string, { name: string, image_url: string | null, area: number, revenue: number, salesCount: number }>();
      teamMembers?.forEach(m => {
        execMap.set(m.id, { name: m.full_name, image_url: m.image_url, area: 0, revenue: 0, salesCount: 0 });
      });

      sales.forEach(s => {
        const exec = execMap.get(s.sales_executive_id);
        if (exec) {
          exec.area += Number(s.area_sqft || 0);
          exec.revenue += Number(s.total_revenue || 0);
          exec.salesCount += 1;
        }
      });

      const leaderData = Array.from(execMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        avatarUrl: data.image_url,
        revenue: data.revenue,
        area: data.area,
        salesCount: data.salesCount,
        targetAchievement: 0,
        trend: 'neutral' as const
      })).sort((a, b) => b.area - a.area);

      setAreaLeaderboard({ mtd: leaderData.slice(0, 5), ytd: leaderData.slice(0, 5) });

      // 7. Team Targets
      const { data: targets } = await supabase
        .from('sales_targets')
        .select('*')
        .in('sales_executive_id', teamIds)
        .eq('month', now.getMonth() + 1)
        .eq('year', now.getFullYear());

      const targetStatus = teamMembers?.map(m => {
        const t = targets?.find(target => target.sales_executive_id === m.id);
        const achievedSqft = sales.filter(s => s.sales_executive_id === m.id && isSameMonth(parseISO(s.sale_date), now))
          .reduce((sum, s) => sum + Number(s.area_sqft || 0), 0);
        const targetSqft = Number(t?.target_sqft || 0);

        return {
          id: m.id,
          name: m.full_name,
          targetAmount: targetSqft,
          achievedAmount: achievedSqft,
          shortfall: Math.max(0, targetSqft - achievedSqft),
          percentage: targetSqft > 0 ? (achievedSqft / targetSqft) * 100 : 0
        };
      }) || [];
      setTeamTargets(targetStatus);

      // 8. Operational Oversight
      const { data: projectsData } = await supabase
        .from('projects')
        .select('name, is_active, id, site_photos')
        .eq('is_active', true)
        .limit(10);

      const projectSalesMap = new Map<string, number>();
      sales.forEach(s => {
        projectSalesMap.set(s.project_id, (projectSalesMap.get(s.project_id) || 0) + Number(s.area_sqft || 0));
      });

      const { count: totalVisits } = await supabase
        .from('site_visits')
        .select('*', { count: 'exact', head: true })
        .in('assigned_to_id', teamIds);

      const conversion = sales.length > 0 && totalVisits ? (sales.length / totalVisits) * 100 : 0;

      setOperational({
        projects: projectsData?.map(p => ({
          name: p.name,
          status: 'Active',
          salesSqFt: projectSalesMap.get(p.id) || 0,
          imageUrl: p.site_photos?.[0] || null
        })).sort((a, b) => b.salesSqFt - a.salesSqFt).slice(0, 4) || [],
        siteVisits: {
          total: totalVisits || 0,
          avgPerExec: teamIds.length ? ((totalVisits || 0) / teamIds.length) : 0,
          conversionRate: conversion
        }
      });

    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setLoading(false);
    }
  }, [profile, salesView]);

  useEffect(() => {
    if (profile?.id) {
      loadAllData();
    }
  }, [profile, loadAllData]);

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
              <h1 className="text-3xl font-bold tracking-tight">Team Overview, {profile?.full_name?.split(' ')[0]}! 👋</h1>
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
            value={metrics.mtdSales}
            icon={TrendingUp}
            trend={{ value: metrics.mtdSalesGrowth, isPositive: metrics.mtdSalesGrowth >= 0 }}
            iconBgColor="bg-blue-500/10"
            iconColor="text-blue-600"
          />
          <KPICard
            title="MTD Revenue"
            value={metrics.mtdRevenue}
            icon={DollarSign}
            trend={{ value: metrics.mtdRevenueGrowth, isPositive: metrics.mtdRevenueGrowth >= 0 }}
            formatter={(val) => formatCurrency(val, true)}
            iconBgColor="bg-emerald-500/10"
            iconColor="text-emerald-600"
          />
          <KPICard
            title="YTD Team Sales"
            value={metrics.ytdSales}
            icon={Award}
            iconBgColor="bg-purple-500/10"
            iconColor="text-purple-600"
          />
          <KPICard
            title="YTD Total Revenue"
            value={metrics.ytdRevenue}
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
                  <AreaChart data={salesTrend}>
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
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
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
                    {teamTargets.map((t) => (
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
              <div className={`grid gap-4 ${operational.projects.length === 1 ? 'grid-cols-1' :
                  operational.projects.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                    operational.projects.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}>
                {operational.projects.map((p, idx) => {
                  const count = operational.projects.length;
                  const isFifthItem = count === 5 && idx === 4;
                  const itemClass = isFifthItem ? "col-span-1 sm:col-span-2 lg:col-span-4" : "";

                  return (
                    <div key={idx} className={`p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 overflow-hidden relative group ${itemClass}`}>
                      <div className="relative z-10">
                        <h4 className="font-bold text-gray-800 dark:text-white truncate">{p.name}</h4>
                        <p className="text-xs text-gray-400 mt-1 font-medium">{p.salesSqFt.toLocaleString()} sq ft sold by team</p>
                      </div>
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building size={40} />
                      </div>
                    </div>
                  );
                })}
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
                  <span className="block text-2xl font-black text-rose-600 dark:text-rose-400">{operational.siteVisits.total}</span>
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Site Visits</span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl text-center">
                  <span className="block text-2xl font-black text-blue-600 dark:text-blue-400">{operational.siteVisits.avgPerExec.toFixed(1)}</span>
                  <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Avg/Exec</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl text-center">
                  <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">{operational.siteVisits.conversionRate.toFixed(1)}%</span>
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
                {areaLeaderboard.mtd.length > 0 ? (
                  areaLeaderboard.mtd.map((entry, index) => (
                    <LeaderboardItem
                      key={entry.id}
                      rank={index + 1}
                      name={entry.name}
                      area={entry.area}
                      image_url={entry.avatarUrl}
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
                {areaLeaderboard.ytd.length > 0 ? (
                  areaLeaderboard.ytd.map((entry, index) => (
                    <LeaderboardItem
                      key={entry.id}
                      rank={index + 1}
                      name={entry.name}
                      area={entry.area}
                      image_url={entry.avatarUrl}
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
