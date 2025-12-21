import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { KPICard } from '../ui/KPICard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { TrendingUp, DollarSign, Target, Award, BarChart3, Wallet, Building } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { RecentActivityLog } from '../dashboards/widgets/RecentActivityLog';
import { CelebrationCards } from './CelebrationCards';

export function SalesOverview() {
    const { profile, tenant } = useAuth();
    const [stats, setStats] = useState({
        mySales: 0,
        myRevenue: 0,
        myTarget: 0,
        achievementPercent: 0,
        totalIncentives: 0,
        ytdSalesCount: 0,
        ytdTotalArea: 0,
        ytdRevenue: 0,
        ytdPaymentCount: 0,
        projectStats: [] as { name: string; area: number }[],
        activityLogs: [] as any[],
        leaderboard: {
            monthly: [] as { name: string; area: number; rank: number; image_url?: string }[],
            yearly: [] as { name: string; area: number; rank: number; image_url?: string }[]
        }
    });
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const isReceptionist = profile?.role === 'receptionist';

    // Mock data for charts
    const salesTrendData = [
        { name: 'Jan', sales: 400000 },
        { name: 'Feb', sales: 300000 },
        { name: 'Mar', sales: 600000 },
        { name: 'Apr', sales: 800000 },
        { name: 'May', sales: 500000 },
        { name: 'Jun', sales: 900000 },
    ];

    const permissions = profile?.role_details?.permissions?.dashboard || {
        sales_view: isReceptionist ? 'overall' : 'self',
        kpi_cards: true,
        project_performance: true,
        leaderboard: true,
        upcoming_events: true,
        recent_activity: true
    };
    const salesView = permissions.sales_view || (isReceptionist ? 'overall' : 'self');

    const loadOverviewData = useCallback(async () => {
        if (!profile?.id) return;
        try {
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            const yearStart = `${currentYear}-01-01`;

            if (salesView === 'none') {
                setStats(prev => ({ ...prev, achievementPercent: 0, mySales: 0, myRevenue: 0 }));
                setLoading(false);
                return;
            }

            let teamIds: string[] = [];
            if (salesView === 'team') {
                const { data: teamMembers } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('reporting_manager_id', profile.id)
                    .eq('is_active', true);
                teamIds = teamMembers?.map(m => m.id) || [];
            }

            let salesQuery = supabase.from('sales').select('total_revenue');
            if (salesView === 'self') {
                salesQuery = salesQuery.eq('sales_executive_id', profile.id);
            } else if (salesView === 'team' && teamIds.length > 0) {
                salesQuery = salesQuery.in('sales_executive_id', teamIds);
            }
            salesQuery = salesQuery.gte('sale_date', monthStart);

            let ytdSalesQuery = supabase.from('sales').select('id, total_revenue, area_sqft, project_id');
            if (salesView === 'self') {
                ytdSalesQuery = ytdSalesQuery.eq('sales_executive_id', profile.id);
            } else if (salesView === 'team' && teamIds.length > 0) {
                ytdSalesQuery = ytdSalesQuery.in('sales_executive_id', teamIds);
            }
            ytdSalesQuery = ytdSalesQuery.gte('sale_date', yearStart);

            const [
                { data: salesData },
                { data: targetData },
                { data: incentiveData },
                { data: activityLogs },
                { data: ytdSalesData },
                { data: projectsData }
            ] = await Promise.all([
                salesQuery,
                supabase.from('targets').select('target_amount').eq('user_id', profile.id).gte('period_start', monthStart).limit(1).maybeSingle(),
                supabase.from('incentives').select('*').eq('sales_executive_id', profile.id).eq('calculation_year', currentYear),
                permissions.recent_activity ? supabase.from('activity_logs').select('*, user:user_id(full_name)').order('created_at', { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
                ytdSalesQuery,
                permissions.project_performance ? supabase.from('projects').select('id, name') : Promise.resolve({ data: [] })
            ]);

            const revenue = salesData?.reduce((sum, sale) => sum + Number(sale.total_revenue), 0) || 0;
            const target = targetData?.target_amount || 0;
            const achievement = target > 0 ? (revenue / target) * 100 : 0;
            const totalIncentives = incentiveData?.reduce((sum, inc) => sum + Number(inc.total_incentive_amount), 0) || 0;

            const ytdSales = ytdSalesData || [];
            const ytdSalesCount = ytdSales.length;
            const ytdRevenue = ytdSales.reduce((sum, sale) => sum + Number(sale.total_revenue), 0);
            const ytdTotalArea = ytdSales.reduce((sum, sale) => sum + Number(sale.area_sqft || 0), 0);

            const projMap = new Map<string, number>();
            ytdSales.forEach(s => {
                if (s.project_id) {
                    projMap.set(s.project_id, (projMap.get(s.project_id) || 0) + Number(s.area_sqft || 0));
                }
            });

            const projectStats = projectsData?.map(p => ({
                name: p.name,
                area: projMap.get(p.id) || 0
            })).sort((a, b) => b.area - a.area).slice(0, 4) || [];

            setStats({
                mySales: salesData?.length || 0,
                myRevenue: revenue,
                myTarget: target,
                achievementPercent: achievement,
                totalIncentives: totalIncentives,
                ytdSalesCount,
                ytdTotalArea,
                ytdRevenue,
                ytdPaymentCount: 0,
                projectStats,
                activityLogs: activityLogs || [],
                leaderboard: { monthly: [], yearly: [] }
            });

        } catch (error) {
            console.error('Error loading overview data:', error);
        } finally {
            setLoading(false);
        }
    }, [profile, salesView, permissions.recent_activity, permissions.project_performance]);

    useEffect(() => {
        loadOverviewData();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [loadOverviewData]);

    if (loading) return <LoadingSpinner size="lg" fullScreen />;

    return (
        <div className="space-y-6 pb-12">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-10 shadow-2xl border border-white/5 ring-1 ring-white/10 group transition-all duration-500">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-blue-500/15 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-700"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-white">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-110"></div>
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
                                Welcome Back, {profile?.full_name?.split(' ')[0]} {isReceptionist ? '👋' : '⚡'}
                            </h1>
                            <p className="text-orange-100 dark:text-white text-sm font-medium">
                                {isReceptionist ? "Check out the latest updates and events!" : "Let's crush your targets today!"}
                            </p>
                        </div>
                    </div>

                    <div className="text-left md:text-right w-full md:w-auto mt-2 md:mt-0 px-6 py-2 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex-shrink-0">
                        <p className="text-xl md:text-3xl font-bold font-mono tracking-wider">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                        <p className="text-orange-100 text-xs md:text-sm font-medium uppercase tracking-widest">
                            {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>

            {permissions.kpi_cards && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6">
                    <KPICard
                        title={isReceptionist ? "Total Sales (Monthly)" : "My Sales (Monthly)"}
                        value={stats.mySales}
                        icon={TrendingUp}
                        subtitle="Deals Closed"
                        iconBgColor="bg-blue-50"
                        iconColor="text-blue-600"
                    />
                    <KPICard
                        title={isReceptionist ? "Total Revenue" : "Revenue (Monthly)"}
                        value={formatCurrency(stats.myRevenue, true)}
                        icon={DollarSign}
                        subtitle={isReceptionist ? "Company Wide" : `Target: ${formatCurrency(stats.myTarget, true)}`}
                        iconBgColor="bg-green-50"
                        iconColor="text-green-600"
                    />
                    <KPICard
                        title="Total Sales (YTD)"
                        value={stats.ytdSalesCount}
                        icon={BarChart3}
                        subtitle={`Total Area: ${stats.ytdTotalArea.toLocaleString()} sqft`}
                        iconBgColor="bg-indigo-50"
                        iconColor="text-indigo-600"
                    />
                    <KPICard
                        title="Total Revenue (YTD)"
                        value={formatCurrency(stats.ytdRevenue, true)}
                        icon={Wallet}
                        subtitle="YTD Performance"
                        iconBgColor="bg-teal-50"
                        iconColor="text-teal-600"
                    />
                    <KPICard
                        title="Achievement"
                        value={`${stats.achievementPercent.toFixed(1)}% `}
                        icon={Target}
                        subtitle="Monthly Goal"
                        iconBgColor="bg-yellow-50"
                        iconColor="text-yellow-600"
                    />
                    {tenant?.settings?.features?.incentives !== false && (
                        <KPICard
                            title="Incentives (YTD)"
                            value={formatCurrency(stats.totalIncentives)}
                            icon={Award}
                            subtitle="Total Earnings"
                            iconBgColor="bg-purple-50"
                            iconColor="text-purple-600"
                        />
                    )}
                </div>
            )}

            {permissions.project_performance && stats.projectStats.length > 0 && (
                <div
                    className={`grid gap-3 md:gap-6 ${stats.projectStats.length === 1 ? 'grid-cols-1' :
                            stats.projectStats.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                                stats.projectStats.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                                    'grid-cols-2 md:grid-cols-4'
                        }`}
                >
                    {stats.projectStats.map((proj, index) => {
                        const style = [
                            { bg: "bg-blue-50/50", text: "text-blue-600" },
                            { bg: "bg-emerald-50/50", text: "text-emerald-600" },
                            { bg: "bg-amber-50/50", text: "text-amber-600" },
                            { bg: "bg-rose-50/50", text: "text-rose-600" }
                        ][index % 4];

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

            {salesView !== 'none' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <Card className="rounded-3xl overflow-hidden h-full dark:bg-surface-dark dark:border-white/10 dark:ring-1 dark:ring-white/10 shadow-lg">
                        <CardHeader className="bg-white dark:bg-surface-dark border-b border-slate-50 dark:border-white/10 pb-4">
                            <CardTitle className="dark:text-white">Sales Trend (6 Months)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesTrendData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} vertical={false} />
                                    <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} dx={-10} />
                                    <RechartsTooltip />
                                    <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <RecentActivityLog activities={stats.activityLogs} />
                </div>
            )}

            {permissions.upcoming_events && (
                <CelebrationCards />
            )}
        </div>
    );
}
