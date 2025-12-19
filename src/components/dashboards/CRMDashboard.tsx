import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { KPICard } from '../ui/KPICard';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import {
    Users,
    Building,
    TrendingUp,
    DollarSign,
    Briefcase,
    Megaphone,
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
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ActivityCalendar } from './widgets/ActivityCalendar';
import { UpcomingEvents } from './widgets/UpcomingEvents';
import { Select } from '../ui/Select';

interface DashboardStats {
    totalProjects: number;
    totalTeamMembers: number;
    totalDepartments: number;
    monthlySales: number;
    monthlyRevenue: number;
    ytdSales: number;
    ytdRevenue: number;
    pendingSiteVisits: number;
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

export function CRMDashboard() {
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
    });

    const [salesChartData, setSalesChartData] = useState<ChartData[]>([]);
    const [recentSales, setRecentSales] = useState<any[]>([]);
    const [topPerformers, setTopPerformers] = useState<LeaderboardUser[]>([]);

    const [allSales, setAllSales] = useState<any[]>([]);

    const [leaderboardTimeFilter, setLeaderboardTimeFilter] = useState<'today' | 'this_week' | 'this_month' | 'this_year'>('this_month');
    const [leaderboardRoleFilter] = useState<'all' | 'sales_executive' | 'team_leader'>('all');

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const permissions = profile?.role_details?.permissions?.dashboard || {
        sales_view: 'overall',
        kpi_cards: true,
        project_performance: true,
        leaderboard: true,
        upcoming_events: true,
        recent_activity: true
    };
    const salesView = permissions.sales_view || 'overall';

    const loadDashboardData = useCallback(async () => {
        try {
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            const yearStart = `${currentYear}-01-01`;

            const [
                { count: projectCount },
                { count: teamCount },
                { count: pendingVisits },
                { count: departmentCount },
                { data: activities }
            ] = await Promise.all([
                supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('site_visits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('departments').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('activity_logs').select('*, user:user_id(full_name)').order('created_at', { ascending: false }).limit(20)
            ]);

            if (salesView === 'none') {
                setStats({
                    totalProjects: projectCount || 0,
                    totalTeamMembers: teamCount || 0,
                    totalDepartments: departmentCount || 0,
                    pendingSiteVisits: pendingVisits || 0,
                    monthlySales: 0,
                    monthlyRevenue: 0,
                    ytdSales: 0,
                    ytdRevenue: 0
                });
                setLoading(false);
                return;
            }

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
                .order('sale_date', { ascending: false })
                .limit(6);

            if (recentSalesReal) setRecentSales(recentSalesReal);

            const { data: yearPayments } = await supabase
                .from('payments')
                .select('amount, payment_date')
                .gte('payment_date', yearStart);

            let mSales = 0;
            let mRevenue = 0;
            let ySales = 0;
            let yRevenue = 0;

            const salesByMonth = new Map<string, { sales: number; revenue: number; collections: number }>();

            for (let i = 0; i < 12; i++) {
                const d = new Date(currentYear, i, 1);
                if (d > now) break;
                const monthKey = d.toLocaleString('default', { month: 'short' });
                salesByMonth.set(monthKey, { sales: 0, revenue: 0, collections: 0 });
            }

            yearSales?.forEach((sale: any) => {
                const date = new Date(sale.sale_date);
                const monthKey = date.toLocaleString('default', { month: 'short' });
                ySales++;
                yRevenue += Number(sale.total_revenue);
                if (sale.sale_date >= monthStart) {
                    mSales++;
                    mRevenue += Number(sale.total_revenue);
                }
                const current = salesByMonth.get(monthKey) || { sales: 0, revenue: 0, collections: 0 };
                salesByMonth.set(monthKey, {
                    ...current,
                    sales: current.sales + 1,
                    revenue: current.revenue + Number(sale.total_revenue),
                });
            });

            yearPayments?.forEach((pay: any) => {
                const date = new Date(pay.payment_date);
                const monthKey = date.toLocaleString('default', { month: 'short' });
                const current = salesByMonth.get(monthKey);
                if (current) {
                    current.collections += Number(pay.amount);
                    salesByMonth.set(monthKey, current);
                }
            });

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
            });

            setSalesChartData(formattedChartData);
            setActivityLogs(activities || []);

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
    }, [profile, salesView]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    useEffect(() => {
        if (allSales.length === 0) return;

        const calculateLeaderboard = () => {
            const now = new Date();
            let startDate = new Date(now.getFullYear(), 0, 1);
            if (leaderboardTimeFilter === 'today') {
                startDate = new Date(now.setHours(0, 0, 0, 0));
            } else if (leaderboardTimeFilter === 'this_week') {
                const day = now.getDay();
                const diff = now.getDate() - day;
                startDate = new Date(now.setDate(diff));
                startDate.setHours(0, 0, 0, 0);
            } else if (leaderboardTimeFilter === 'this_month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            const filteredSales = allSales.filter(sale => {
                const saleDate = new Date(sale.sale_date);
                if (saleDate < startDate) return false;
                if (leaderboardRoleFilter !== 'all') {
                    if (sale.profile?.role !== leaderboardRoleFilter) return false;
                }
                return true;
            });

            const leaderboardMap = new Map<string, LeaderboardUser>();
            filteredSales.forEach(sale => {
                const userId = sale.sales_executive_id;
                if (userId) {
                    const current = leaderboardMap.get(userId) || { id: userId, name: sale.profile?.full_name || 'Unknown', salesCount: 0, revenue: 0, image_url: sale.profile?.image_url };
                    current.salesCount++;
                    current.revenue += Number(sale.total_revenue);
                    leaderboardMap.set(userId, current);
                }
            });

            setTopPerformers(Array.from(leaderboardMap.values()).sort((a,b) => b.revenue - a.revenue).slice(0, 5));
        };

        calculateLeaderboard();
    }, [allSales, leaderboardTimeFilter, leaderboardRoleFilter]);

    if (loading) return <LoadingSpinner size="lg" fullScreen />;

    return (
        <div className="space-y-8 pb-8">
            <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 shadow-2xl shadow-indigo-200">
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
                        <div className="space-y-1">
                            <h1 className="text-xl md:text-3xl font-bold tracking-tight">Hello, {profile?.full_name?.split(' ')[0]}! 👋</h1>
                            <p className="text-indigo-100 text-sm font-medium">Here's what's happening today.</p>
                        </div>
                    </div>
                </div>
            </div>

            {permissions.kpi_cards && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <KPICard title="Total Active Projects" value={stats.totalProjects} icon={Building} iconBgColor="bg-blue-50" iconColor="text-blue-600" />
                    <KPICard title="Total Team Members" value={stats.totalTeamMembers} icon={Users} iconBgColor="bg-purple-50" iconColor="text-purple-600" />
                    <KPICard title="Departments" value={stats.totalDepartments} icon={Briefcase} iconBgColor="bg-amber-50" iconColor="text-amber-600" />
                </div>
            )}

            {permissions.kpi_cards && salesView !== 'none' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Monthly Sales" value={stats.monthlySales} icon={TrendingUp} iconBgColor="bg-emerald-50" iconColor="text-emerald-600" />
                    <KPICard title="Monthly Revenue" value={formatCurrency(stats.monthlyRevenue, true)} icon={DollarSign} iconBgColor="bg-emerald-50" iconColor="text-emerald-600" />
                    <KPICard title="YTD Sales" value={stats.ytdSales} icon={Award} iconBgColor="bg-blue-50" iconColor="text-blue-600" />
                    <KPICard title="YTD Revenue" value={formatCurrency(stats.ytdRevenue, true)} icon={CreditCard} iconBgColor="bg-blue-50" iconColor="text-blue-600" />
                </div>
            )}

            {salesView !== 'none' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="rounded-3xl border-0 shadow-lg">
                        <CardHeader><CardTitle>Sales Trend</CardTitle></CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                                    <RechartsTooltip />
                                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-0 shadow-lg">
                        <CardHeader><CardTitle>Payment Collections</CardTitle></CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                                    <RechartsTooltip />
                                    <Area type="monotone" dataKey="collections" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {permissions.recent_activity && (
                    <div className="lg:col-span-1"><ActivityCalendar activities={activityLogs} /></div>
                )}
                {permissions.leaderboard && (
                    <Card className="lg:col-span-2 rounded-3xl border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Sales Leaderboard</CardTitle>
                            <div className="flex gap-2">
                                <Select value={leaderboardTimeFilter} onChange={(e) => setLeaderboardTimeFilter(e.target.value as any)} options={[{label: 'MTD', value: 'this_month'}, {label: 'YTD', value: 'this_year'}]} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topPerformers.map((user, idx) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-400">#{idx+1}</span>
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">{user.name.charAt(0)}</div>
                                            <span className="font-semibold">{user.name}</span>
                                        </div>
                                        <span className="font-bold">{formatCurrency(user.revenue, true)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {permissions.upcoming_events && (
                    <Card className="rounded-3xl border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><Megaphone className="text-indigo-500" /> Announcements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {announcements.map(ann => (
                                    <div key={ann.id} className="p-4 bg-gray-50 rounded-2xl">
                                        <h4 className="font-bold">{ann.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{ann.content}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
                <UpcomingEvents />
            </div>

            {salesView !== 'none' && (
                <Card className="rounded-3xl border-0 shadow-lg">
                    <CardHeader><CardTitle>Recent Sales</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead><tr className="border-b">
                                    <th className="pb-3 px-4">Customer</th>
                                    <th className="pb-3 px-4">Project</th>
                                    <th className="pb-3 px-4">Executive</th>
                                    <th className="pb-3 px-4 text-right">Revenue</th>
                                </tr></thead>
                                <tbody>
                                    {recentSales.map(sale => (
                                        <tr key={sale.id} className="border-b last:border-0">
                                            <td className="py-3 px-4">{sale.customer?.name}</td>
                                            <td className="py-3 px-4">{sale.project?.name}</td>
                                            <td className="py-3 px-4">{sale.profile?.full_name}</td>
                                            <td className="py-3 px-4 text-right font-bold">{formatCurrency(sale.total_revenue, true)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
