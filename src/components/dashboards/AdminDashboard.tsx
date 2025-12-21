import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { KPICard } from '../ui/KPICard';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import {
  TrendingUp,
  DollarSign,
  Megaphone,
  Award,
  CreditCard,
  Sparkles,
  Building
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { RecentActivityLog } from './widgets/RecentActivityLog';
import { ActivityCalendar } from './widgets/ActivityCalendar';
import { UpcomingEvents } from './widgets/UpcomingEvents';
import { Select } from '../ui/Select';
import { motion, AnimatePresence } from 'framer-motion';


interface DashboardStats {
  totalProjects: number;
  totalTeamMembers: number;
  totalDepartments: number;
  monthlySales: number;
  monthlyRevenue: number;
  ytdSales: number;
  ytdRevenue: number;
  projectStats: { name: string; area: number }[];
}

interface ChartData {
  name: string;
  sales: number;
  revenue: number;
  collections: number;
}

interface LeaderboardUser {
  id: string;
  name: string;
  salesCount: number;
  revenue: number;
  image_url: string | null;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_important: boolean;
}

export function AdminDashboard() {
  const { profile, tenant } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalTeamMembers: 0,
    totalDepartments: 0,
    monthlySales: 0,
    monthlyRevenue: 0,
    ytdSales: 0,
    ytdRevenue: 0,
    projectStats: []
  });

  const [salesChartData, setSalesChartData] = useState<ChartData[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<LeaderboardUser[]>([]);

  // Sales Data Storage for Client-side Filtering
  const [allSales, setAllSales] = useState<any[]>([]);

  // Filters
  const [leaderboardTimeFilter, setLeaderboardTimeFilter] = useState<'today' | 'this_week' | 'this_month' | 'this_year'>('this_month');
  const [leaderboardRoleFilter, setLeaderboardRoleFilter] = useState<'all' | 'sales_executive' | 'team_leader'>('all');

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const yearStart = `${currentYear}-01-01`;

      const currentPermissions = profile?.role_details?.permissions?.dashboard || { sales_view: 'overall' as const };
      const salesView = currentPermissions.sales_view || 'overall';

      // Fetch team members if salesView is 'team'
      let teamIds: string[] = [];
      if (salesView === 'team') {
        const { data: teamMembers } = await supabase
          .from('profiles')
          .select('id')
          .eq('reporting_manager_id', profile?.id)
          .eq('is_active', true);
        teamIds = teamMembers?.map(m => m.id) || [];
      }

      // 1. Fetch Basic Metrics
      const [
        { count: projectCount },
        { count: teamCount },
        { count: departmentCount },
        // { data: activities } - Fetched separately to prevent crash
        { data: allTimeProjectSales },
        { data: projectsData }
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('departments').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('sales').select('project_id, area_sqft').filter('sales_executive_id', salesView === 'self' ? 'eq' : 'neq', salesView === 'self' ? profile?.id : '00000000-0000-0000-0000-000000000000'),
        supabase.from('projects').select('id, name')
      ]);

      // Fetch Activity Logs separately
      try {
        const { data: activities } = await supabase
          .from('activity_logs')
          .select('*')
          .limit(50);

        if (activities) {
          setActivityLogs(activities);
        }
      } catch (logError) {
        console.warn('Failed to load activity logs', logError);
      }

      // Calculate Project Performance (All Time)
      const projectAreaMap = new Map<string, number>();
      projectsData?.forEach(p => projectAreaMap.set(p.id, 0));

      allTimeProjectSales?.forEach(sale => {
        if (sale.project_id) {
          const currentValue = projectAreaMap.get(sale.project_id) || 0;
          projectAreaMap.set(sale.project_id, currentValue + Number(sale.area_sqft || 0));
        }
      });

      const topProjects = projectsData?.map(p => ({
        name: p.name,
        area: projectAreaMap.get(p.id) || 0
      })).sort((a, b) => b.area - a.area).slice(0, 4) || [];

      // Calculate Project Performance (All Time)


      // 2. Fetch Sales Data for Metrics, Charts & Leaderboard
      let salesQuery = supabase
        .from('sales')
        .select(`
          id,
          sale_date,
          total_revenue,
          sales_executive_id,
          profile:sales_executive_id (full_name, image_url, role)
        `);

      if (salesView === 'self') {
        salesQuery = salesQuery.eq('sales_executive_id', profile?.id);
      } else if (salesView === 'team' && teamIds.length > 0) {
        salesQuery = salesQuery.in('sales_executive_id', teamIds);
      }

      const { data: yearSales } = await salesQuery
        .gte('sale_date', yearStart)
        .order('sale_date', { ascending: true });

      if (yearSales) {
        setAllSales(yearSales);
      }

      const { data: recentSalesReal } = await supabase
        .from('sales')
        .select('*, customer:customer_id(name), project:project_id(name), profile:sales_executive_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(6);

      if (recentSalesReal) setRecentSales(recentSalesReal);

      // Fetch Payments for Collection Graph
      const { data: yearPayments } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .gte('payment_date', yearStart);


      // Process Sales Data for Stats & Chart
      let mSales = 0;
      let mRevenue = 0;
      let ySales = 0;
      let yRevenue = 0;

      const salesByMonth = new Map<string, { sales: number; revenue: number; collections: number }>();

      // Initialize months
      for (let i = 0; i < 12; i++) {
        const d = new Date(currentYear, i, 1);
        if (d > now) break;
        const monthKey = d.toLocaleString('default', { month: 'short' });
        salesByMonth.set(monthKey, { sales: 0, revenue: 0, collections: 0 });
      }

      yearSales?.forEach((sale: { sale_date: string; total_revenue: number }) => {
        const date = new Date(sale.sale_date);
        const monthKey = date.toLocaleString('default', { month: 'short' });

        // Update Stats
        ySales++;
        yRevenue += Number(sale.total_revenue);

        if (sale.sale_date >= monthStart) {
          mSales++;
          mRevenue += Number(sale.total_revenue);
        }

        // Update Chart Data
        const currentData = salesByMonth.get(monthKey) || { sales: 0, revenue: 0, collections: 0 };
        salesByMonth.set(monthKey, {
          ...currentData,
          sales: currentData.sales + 1,
          revenue: currentData.revenue + Number(sale.total_revenue),
        });
      });

      // Integrate Payments
      yearPayments?.forEach((pay: { payment_date: string; amount: number }) => {
        const date = new Date(pay.payment_date);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        const currentData = salesByMonth.get(monthKey);
        if (currentData) {
          currentData.collections += Number(pay.amount);
        }
      });

      // Prepare Chart Data
      const chartData: ChartData[] = Array.from(salesByMonth.entries()).map(([name, data]) => ({
        name,
        sales: data.sales,
        revenue: data.revenue,
        collections: data.collections,
      }));

      setSalesChartData(chartData);
      setStats({
        totalProjects: projectCount || 0,
        totalTeamMembers: teamCount || 0,
        totalDepartments: departmentCount || 0,
        monthlySales: mSales,
        monthlyRevenue: mRevenue,
        ytdSales: ySales,
        ytdRevenue: yRevenue,
        projectStats: topProjects
      });

      // Activities set above in try-catch block

      // Fetch Announcements
      const { data: announcementData } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (announcementData) {
        setAnnouncements(announcementData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  }, [profile, profile?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Filter Leaderboard Data
  useEffect(() => {
    if (allSales.length === 0) return;

    const calculateLeaderboard = () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today

      let startDate = new Date(now.getFullYear(), 0, 1); // Default This Year

      if (leaderboardTimeFilter === 'today') {
        startDate = now;
      } else if (leaderboardTimeFilter === 'this_week') {
        // Start of week (Sunday)
        const day = now.getDay();
        const diff = now.getDate() - day; // adjust when day is sunday
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
      } else if (leaderboardTimeFilter === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.sale_date);

        // Time Filter
        if (saleDate < startDate) return false;

        // Role Filter
        if (leaderboardRoleFilter !== 'all') {
          if (sale.profile?.role !== leaderboardRoleFilter) return false;
        }

        return true;
      });

      const leaderboardMap = new Map<string, LeaderboardUser>();

      filteredSales.forEach(sale => {
        if (sale.sales_executive_id) {
          const userCurrent = leaderboardMap.get(sale.sales_executive_id) || {
            id: sale.sales_executive_id,
            name: sale.profile?.full_name || 'Unknown',
            salesCount: 0,
            revenue: 0,
            image_url: sale.profile?.image_url || null
          };
          userCurrent.salesCount++;
          userCurrent.revenue += Number(sale.total_revenue);
          leaderboardMap.set(sale.sales_executive_id, userCurrent);
        }
      });

      const sorted = Array.from(leaderboardMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5); // Top 5

      setTopPerformers(sorted);
    };

    calculateLeaderboard();
  }, [allSales, leaderboardTimeFilter, leaderboardRoleFilter]);

  if (loading) {
    return <LoadingSpinner size="lg" fullScreen />;
  }

  const permissions = profile?.role_details?.permissions?.dashboard || {
    sales_view: 'overall',
    kpi_cards: true,
    project_performance: true,
    leaderboard: true,
    upcoming_events: true,
    recent_activity: true
  };

  const salesView = permissions.sales_view || 'overall';

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none hidden md:block"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none hidden md:block"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 text-white">
          <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
            <div className="flex-shrink-0 p-1 bg-white/20 rounded-2xl backdrop-blur-sm">
              {profile?.image_url ? (
                <img src={profile.image_url} alt={profile.full_name || 'User'} className="w-12 h-12 md:w-16 md:h-16 rounded-xl object-cover border-2 border-white/50" />
              ) : (
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white/10 flex items-center justify-center text-xl md:text-2xl font-bold border-2 border-white/50">
                  {profile?.full_name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="space-y-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight">
                Welcome {profile?.role === 'director' ? 'Director' : 'Admin'}, {profile?.full_name?.split(' ')[0]}! 🛡️
              </h1>
              <p className="text-blue-100 text-sm font-medium">
                Here's the system overview for today.
              </p>
            </div>
          </div>

          <div className="flex w-full md:w-auto mt-2 md:mt-0 justify-start md:justify-end">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-xs md:text-sm font-medium whitespace-nowrap">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Metrics (Month vs YTD) */}
      {permissions.kpi_cards && salesView !== 'none' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <KPICard
            title={salesView === 'self' ? "My Sales (Month)" : "Sales (This Month)"}
            value={stats.monthlySales}
            icon={TrendingUp}
            iconBgColor="bg-blue-500/10"
            iconColor="text-blue-600"
            formatter={(val) => val.toString()}
          />
          <KPICard
            title={salesView === 'self' ? "My Sales (YTD)" : "Sales (YTD)"}
            value={stats.ytdSales}
            icon={TrendingUp}
            iconBgColor="bg-indigo-500/10"
            iconColor="text-indigo-600"
            formatter={(val) => val.toString()}
          />
          <KPICard
            title={salesView === 'self' ? "My Revenue" : "Revenue (This Month)"}
            value={stats.monthlyRevenue}
            icon={DollarSign}
            iconBgColor="bg-green-500/10"
            iconColor="text-green-600"
            formatter={(val) => formatCurrency(val, true)}
          />
          <KPICard
            title={salesView === 'self' ? "My Revenue (YTD)" : "Revenue (YTD)"}
            value={stats.ytdRevenue}
            icon={DollarSign}
            iconBgColor="bg-emerald-500/10"
            iconColor="text-emerald-600"
            formatter={(val) => formatCurrency(val, true)}
          />
        </div>
      )}

      {/* Project Performance Cards (All Time) */}
      {permissions.project_performance && tenant?.settings?.features?.inventory !== false && stats.projectStats.length > 0 && (
        <div
          className={`grid gap-4 md:gap-6 transition-all duration-300 ${stats.projectStats.length === 1 ? 'grid-cols-1' :
            stats.projectStats.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              stats.projectStats.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                'grid-cols-2 md:grid-cols-2 lg:grid-cols-4'
            }`}
        >
          {stats.projectStats.map((project, idx) => {
            const count = stats.projectStats.length;
            const isFifthItem = count === 5 && idx === 4;
            const cardClass = isFifthItem ? "col-span-2 md:col-span-2 lg:col-span-4" : "";

            return (
              <KPICard
                key={idx}
                title={project.name}
                value={project.area}
                icon={Building}
                iconBgColor={idx === 0 ? "bg-amber-500/10" : idx === 1 ? "bg-emerald-500/10" : "bg-blue-500/10"}
                iconColor={idx === 0 ? "text-amber-600" : idx === 1 ? "text-emerald-600" : "text-blue-600"}
                formatter={(val) => `${val.toLocaleString()} sqft`}
                trend={{ value: 100, isPositive: true }}
                className={cardClass}
              />
            );
          })}
        </div>
      )}

      {/* Main Graphs: Sales Trends & Payment Collection */}
      {salesView !== 'none' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-3xl border-0 shadow-[0_2px_20px_rgb(0,0,0,0.04)] overflow-hidden ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark dark:shadow-none">
            <CardHeader className="border-b border-slate-100/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-500/30">
                    <TrendingUp size={20} />
                  </div>
                  Sales Trends
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.6} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-[0_2px_20px_rgb(0,0,0,0.04)] overflow-hidden ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark dark:shadow-none">
            <CardHeader className="border-b border-slate-50 dark:border-white/10 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-500/30">
                    <CreditCard size={20} />
                  </div>
                  Payment Collections
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.6} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(val: number) => formatCurrency(val)}
                    />
                    <Area
                      type="monotone"
                      dataKey="collections"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorCollections)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {permissions.leaderboard && (
          <Card className="h-[500px] flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark overflow-hidden">
            <CardHeader className="border-b border-slate-100/50 dark:border-white/10 pb-4">
              <div className="flex flex-row items-center justify-between mb-4">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="p-2 bg-amber-50 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-500/30">
                    <Award size={20} />
                  </div>
                  Top Performers
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Select
                  value={leaderboardTimeFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLeaderboardTimeFilter(e.target.value as any)}
                  className="h-8 text-xs bg-slate-50 dark:bg-white/5 border-transparent rounded-lg dark:text-white"
                  options={[
                    { value: 'today', label: 'Today' },
                    { value: 'this_week', label: 'This Week' },
                    { value: 'this_month', label: 'This Month' },
                    { value: 'this_year', label: 'This Year' }
                  ]}
                />
                <Select
                  value={leaderboardRoleFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLeaderboardRoleFilter(e.target.value as any)}
                  className="h-8 text-xs bg-slate-50 dark:bg-white/5 border-transparent rounded-lg dark:text-white"
                  options={[
                    { value: 'all', label: 'All Roles' },
                    { value: 'sales_executive', label: 'Executives' },
                    { value: 'team_leader', label: 'TLs' }
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {topPerformers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-slate-100 dark:hover:border-white/10 transition-all group cursor-default"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold border-2 border-white dark:border-surface-dark shadow-sm z-10
                            ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                              index === 1 ? 'bg-slate-300 text-slate-700' :
                                index === 2 ? 'bg-orange-300 text-orange-800' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400'}
                          `}>
                            #{index + 1}
                          </div>
                          {user.image_url ? (
                            <img src={user.image_url} alt={user.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-50 dark:ring-white/10" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-slate-100 dark:from-indigo-500/20 dark:to-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                              {user.name.charAt(0)}
                            </div>
                          )}
                          {index === 0 && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5 border-2 border-white dark:border-surface-dark">
                              <Sparkles size={8} className="text-white" fill="currentColor" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-sm">{user.name}</p>
                          <span className="text-xs text-slate-500 dark:text-gray-400 font-medium bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md">{user.salesCount} Sales</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(user.revenue)}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity Log & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {permissions.recent_activity && (
          <div className="h-[500px]">
            <RecentActivityLog activities={activityLogs} />
          </div>
        )}

        <Card className="h-[500px] flex flex-col rounded-3xl border-0 shadow-[0_2px_20px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 overflow-hidden dark:bg-surface-dark">
          <CardHeader className="border-b border-slate-100 dark:border-white/10 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50/50 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 ring-1 ring-rose-100/50 dark:ring-rose-500/30">
                <Megaphone size={20} />
              </div>
              <CardTitle className="text-slate-800 dark:text-white text-base">Announcements</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex-1 overflow-auto custom-scrollbar">
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-white/10 hover:border-rose-200 transition-all">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{ann.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">{ann.content}</p>
                  <div className="mt-2 text-[10px] text-slate-400">{new Date(ann.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Calendar & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {permissions.recent_activity && (
          <div className="h-[500px]">
            <ActivityCalendar activities={activityLogs} />
          </div>
        )}

        {salesView !== 'none' && (
          <div className="h-[500px]">
            <Card className="h-full rounded-3xl border-0 shadow-[0_2px_20px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 overflow-hidden dark:bg-surface-dark">
              <CardHeader className="border-b border-slate-100 dark:border-white/10 pb-4">
                <CardTitle className="text-slate-800 dark:text-white text-base">Recent Sales</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {recentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{sale.customer?.name}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{sale.project?.name}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(sale.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {permissions.upcoming_events && (
        <div className="mt-8">
          <UpcomingEvents />
        </div>
      )}
    </div>
  );
}
