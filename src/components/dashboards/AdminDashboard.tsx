import { useEffect, useState } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { KPICard } from '../ui/KPICard';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  Users,
  Building,
  TrendingUp,
  DollarSign,
  Briefcase,
  Megaphone,
  Sparkles,
  Award,
  CreditCard
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
import { Tooltip } from '../ui/Tooltip';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { RecentActivityLog } from './widgets/RecentActivityLog';
import { ActivityCalendar } from './widgets/ActivityCalendar';
import { UpcomingEvents } from './widgets/UpcomingEvents';
import { Select } from '../ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DashboardStats {
  totalProjects: number;
  totalTeamMembers: number;
  totalDepartments: number;
  monthlySales: number;
  monthlyRevenue: number;
  ytdSales: number;
  ytdRevenue: number;
  pendingSiteVisits: number;
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
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalTeamMembers: 0,
    totalDepartments: 0,
    monthlySales: 0,
    monthlyRevenue: 0,
    ytdSales: 0,
    ytdRevenue: 0,
    pendingSiteVisits: 0,
    projectStats: [],
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



  useEffect(() => {
    loadDashboardData();
  }, []);

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

  const loadDashboardData = async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const yearStart = `${currentYear}-01-01`;

      // 1. Fetch Basic Metrics
      const [
        { count: projectCount },
        { count: teamCount },
        { count: pendingVisits },
        { count: departmentCount },
        { data: activities },
        { data: allTimeProjectSales },
        { data: projectsData }
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('site_visits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('departments').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('activity_logs').select('*, user:user_id(full_name)').order('created_at', { ascending: false }).limit(500),
        supabase.from('sales').select('project_id, area_sqft'),
        supabase.from('projects').select('id, name')
      ]);

      // Calculate Project Performance (All Time)
      const projectAreaMap = new Map<string, number>();
      projectsData?.forEach(p => projectAreaMap.set(p.id, 0));

      allTimeProjectSales?.forEach(sale => {
        if (sale.project_id) {
          const current = projectAreaMap.get(sale.project_id) || 0;
          projectAreaMap.set(sale.project_id, current + Number(sale.area_sqft || 0));
        }
      });

      const topProjects = projectsData?.map(p => ({
        name: p.name,
        area: projectAreaMap.get(p.id) || 0
      })).sort((a, b) => b.area - a.area).slice(0, 4) || [];

      // 2. Fetch Sales Data for Metrics, Charts & Leaderboard
      // We need ALL sales for the year to build charts and YTD metrics
      const { data: yearSales } = await supabase
        .from('sales')
        .select(`
          id,
          sale_date,
          total_revenue,
          sales_executive_id,
          profile:sales_executive_id (full_name, image_url, role)
        `)
        .gte('sale_date', yearStart)
        .order('sale_date', { ascending: true });

      if (yearSales) {
        setAllSales(yearSales);
        // Set Recent Sales (Top 5 most recent)
        setRecentSales([...yearSales].reverse().slice(0, 10)); // Just use this data for now, ideally fetch recent separately
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

      yearSales?.forEach((sale: any) => {
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
        const current = salesByMonth.get(monthKey) || { sales: 0, revenue: 0, collections: 0 };
        salesByMonth.set(monthKey, {
          ...current,
          sales: current.sales + 1,
          revenue: current.revenue + Number(sale.total_revenue),
        });
      });

      // Integrate Payments
      yearPayments?.forEach((pay: any) => {
        const date = new Date(pay.payment_date);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        const current = salesByMonth.get(monthKey);
        if (current) {
          current.collections += Number(pay.amount);
          salesByMonth.set(monthKey, current);
        }
      });

      // Format Chart Data
      const formattedChartData = Array.from(salesByMonth.entries()).map(([name, data]) => ({
        name,
        sales: data.sales,
        revenue: data.revenue,
        collections: data.collections
      }));

      setStats({
        totalProjects: projectCount || 0,
        totalTeamMembers: teamCount || 0,
        totalDepartments: departmentCount || 0,
        monthlySales: mSales,
        monthlyRevenue: mRevenue,
        ytdSales: ySales,
        ytdRevenue: yRevenue,
        pendingSiteVisits: pendingVisits || 0,
        projectStats: topProjects,
      });

      setSalesChartData(formattedChartData);
      setActivityLogs(activities || []);

      // 3. Fetch Recent Sales (Detailed)
      const { data: recentSalesData } = await supabase
        .from('sales')
        .select(`
          id,
          sale_date,
          total_revenue,
          customer:customer_id (name),
          project:project_id (name),
          profile:sales_executive_id (full_name)
        `)
        .order('sale_date', { ascending: false })
        .limit(5);

      setRecentSales(recentSalesData || []);

      // 4. Fetch Announcements
      const { data: announcementData } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);

      setAnnouncements(announcementData as Announcement[]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" fullScreen />;
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Section */}
      {/* Welcome Section - Vibrant & Compact */}
      {/* Welcome Section - Vibrant & Compact */}
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

      {/* Project Performance Cards (All Time) */}
      {/* Financial Metrics (Month vs YTD) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title="Sales (This Month)"
          value={stats.monthlySales}
          icon={TrendingUp}
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-600"
          formatter={(val) => val.toString()}
        />
        <KPICard
          title="Sales (YTD)"
          value={stats.ytdSales}
          icon={TrendingUp}
          iconBgColor="bg-indigo-500/10"
          iconColor="text-indigo-600"
          formatter={(val) => val.toString()}
        />
        <KPICard
          title="Revenue (This Month)"
          value={stats.monthlyRevenue}
          icon={DollarSign}
          iconBgColor="bg-green-500/10"
          iconColor="text-green-600"
          formatter={(val) => formatCurrency(val, true)}
        />
        <KPICard
          title="Revenue (YTD)"
          value={stats.ytdRevenue}
          icon={DollarSign}
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-600"
          formatter={(val) => formatCurrency(val, true)}
        />
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <KPICard
          title="Total Active Projects"
          value={stats.totalProjects}
          icon={Building}
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-600"
        />
        <KPICard
          title="Total Team Members"
          value={stats.totalTeamMembers}
          icon={Users}
          iconBgColor="bg-green-500/10"
          iconColor="text-green-600"
        />
        <div className="hidden lg:block">
          <KPICard
            title="Departments"
            value={stats.totalDepartments}
            icon={Briefcase}
            iconBgColor="bg-purple-500/10"
            iconColor="text-purple-600"
          />
        </div>
      </div>

      {/* Project Performance Cards (All Time) */}
      {stats.projectStats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.projectStats.map((proj, index) => {
            const colors = [
              { bg: 'bg-emerald-50', text: 'text-emerald-600' },
              { bg: 'bg-blue-50', text: 'text-blue-600' },
              { bg: 'bg-violet-50', text: 'text-violet-600' },
              { bg: 'bg-amber-50', text: 'text-amber-600' },
            ];
            const style = colors[index % colors.length];

            return (
              <KPICard
                key={index}
                title={proj.name}
                value={`${proj.area.toLocaleString()} Sq ft`}
                icon={Building}
                subtitle="Total Sold (All Time)"
                iconBgColor={style.bg}
                iconColor={style.text}
                valueClassName="md:text-2xl"
              />
            );
          })}
        </div>
      )}


      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Sales Overview Graph */}
        <Card className="rounded-3xl overflow-hidden shadow-[0_2px_20px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark border-0">
          <CardHeader className="border-b border-slate-100/50 dark:border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-white">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-500/30">
                  <TrendingUp size={20} />
                </div>
                Sales Trends
              </CardTitle>
              <div className="flex gap-2">
                {/* Placeholder for future range selector */}
                <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">Last 12 Months</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[250px] sm:h-[320px] w-full">
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
                    tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '12px'
                    }}
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Collection Graph (New) */}
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
            <div className="h-[250px] sm:h-[320px] w-full">
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
                    tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                  />
                  <RechartsTooltip
                    formatter={(val: number) => `₹${(val / 1000).toFixed(1)}k`}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '12px'
                    }}
                    cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="collections"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCollections)"
                    name="Collections"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 50/50 Split: Activity Calendar & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
        {/* Widget 1: Calendar */}
        <div className="h-[400px] sm:h-[500px]">
          <ActivityCalendar activities={activityLogs} />
        </div>

        {/* Widget 2: Leaderboard */}
        <Card className="h-[400px] sm:h-[500px] flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark overflow-hidden">
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
                onChange={(e: any) => setLeaderboardTimeFilter(e.target.value)}
                className="h-8 text-xs bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10 focus:ring-amber-500/20 rounded-lg transition-colors dark:text-white"
                options={[
                  { value: 'today', label: 'Today' },
                  { value: 'this_week', label: 'This Week' },
                  { value: 'this_month', label: 'This Month' },
                  { value: 'this_year', label: 'This Year' }
                ]}
              />
              <Select
                value={leaderboardRoleFilter}
                onChange={(e: any) => setLeaderboardRoleFilter(e.target.value)}
                className="h-8 text-xs bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10 focus:ring-amber-500/20 rounded-lg transition-colors dark:text-white"
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
                          <img src={user.image_url} alt={user.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-50 dark:ring-white/10 group-hover:ring-white dark:group-hover:ring-white/20 shadow-sm transition-all" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-slate-100 dark:from-indigo-500/20 dark:to-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold ring-2 ring-slate-50 dark:ring-white/10 group-hover:ring-white dark:group-hover:ring-white/20 shadow-sm transition-all">
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
                        <p className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{user.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 dark:text-gray-400 font-medium bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md">{user.salesCount} Sales</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(user.revenue)}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Revenue
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {topPerformers.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-gray-500">
                  <Award size={32} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium">No performance data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Information Grid: Activity Log & Announcements & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Activity Log */}
        <div className="h-[400px]">
          <RecentActivityLog activities={activityLogs} />
        </div>

        {/* Announcements */}
        <div className="h-[400px]">
          <Card className="h-full flex flex-col rounded-3xl overflow-hidden border-0 shadow-[0_2px_20px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark">
            <CardHeader className="border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50/50 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 ring-1 ring-rose-100/50 dark:ring-rose-500/30">
                  <Megaphone size={20} />
                </div>
                <CardTitle className="text-slate-800 dark:text-white text-base">Announcements</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 overflow-auto custom-scrollbar">
              {announcements.length > 0 ? (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-500/30 hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-rose-50 to-transparent dark:from-rose-500/10 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div>

                    <div className="relative">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">{ann.title}</h4>
                        {ann.is_important && (
                          <span className="shrink-0 text-[10px] bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold shadow-sm">
                            Important
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">{ann.content}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-gray-500 font-medium">
                        <CalendarIcon size={12} />
                        <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Megaphone size={32} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium">No announcements</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <UpcomingEvents />
      </div>

      {/* Recent Sales Table - Full Width */}
      <Card className="rounded-3xl border-0 shadow-[0_2px_20px_rgb(0,0,0,0.04)] overflow-hidden ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-white/10 bg-gray-50/30 dark:bg-surface-dark">
          <CardTitle className="flex items-center gap-3 dark:text-white">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
              <TrendingUp size={20} />
            </div>
            Recent Sales
          </CardTitle>
          <Tooltip content="View All Sales">
            <Button variant="outline" size="sm" className="text-xs dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10">View All</Button>
          </Tooltip>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50/80 dark:bg-surface-dark/95 backdrop-blur-sm z-10">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider rounded-l-lg hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors">Customer</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors">Project</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors">Sold By</th>
                  <th className="px-6 py-4 text-right font-bold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider rounded-r-lg hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors">Amount</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all rounded-lg border-b border-transparent hover:border-slate-100 dark:hover:border-white/10">
                    <td className="px-6 py-4 rounded-l-lg">
                      <div className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{sale.customer?.name || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">{sale.project?.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs font-bold ring-2 ring-white dark:ring-white/10 shadow-sm">
                            {sale.profile?.full_name?.charAt(0)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-surface-dark rounded-full"></div>
                        </div>

                        <span className="text-gray-700 dark:text-gray-200 font-medium">{sale.profile?.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right rounded-r-lg">
                      <span className="font-bold text-gray-900 dark:text-white px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-100/50 dark:ring-emerald-500/30">
                        {formatCurrency(sale.total_revenue)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentSales.length === 0 && <p className="text-center text-gray-500 py-8">No recent transactions</p>}
          </div>
        </CardContent>
      </Card>
    </div >
  );
}

