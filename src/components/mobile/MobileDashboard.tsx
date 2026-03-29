import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
    TrendingUp,
    DollarSign,
    Users,
    Building,
    CreditCard,
    User,
    MapPin,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis
} from 'recharts';
import { formatCurrency } from '../../utils/format';

export function MobileDashboard() {
    const { profile } = useAuth();
    const tenantId = profile?.tenant_id as Id<"tenants">;
    const userId = profile?._id as Id<"profiles">;

    // Convex Queries
    const overview = useQuery(api.sales.getSalesOverview, 
        tenantId && userId ? { tenant_id: tenantId, executive_id: userId, view: 'overall' } : "skip"
    );
    
    const leaderboard = useQuery(api.sales.getLeaderboard,
        tenantId ? { tenant_id: tenantId, timeFilter: 'this_month', roleFilter: 'all' } : "skip"
    );

    const announcements = useQuery(api.announcements.listPublished,
        tenantId ? { tenant_id: tenantId, limit: 3 } : "skip"
    ) || [];

    const recentSales = useQuery(api.sales.listSales,
        tenantId ? { tenant_id: tenantId } : "skip"
    )?.slice(0, 5) || [];

    const staff = useQuery(api.profiles.listUsersByTenant,
        tenantId ? { tenant_id: tenantId, is_active: true } : "skip"
    ) || [];

    const departments = useQuery(api.departments.list,
        tenantId ? { tenant_id: tenantId } : "skip"
    ) || [];

    if (!overview || !leaderboard) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div></div>;

    const stats = {
        monthlySales: overview.mySales,
        monthlyRevenue: overview.monthlyRevenue,
        ytdSales: overview.ytdSalesCount,
        ytdRevenue: overview.ytdRevenue,
        totalProjects: overview.projectStats.length,
        totalTeamMembers: staff.length,
        totalDepartments: departments.length,
        projectStats: overview.projectStats
    };

    const salesChartData = overview.salesTrend;
    const topPerformers = leaderboard.map(l => ({
        id: l.id,
        name: l.name,
        image: l.image_url,
        sales: l.salesCount
    }));

    return (
        <div className="space-y-6 pb-4">
            {/* 1. Welcome Card */}
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white overflow-hidden shadow-lg shadow-blue-200">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="flex flex-col gap-1 relative z-10">
                    <h1 className="text-2xl font-bold">Welcome, {profile?.full_name?.split(' ')[0]}!</h1>
                    <p className="text-sm text-blue-100 mt-1 opacity-90">Here is your daily activity summary.</p>
                </div>
            </div>

            {/* 2. Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                <MetricCard title="Sales (Mo)" value={stats.monthlySales} icon={TrendingUp} color="blue" />
                <MetricCard title="Revenue (Mo)" value={formatCurrency(stats.monthlyRevenue, true)} icon={DollarSign} color="green" />
                <MetricCard title="Sales (YTD)" value={stats.ytdSales} icon={TrendingUp} color="indigo" />
                <MetricCard title="Revenue (YTD)" value={formatCurrency(stats.ytdRevenue, true)} icon={DollarSign} color="emerald" />
                <MetricCard title="Active Projects" value={stats.totalProjects} icon={Building} color="violet" />
                <MetricCard title="Team Members" value={stats.totalTeamMembers} icon={Users} color="amber" />
            </div>

            {/* 3. Project Summary Cards (Horizontal Scroll) */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-slate-800 dark:text-white">Project Performance</h3>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar pl-1">
                    {stats.projectStats.map((p: any, i: number) => (
                        <div key={i} className="min-w-[160px] bg-white dark:bg-surface-dark p-4 rounded-xl shadow-card-custom">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                                <Building size={16} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium truncate">{p.name}</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{p.area.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 dark:text-gray-500">Sq. Ft Sold</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Sales Trends Graph */}
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-card-custom">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" /> Sales Activity
                </h3>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesChartData}>
                            <defs>
                                <linearGradient id="mColorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} fill="url(#mColorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 5. Payments Collections */}
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-card-custom">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-emerald-600 dark:text-emerald-400" /> Collections
                </h3>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesChartData}>
                            <defs>
                                <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value: any) => [formatCurrency(value), 'Collections']}
                            />
                            <Area
                                type="monotone"
                                dataKey="collections"
                                stroke="#10b981"
                                strokeWidth={3}
                                fill="url(#colorCollections)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 6. Top Performers List */}
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-card-custom">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Users size={18} className="text-amber-500" /> Top Performers
                    </h3>
                </div>
                <div className="space-y-4">
                    {topPerformers.map((user, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300' : 'bg-orange-50 dark:bg-orange-500/20 text-orange-600'}`}>
                                {i + 1}
                            </span>
                            {user.image ? (
                                <img src={user.image} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-gray-400 font-bold text-xs">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">{user.sales} Sales</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 7. Announcements */}
            <div className="space-y-3">
                <h3 className="font-bold text-slate-800 dark:text-white px-1">Latest News</h3>
                {announcements.length > 0 ? announcements.map((ann, i) => (
                    <div key={i} className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-card-custom relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">{new Date(ann.created_at).toLocaleDateString()}</span>
                            {ann.is_important && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{ann.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2">{ann.content}</p>
                    </div>
                )) : (
                    <div className="text-center py-8 text-slate-400 text-sm">No announcements</div>
                )}
            </div>

            {/* 8. Recent Sales List (Card Style) */}
            <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <h3 className="font-bold text-slate-800 dark:text-white">Recent Sales</h3>
                    <button className="text-xs text-blue-600 dark:text-blue-400 font-medium">View All</button>
                </div>
                {recentSales.map((sale, i) => (
                    <div key={i} className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-card-custom flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-primary text-sm">{sale.customer?.name}</p>
                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                    <MapPin size={10} />
                                    {sale.project?.name}
                                </div>
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm bg-emerald-50 dark:bg-emerald-500/20 px-2 py-1 rounded-lg">
                                {formatCurrency(sale.total_revenue)}
                            </span>
                        </div>
                        <div className="pt-3 border-t border-slate-50 dark:border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[10px] text-slate-500 dark:text-gray-400">
                                    <User size={10} />
                                </div>
                                <span className="text-xs text-slate-600 dark:text-gray-300">{sale.profile?.full_name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-gray-500">
                                {new Date(sale.sale_date).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
    const colorClasses: any = {
        blue: 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400',
        indigo: 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        violet: 'bg-violet-50 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',
        amber: 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
    };

    return (
        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-card-custom flex flex-col justify-between h-[110px]">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colorClasses[color]}`}>
                <Icon size={16} />
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-gray-400 font-semibold">{title}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight mt-0.5">{value}</p>
            </div>
        </div>
    );
}
