import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id, Doc } from '../../../convex/_generated/dataModel';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { KPICard } from '../ui/KPICard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { TrendingUp, DollarSign, Target, Award, BarChart3, Wallet, Building } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { RecentActivityLog } from '../dashboards/widgets/RecentActivityLog';
import { CelebrationCards } from './CelebrationCards';

export function SalesOverview() {
    const { profile, tenant } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    const isReceptionist = profile?.role === 'receptionist';

    const permissions = profile?.role_details?.permissions?.dashboard || {
        sales_view: isReceptionist ? 'overall' : 'self',
        kpi_cards: true,
        project_performance: true,
        leaderboard: true,
        upcoming_events: true,
        recent_activity: true
    };
    const salesView = permissions.sales_view || (isReceptionist ? 'overall' : 'self');

    const tenantId = profile?.tenant_id as Id<"tenants">;
    const profileId = profile?._id as Id<"profiles">;

    // Convex Queries
    const overviewData = useQuery(api.sales.getSalesOverview, 
        (tenantId && profileId) ? { tenant_id: tenantId, executive_id: profileId, view: salesView } : "skip"
    );
    const activityLogs = useQuery(api.activity_logs.listRecent, 
        tenantId ? { tenant_id: tenantId, limit: 10 } : "skip"
    );

    const loading = !overviewData;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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
                                Welcome Back, {profile?.full_name?.split(' ')[0]}!
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
                        value={overviewData.mySales}
                        icon={TrendingUp}
                        subtitle="Deals Closed"
                        iconBgColor="bg-blue-50"
                        iconColor="text-blue-600"
                    />
                    <KPICard
                        title={isReceptionist ? "Total Revenue" : "Revenue (Monthly)"}
                        value={formatCurrency(overviewData.monthlyRevenue, true)}
                        icon={DollarSign}
                        subtitle={isReceptionist ? "Company Wide" : `Target: ${formatCurrency(overviewData.myTarget, true)}`}
                        iconBgColor="bg-green-50"
                        iconColor="text-green-600"
                    />
                    <KPICard
                        title="Total Sales (YTD)"
                        value={overviewData.ytdSalesCount}
                        icon={BarChart3}
                        subtitle={`Total Area: ${overviewData.ytdTotalArea.toLocaleString()} sqft`}
                        iconBgColor="bg-indigo-50"
                        iconColor="text-indigo-600"
                    />
                    <KPICard
                        title="Total Revenue (YTD)"
                        value={formatCurrency(overviewData.ytdRevenue, true)}
                        icon={Wallet}
                        subtitle="YTD Performance"
                        iconBgColor="bg-teal-50"
                        iconColor="text-teal-600"
                    />
                    <KPICard
                        title="Achievement"
                        value={`${overviewData.achievementPercent.toFixed(1)}% `}
                        icon={Target}
                        subtitle="Monthly Goal"
                        iconBgColor="bg-yellow-50"
                        iconColor="text-yellow-600"
                    />
                    {tenant?.settings?.features?.incentives !== false && (
                        <KPICard
                            title="Incentives (YTD)"
                            value={formatCurrency(overviewData.totalIncentives)}
                            icon={Award}
                            subtitle="Total Earnings"
                            iconBgColor="bg-purple-50"
                            iconColor="text-purple-600"
                        />
                    )}
                </div>
            )}

            {permissions.project_performance && overviewData.projectStats.length > 0 && (
                <div
                    className={`grid gap-3 md:gap-6 ${overviewData.projectStats.length === 1 ? 'grid-cols-1' :
                            overviewData.projectStats.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                                overviewData.projectStats.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                                    'grid-cols-2 md:grid-cols-4'
                        }`}
                >
                    {overviewData.projectStats.map((proj: any, index: number) => {
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
                                <LineChart data={overviewData.salesTrend} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} vertical={false} />
                                    <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} dx={-10} />
                                    <RechartsTooltip />
                                    <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <RecentActivityLog activities={activityLogs || []} />
                </div>
            )}

            {permissions.upcoming_events && (
                <CelebrationCards />
            )}
        </div>
    );
}
