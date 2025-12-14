import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { startOfYear, endOfYear, eachMonthOfInterval, format, isSameMonth, parseISO } from 'date-fns';

export function TargetAchievement() {
    const { profile } = useAuth();
    const [targets, setTargets] = useState<any[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) {
            loadData();
        }
    }, [profile]);

    const loadData = async () => {
        try {
            // Load My Targets
            const { data: targetsData } = await supabase
                .from('sales_targets')
                .select('*')
                .eq('user_id', profile?.id)
                .eq('period_type', 'monthly');

            // Load My Sales
            const { data: salesData } = await supabase
                .from('sales')
                .select('*')
                .eq('sales_executive_id', profile?.id);

            if (targetsData) setTargets(targetsData);
            if (salesData) setSales(salesData);
        } catch (error) {
            console.error('Error loading performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        const yearStart = startOfYear(new Date());
        const yearEnd = endOfYear(new Date());
        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

        return months.map(monthDate => {
            const monthStr = format(monthDate, 'MMM');

            const monthTargets = targets.filter(t =>
                t.start_date &&
                isSameMonth(parseISO(t.start_date), monthDate)
            );
            const totalTarget = monthTargets.reduce((sum, t) => sum + (Number(t.target_sqft) || 0), 0);

            const monthSales = sales.filter(s =>
                s.sale_date &&
                isSameMonth(parseISO(s.sale_date), monthDate)
            );
            const totalAchieved = monthSales.reduce((sum, s) => sum + (Number(s.area_sqft) || 0), 0);

            return {
                name: monthStr,
                target: totalTarget,
                achieved: totalAchieved
            };
        });
    }, [targets, sales]);

    const summary = useMemo(() => {
        const totalTarget = chartData.reduce((sum, d) => sum + d.target, 0);
        const totalAchieved = chartData.reduce((sum, d) => sum + d.achieved, 0);
        const diff = totalAchieved - totalTarget;
        const percent = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;

        return {
            totalTarget,
            totalAchieved,
            diff,
            percent: percent.toFixed(1),
            isPositive: diff >= 0
        };
    }, [chartData]);

    if (loading) return (
        <div className="flex justify-center items-center h-64 w-full">
            <div className="loader"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#0A1C37] dark:text-white">My Performance (This Year)</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Summary Cards */}
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle className="dark:text-white">Current Status</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20">
                            <p className="text-sm text-green-800 dark:text-green-300 mb-1">Total Achieved (Sq Ft)</p>
                            <h3 className="text-2xl font-bold text-green-700 dark:text-white">{summary.totalAchieved.toLocaleString()}</h3>
                            <div className="flex items-center text-green-600 dark:text-green-400 text-sm mt-2">
                                <ArrowUpRight size={16} /> <span>Actual Sales</span>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                            <p className="text-sm text-blue-800 dark:text-blue-300 mb-1">Total Target (Sq Ft)</p>
                            <h3 className="text-2xl font-bold text-blue-700 dark:text-white">{summary.totalTarget.toLocaleString()}</h3>
                            <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm mt-2">
                                <span>{summary.percent}% Completion</span>
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl border ${summary.isPositive ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20'}`}>
                            <p className={`text-sm mb-1 ${summary.isPositive ? 'text-indigo-800 dark:text-indigo-300' : 'text-red-800 dark:text-red-300'}`}>
                                {summary.isPositive ? 'Surplus' : 'Shortfall'}
                            </p>
                            <h3 className={`text-2xl font-bold ${summary.isPositive ? 'text-indigo-700 dark:text-white' : 'text-red-700 dark:text-white'}`}>
                                {Math.abs(summary.diff).toLocaleString()}
                            </h3>
                            <div className={`flex items-center text-sm mt-2 ${summary.isPositive ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
                                <ArrowDownRight size={16} /> <span>Difference</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="dark:text-white">Target vs Achievement (Monthly)</CardTitle></CardHeader>
                    <CardContent className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    formatter={(value: number) => [`${value.toLocaleString()} Sq Ft`, '']}
                                />
                                <Legend />
                                <Bar dataKey="target" fill="#e5e7eb" name="Target" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="achieved" fill="#00E576" name="Achieved" radius={[4, 4, 0, 0]} />
                                <ReferenceLine y={0} stroke="#000" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
