import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
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
import { useState, useMemo } from 'react';

export function CRMDashboard() {
    const { profile } = useAuth();
    const [leaderboardTimeFilter, setLeaderboardTimeFilter] = useState<'this_month' | 'this_year'>('this_month');

    const tenantId = profile?.tenant_id as Id<"tenants">;

    // Convex Queries
    const projects = useQuery(api.projects.listAllProjects, tenantId ? { tenant_id: tenantId } : "skip");
    const profiles = useQuery(api.profiles.listUsersByTenant, tenantId ? { tenant_id: tenantId } : "skip");
    const departments = useQuery(api.departments.list, tenantId ? { tenant_id: tenantId } : "skip");
    const pendingVisitsCount = useQuery(api.site_visits.countPendingVisits, tenantId ? { tenant_id: tenantId } : "skip");
    const crmStats = useQuery(api.leads.getDashboardStats, tenantId ? { tenant_id: tenantId } : "skip");
    const salesAnalytics = useQuery(api.sales.getSalesAnalytics, tenantId ? { tenant_id: tenantId, year: new Date().getFullYear() } : "skip");
    const recentActivity = useQuery(api.activity_logs.listRecent, tenantId ? { tenant_id: tenantId, limit: 10 } : "skip");
    const announcements = useQuery(api.announcements.listPublished, tenantId ? { tenant_id: tenantId, limit: 3 } : "skip");
    const recentSales = useQuery(api.sales.listSales, tenantId ? { tenant_id: tenantId } : "skip");

    const loading = !crmStats || !salesAnalytics || !projects || !profiles;

    const permissions = profile?.role_details?.permissions?.dashboard || {
        sales_view: 'overall',
        kpi_cards: true,
        project_performance: true,
        leaderboard: true,
        upcoming_events: true,
        recent_activity: true
    };
    const salesView = permissions.sales_view || 'overall';

    // Derived Stats
    const stats = useMemo(() => ({
        totalProjects: projects?.filter(p => p.is_active).length || 0,
        totalTeamMembers: profiles?.filter(p => p.is_active).length || 0,
        totalDepartments: departments?.length || 0,
        monthlySales: crmStats?.newLeads || 0, // Fallback if specialized monthly sales query not present
        monthlyRevenue: 0, // Needs specialized query or calculation
        ytdSales: crmStats?.totalLeads || 0,
        ytdRevenue: 0,
        pendingSiteVisits: pendingVisitsCount || 0,
    }), [projects, profiles, departments, pendingVisitsCount, crmStats]);

    // Leaderboard calculation from sales
    const topPerformers = useMemo(() => {
        if (!recentSales) return [];
        const leaderboardMap = new Map<string, any>();
        recentSales.forEach(sale => {
            const userId = sale.sales_executive_id;
            const current = leaderboardMap.get(userId) || { id: userId, name: sale.executive?.full_name || 'Unknown', salesCount: 0, revenue: 0 };
            current.salesCount++;
            current.revenue += sale.total_revenue;
            leaderboardMap.set(userId, current);
        });
        return Array.from(leaderboardMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [recentSales]);

    if (!tenantId) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                    <Building className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold">Workspace Missing</h2>
                <p className="text-gray-500 max-w-md">Your user account is not assigned to any workspace or tenant. Please contact your system administrator to fix your profile settings.</p>
            </div>
        );
    }

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
                    <KPICard title="Total Leads" value={crmStats.totalLeads} icon={TrendingUp} iconBgColor="bg-emerald-50" iconColor="text-emerald-600" />
                    <KPICard title="Qualified" value={crmStats.qualified} icon={Award} iconBgColor="bg-blue-50" iconColor="text-blue-600" />
                    <KPICard title="Converted" value={crmStats.converted} icon={CreditCard} iconBgColor="bg-blue-50" iconColor="text-blue-600" />
                    <KPICard title="Pending Visits" value={stats.pendingSiteVisits} icon={Building} iconBgColor="bg-blue-50" iconColor="text-blue-600" />
                </div>
            )}

            {salesView !== 'none' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="rounded-3xl border-0 shadow-lg">
                        <CardHeader><CardTitle>Sales Trend</CardTitle></CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesAnalytics}>
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
                                <AreaChart data={salesAnalytics}>
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
                    <div className="lg:col-span-1"><ActivityCalendar activities={recentActivity || []} /></div>
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
                                {topPerformers.length === 0 && <p className="text-center text-gray-500 py-4">No sales recorded yet.</p>}
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
                                {(announcements || []).map(ann => (
                                    <div key={ann._id} className="p-4 bg-gray-50 rounded-2xl">
                                        <h4 className="font-bold">{ann.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{ann.content}</p>
                                    </div>
                                ))}
                                {announcements?.length === 0 && <p className="text-center text-gray-500 py-4">No recent announcements.</p>}
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
                                    {(recentSales || []).slice(0, 6).map(sale => (
                                        <tr key={sale._id} className="border-b last:border-0">
                                            <td className="py-3 px-4">{sale.customer?.name}</td>
                                            <td className="py-3 px-4">{sale.project?.name}</td>
                                            <td className="py-3 px-4">{sale.executive?.full_name}</td>
                                            <td className="py-3 px-4 text-right font-bold">{formatCurrency(sale.total_revenue, true)}</td>
                                        </tr>
                                    ))}
                                    {recentSales?.length === 0 && (
                                        <tr><td colSpan={4} className="text-center py-8 text-gray-500">No recent sales.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
