import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { KPICard } from '../ui/KPICard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { TrendingUp, DollarSign, Target, Award, Bell, BarChart3, Wallet, Building } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RecentActivityLog } from '../dashboards/widgets/RecentActivityLog';
import { CelebrationCards } from '../sales-executive/CelebrationCards';

export function ReceptionistDashboard() {
    const { profile } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    const tenantId = profile?.tenant_id as Id<"tenants">;
    const profileId = profile?.id as Id<"profiles">;

    // Convex Queries
    const overview = useQuery(api.sales.getSalesOverview, 
        (tenantId && profileId) ? { tenant_id: tenantId, executive_id: profileId, view: 'overall' } : "skip"
    );

    const announcements = useQuery(api.announcements.listPublished, 
        tenantId ? { tenant_id: tenantId, limit: 5 } : "skip"
    );

    const activityLogs = useQuery(api.activity_logs.listRecent, 
        tenantId ? { tenant_id: tenantId, limit: 10 } : "skip"
    );

    const mtdLeaderboard = useQuery(api.sales.getLeaderboard, 
        tenantId ? { tenant_id: tenantId, timeFilter: 'this_month', roleFilter: 'all' } : "skip"
    );
    
    const ytdLeaderboard = useQuery(api.sales.getLeaderboard, 
        tenantId ? { tenant_id: tenantId, timeFilter: 'this_year', roleFilter: 'all' } : "skip"
    );

    const productMixData = [
        { name: 'Residential', value: 65 },
        { name: 'Commercial', value: 25 },
        { name: 'Land', value: 10 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!overview) return <LoadingSpinner fullScreen />;

    const projectColors = [
        { bg: 'bg-emerald-50', text: 'text-emerald-600' },
        { bg: 'bg-blue-50', text: 'text-blue-600' },
        { bg: 'bg-violet-50', text: 'text-violet-600' },
        { bg: 'bg-amber-50', text: 'text-amber-600' },
    ];

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
                                Welcome Back, {profile?.full_name?.split(' ')[0]}!
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
                    value={overview.mySales}
                    icon={TrendingUp}
                    subtitle="Deals Closed"
                    iconBgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    className="order-1 lg:order-1"
                />
                <KPICard
                    title="Revenue (Monthly)"
                    value={formatCurrency(overview.monthlyRevenue, true)}
                    icon={DollarSign}
                    subtitle={`Target: ${formatCurrency(overview.myTarget, true)}`}
                    iconBgColor="bg-green-50"
                    iconColor="text-green-600"
                    className="order-2 lg:order-2"
                />
                <KPICard
                    title="Total Sales (YTD)"
                    value={overview.ytdSalesCount}
                    icon={BarChart3}
                    subtitle={`Total Area: ${overview.ytdTotalArea.toLocaleString()} sqft`}
                    iconBgColor="bg-teal-50"
                    iconColor="text-teal-600"
                    className="order-3 lg:order-5"
                />
                <KPICard
                    title="Total Revenue (YTD)"
                    value={formatCurrency(overview.ytdRevenue, true)}
                    icon={Wallet}
                    subtitle="Payments Received"
                    iconBgColor="bg-cyan-50"
                    iconColor="text-cyan-600"
                    className="order-4 lg:order-6"
                />
                <KPICard
                    title="Achievement"
                    value={`${overview.achievementPercent.toFixed(1)}%`}
                    icon={Target}
                    subtitle="Monthly Goal"
                    iconBgColor="bg-yellow-50"
                    iconColor="text-yellow-600"
                    className="order-5 lg:order-3"
                />
                <KPICard
                    title="Incentives (YTD)"
                    value={formatCurrency(overview.totalIncentives)}
                    icon={Award}
                    subtitle="Total Earnings"
                    iconBgColor="bg-rose-50"
                    iconColor="text-rose-600"
                    className="order-6 lg:order-4"
                />
            </div>

            {overview.projectStats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {overview.projectStats.map((proj: any, index: number) => {
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
                            {(mtdLeaderboard || []).length > 0 ? (
                                mtdLeaderboard?.map((item, index) => (
                                    <LeaderboardItem key={index} rank={index + 1} name={item.name} area={item.revenue} image_url={item.image_url} />
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
                            {(ytdLeaderboard || []).length > 0 ? (
                                ytdLeaderboard?.map((item, index) => (
                                    <LeaderboardItem key={index} rank={index + 1} name={item.name} area={item.revenue} image_url={item.image_url} />
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
                            <LineChart data={overview.salesTrend} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                <defs>
                                    <filter id="neon-glow" height="300%" width="300%" x="-75%" y="-75%">
                                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
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
                            {(announcements || []).map((ann) => (
                                <div key={ann._id} className="py-3">
                                    <p className="font-semibold text-gray-800 dark:text-white">{ann.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{ann.content}</p>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(ann.created_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                            {(announcements || []).length === 0 && <p className="text-gray-500 dark:text-gray-400 py-2">No new announcements.</p>}
                        </div>
                    </CardContent>
                </Card>

                <RecentActivityLog activities={activityLogs || []} />
            </div>

            <CelebrationCards />
        </div>
    );
}
