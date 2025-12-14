import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { KPICard } from '../ui/KPICard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { TrendingUp, DollarSign, Target, Award, Bell, BarChart3, Wallet, Building } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RecentActivityLog } from '../dashboards/widgets/RecentActivityLog';
import { CelebrationCards } from '../sales-executive/CelebrationCards';

export function ReceptionistDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        totalSales: 0,
        totalRevenue: 0,
        totalTarget: 0,
        achievementPercent: 0,
        totalIncentives: 0,
        ytdSalesCount: 0,
        ytdTotalArea: 0,
        ytdRevenue: 0,
        ytdPaymentCount: 0,
        projectStats: [] as { name: string; area: number }[],
        recentAnnouncements: [] as any[],
        activityLogs: [] as any[],
        leaderboard: {
            monthly: [] as { name: string; area: number; rank: number; image_url?: string }[],
            yearly: [] as { name: string; area: number; rank: number; image_url?: string }[]
        }
    });
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const salesTrendData = [
        { name: 'Jan', sales: 400000 },
        { name: 'Feb', sales: 300000 },
        { name: 'Mar', sales: 600000 },
        { name: 'Apr', sales: 800000 },
        { name: 'May', sales: 500000 },
        { name: 'Jun', sales: 900000 },
    ];

    const productMixData = [
        { name: 'Residential', value: 65 },
        { name: 'Commercial', value: 25 },
        { name: 'Land', value: 10 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    useEffect(() => {
        loadOverviewData();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [profile]);

    const loadOverviewData = async () => {
        if (!profile?.id) return;
        try {
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            const yearStart = `${currentYear}-01-01`;

            const [{ data: salesData }, { data: targetData }, { data: incentiveData }, { data: announcements }, { data: activityLogs }, { data: ytdSalesData }, { data: projectsData }] = await Promise.all([
                supabase.from('sales').select('total_revenue').gte('sale_date', monthStart),
                supabase.from('sales_targets').select('target_amount').gte('period_start', monthStart).limit(1).maybeSingle(),
                supabase.from('incentives').select('*').eq('calculation_year', currentYear),
                supabase.from('announcements').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(5),
                supabase.from('activity_log').select('*, user:user_id(full_name)').eq('action', 'SALE_CREATED').order('created_at', { ascending: false }).limit(10),
                supabase.from('sales').select('id, total_revenue, area_sqft, project_id').gte('sale_date', yearStart),
                supabase.from('projects').select('id, name'),
            ]);

            const revenue = salesData?.reduce((sum, sale) => sum + Number(sale.total_revenue), 0) || 0;
            const target = targetData?.target_amount || 0;
            const achievement = target > 0 ? (revenue / target) * 100 : 0;
            const totalIncentives = incentiveData?.reduce((sum, inc) => sum + Number(inc.total_incentive_amount), 0) || 0;

            const ytdSales = ytdSalesData || [];
            const ytdSalesCount = ytdSales.length;
            const ytdRevenue = ytdSales.reduce((sum, sale) => sum + Number(sale.total_revenue), 0);
            const ytdTotalArea = ytdSales.reduce((sum, sale) => sum + Number(sale.area_sqft || 0), 0);

            let ytdPaymentCount = 0;
            if (ytdSales.length > 0) {
                const saleIds = ytdSales.map(s => s.id);
                const { count } = await supabase
                    .from('payments')
                    .select('*', { count: 'exact', head: true })
                    .in('sale_id', saleIds);
                ytdPaymentCount = count || 0;
            }

            const projectAreaMap = new Map<string, number>();
            projectsData?.forEach(p => projectAreaMap.set(p.id, 0));

            ytdSales.forEach(sale => {
                if (sale.project_id) {
                    const current = projectAreaMap.get(sale.project_id) || 0;
                    projectAreaMap.set(sale.project_id, current + Number(sale.area_sqft || 0));
                }
            });

            const projectStats = projectsData?.map(p => ({
                name: p.name,
                area: projectAreaMap.get(p.id) || 0
            })).sort((a, b) => b.area - a.area).slice(0, 4) || [];

            const { data: allYearSales } = await supabase
                .from('sales')
                .select('sales_executive_id, area_sqft, sale_date')
                .gte('sale_date', yearStart);

            const { data: allProfiles } = await supabase
                .from('profiles')
                .select('id, full_name, image_url');

            const profileMap = new Map(allProfiles?.map(p => [p.id, { name: p.full_name, image: p.image_url }]) || []);

            const calculateLeaderboard = (sales: any[]) => {
                const map = new Map<string, number>();
                sales.forEach(s => {
                    const current = map.get(s.sales_executive_id) || 0;
                    map.set(s.sales_executive_id, current + Number(s.area_sqft || 0));
                });

                return Array.from(map.entries())
                    .map(([id, area]) => {
                        const user = profileMap.get(id);
                        return {
                            name: user?.name || 'Unknown',
                            image_url: user?.image,
                            area,
                            id
                        };
                    })
                    .sort((a, b) => b.area - a.area)
                    .slice(0, 5)
                    .map((item, index) => ({ ...item, rank: index + 1 }));
            };

            const yearlyLeaderboard = calculateLeaderboard(allYearSales || []);
            const monthlyLeaderboardSales = (allYearSales || []).filter(s => s.sale_date >= monthStart);
            const monthlyLeaderboard = calculateLeaderboard(monthlyLeaderboardSales);

            setStats({
                totalSales: salesData?.length || 0,
                totalRevenue: revenue,
                totalTarget: target,
                achievementPercent: achievement,
                totalIncentives: totalIncentives,
                ytdSalesCount,
                ytdTotalArea,
                ytdRevenue,
                ytdPaymentCount,
                projectStats,
                recentAnnouncements: announcements || [],
                activityLogs: activityLogs || [],
                leaderboard: {
                    monthly: monthlyLeaderboard,
                    yearly: yearlyLeaderboard
                }
            });
        } catch (error) {
            console.error('Error loading overview:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    const projectColors = [
        { bg: 'bg-emerald-50', text: 'text-emerald-600' },
        { bg: 'bg-blue-50', text: 'text-blue-600' },
        { bg: 'bg-violet-50', text: 'text-violet-600' },
        { bg: 'bg-amber-50', text: 'text-amber-600' },
    ];

    const LeaderboardItem = ({ rank, name, area, image_url }: { rank: number, name: string, area: number, image_url?: string }) => {
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

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-6 md:p-8 shadow-2xl shadow-blue-200">
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
                                Welcome Back, {profile?.full_name?.split(' ')[0]}
                            </h1>
                            <p className="text-blue-100 dark:text-white text-sm font-medium">
                                Company Overview Dashboard
                            </p>
                        </div>
                    </div>

                    <div className="text-left md:text-right w-full md:w-auto mt-2 md:mt-0 px-6 py-2 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex-shrink-0">
                        <p className="text-xl md:text-3xl font-bold font-mono tracking-wider">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                        <p className="text-blue-100 text-xs md:text-sm font-medium uppercase tracking-widest">
                            {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-6">
                <KPICard
                    title="Total Sales (Monthly)"
                    value={stats.totalSales}
                    icon={TrendingUp}
                    subtitle="Deals Closed"
                    iconBgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    className="order-1 lg:order-1"
                />
                <KPICard
                    title="Revenue (Monthly)"
                    value={formatCurrency(stats.totalRevenue, true)}
                    icon={DollarSign}
                    subtitle={`Target: ${formatCurrency(stats.totalTarget, true)}`}
                    iconBgColor="bg-green-50"
                    iconColor="text-green-600"
                    className="order-2 lg:order-2"
                />
                <KPICard
                    title="Total Sales (YTD)"
                    value={stats.ytdSalesCount}
                    icon={BarChart3}
                    subtitle={`Total Area: ${stats.ytdTotalArea.toLocaleString()} sqft`}
                    iconBgColor="bg-teal-50"
                    iconColor="text-teal-600"
                    className="order-3 lg:order-5"
                />
                <KPICard
                    title="Total Revenue (YTD)"
                    value={formatCurrency(stats.ytdRevenue, true)}
                    icon={Wallet}
                    subtitle={`${stats.ytdPaymentCount} Payments Received`}
                    iconBgColor="bg-cyan-50"
                    iconColor="text-cyan-600"
                    className="order-4 lg:order-6"
                />
                <KPICard
                    title="Achievement"
                    value={`${stats.achievementPercent.toFixed(1)}%`}
                    icon={Target}
                    subtitle="Monthly Goal"
                    iconBgColor="bg-yellow-50"
                    iconColor="text-yellow-600"
                    className="order-5 lg:order-3"
                />
                <KPICard
                    title="Incentives (YTD)"
                    value={formatCurrency(stats.totalIncentives)}
                    icon={Award}
                    subtitle="Total Earnings"
                    iconBgColor="bg-rose-50"
                    iconColor="text-rose-600"
                    className="order-6 lg:order-4"
                />
            </div>

            {stats.projectStats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {stats.projectStats.map((proj, index) => {
                        const style = projectColors[index % projectColors.length];
                        return (
                            <KPICard
                                key={index}
                                title={proj.name}
                                value={`${proj.area.toLocaleString()} Sq ft`}
                                icon={Building}
                                subtitle="Total Sold"
                                iconBgColor={style.bg}
                                iconColor={style.text}
                            />
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <Card className="rounded-3xl overflow-hidden dark:bg-surface-dark dark:border-white/10 dark:ring-1 dark:ring-white/10">
                    <CardHeader className="bg-white dark:bg-surface-dark border-b border-slate-50 dark:border-white/10 pb-4">
                        <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            Monthly Leaderboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-1">
                            {stats.leaderboard?.monthly.length > 0 ? (
                                stats.leaderboard.monthly.map((item) => (
                                    <LeaderboardItem key={item.rank} {...item} />
                                ))
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-6">No sales data for this month yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl overflow-hidden dark:bg-surface-dark dark:border-white/10 dark:ring-1 dark:ring-white/10">
                    <CardHeader className="bg-white dark:bg-surface-dark border-b border-slate-50 dark:border-white/10 pb-4">
                        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            Yearly Leaderboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-1">
                            {stats.leaderboard?.yearly.length > 0 ? (
                                stats.leaderboard.yearly.map((item) => (
                                    <LeaderboardItem key={item.rank} {...item} />
                                ))
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-6">No sales data for this year yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <Card className="rounded-3xl overflow-hidden h-full dark:bg-surface-dark dark:border-white/10 dark:ring-1 dark:ring-white/10 shadow-lg">
                    <CardHeader className="bg-white dark:bg-surface-dark border-b border-slate-50 dark:border-white/10 pb-4">
                        <CardTitle className="dark:text-white">Sales Trend (6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none dark:block hidden" />

                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesTrendData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                <defs>
                                    <filter id="neon-glow" height="300%" width="300%" x="-75%" y="-75%">
                                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                    <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#00E576" />
                                        <stop offset="100%" stopColor="#00C853" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#6b7280"
                                    tick={{ fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#6b7280"
                                    tick={{ fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                    }}
                                    itemStyle={{ color: '#00E576', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                                    cursor={{ stroke: '#374151', strokeDasharray: '4 4' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#00E576"
                                    strokeWidth={4}
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#00E576', stroke: '#fff', strokeWidth: 2 }}
                                    filter="url(#neon-glow)"
                                    style={{
                                        filter: 'drop-shadow(0 0 8px rgba(0, 229, 118, 0.5))'
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl overflow-hidden h-full dark:bg-surface-dark dark:border-white/10 dark:ring-1 dark:ring-white/10">
                    <CardHeader className="bg-white dark:bg-surface-dark border-b border-slate-50 dark:border-white/10 pb-4"><CardTitle className="dark:text-white">Revenue by Product</CardTitle></CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={productMixData} innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                    {productMixData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <Card className="h-full rounded-3xl overflow-hidden dark:bg-surface-dark dark:border-white/10 dark:ring-1 dark:ring-white/10">
                    <CardHeader className="bg-white dark:bg-surface-dark border-b border-slate-50 dark:border-white/10 pb-4"><CardTitle className="flex items-center gap-2 dark:text-white"><Bell size={20} /> Latest Updates</CardTitle></CardHeader>
                    <CardContent>
                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                            {stats.recentAnnouncements.map((ann) => (
                                <div key={ann.id} className="py-3">
                                    <p className="font-semibold text-gray-800 dark:text-white">{ann.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{ann.content}</p>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(ann.created_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                            {stats.recentAnnouncements.length === 0 && <p className="text-gray-500 dark:text-gray-400 py-2">No new announcements.</p>}
                        </div>
                    </CardContent>
                </Card>

                <RecentActivityLog activities={stats.activityLogs} />
            </div>

            <CelebrationCards />
        </div>
    );
}
