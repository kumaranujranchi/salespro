import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Incentive, Tenant } from '../../types/database';
import { CheckCircle, Clock, Lock, ChevronDown, Info } from 'lucide-react';
import { IncentivePlanSummary } from '../IncentivePlanSummary';

export function IncentiveCenter() {
    const { profile } = useAuth();
    const [incentives, setIncentives] = useState<Incentive[]>([]);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [sales, setSales] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

    const loadData = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            // Fetch incentives
            const { data: incData, error: incError } = await supabase
                .from('incentives')
                .select('*')
                .eq('sales_executive_id', profile.id)
                .order('created_at', { ascending: false });

            if (incError) throw incError;
            setIncentives(incData || []);

            // Fetch tenant settings for rules
            const { data: tenantData, error: tenantError } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', profile.tenant_id)
                .single();

            if (tenantError) throw tenantError;
            setTenant(tenantData);

            // Fetch sales and payments for breakdown
            const { data: salesData } = await supabase.from('sales').select('*').eq('sales_executive_id', profile.id);
            setSales(salesData || []);

            const saleIds = salesData?.map(s => s.id) || [];
            if (saleIds.length > 0) {
                const { data: paymentsData } = await supabase.from('payments').select('*').in('sale_id', saleIds);
                setPayments(paymentsData || []);
            }
        } catch (error) {
            console.error('Error loading incentive data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [profile]);

    const calculateIncentiveDetails = (month: string, year: number) => {
        const userSales = sales.filter(s => {
            if (!s.sale_date) return false;
            const d = new Date(s.sale_date);
            if (isNaN(d.getTime())) return false;
            return d.toLocaleString('default', { month: 'long' }) === month && d.getFullYear() === year && s.is_agreement_done;
        });

        const totalSqft = userSales.reduce((sum, s) => sum + (s.area_sqft || 0), 0);
        
        let baseRate = 0;
        const tiers = tenant?.settings?.incentive_plan?.rules?.tiers || [];
        const applicableTier = tiers.find((t: any) => totalSqft >= t.min && (t.max === null || totalSqft <= t.max));
        
        if (applicableTier) baseRate = applicableTier.rate;
        else if (totalSqft >= 7100) baseRate = 4;
        else if (totalSqft >= 5000) baseRate = 3;
        else if (totalSqft >= 3000) baseRate = 2;
        else if (totalSqft >= 0) baseRate = 1;

        return userSales.map(s => {
            const salePayments = payments.filter(p => p.sale_id === s.id).reduce((sum, p) => sum + p.amount, 0);
            const paymentPct = (salePayments / s.total_revenue) * 100;
            let releasePct = 0;
            if (s.is_registry_done) releasePct = 100;
            else if (paymentPct >= 75) releasePct = 75;
            else if (paymentPct >= 50) releasePct = 50;
            else if (paymentPct >= 30) releasePct = 30;

            const saleProjected = (s.total_revenue * baseRate) / 100;
            return {
                id: s.id,
                booking_no: s.id.slice(0, 8).toUpperCase(),
                sqft: s.area_sqft,
                revenue: s.total_revenue,
                payment_pct: paymentPct.toFixed(1),
                release_pct: releasePct,
                releasable: (saleProjected * releasePct) / 100,
                is_registry_done: s.is_registry_done
            };
        });
    };

    const calculateTotalEarned = () => {
        return incentives.reduce((sum, inc) => sum + Number(inc.total_incentive_amount), 0);
    };

    const calculateTotalPaid = () => {
        return incentives.reduce((sum, inc) => {
            let paid = 0;
            if (inc.installment_1_paid) paid += Number(inc.installment_1_amount);
            if (inc.installment_2_paid) paid += Number(inc.installment_2_amount);
            if (inc.installment_3_paid) paid += Number(inc.installment_3_amount);
            if (inc.installment_4_paid) paid += Number(inc.installment_4_amount);
            return sum + paid;
        }, 0);
    };

    const StatusBadge = ({ paid }: { paid: boolean }) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${paid ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
            {paid ? <CheckCircle size={12} /> : <Clock size={12} />}
            {paid ? 'Paid' : 'Pending'}
        </span>
    );

    if (loading) return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E576]"></div>
      </div>
    );

    return (
        <div className="space-y-6">
            <IncentivePlanSummary tenant={tenant} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-[#00E576] to-[#00C853] p-6 rounded-xl text-[#0A1C37] shadow-lg">
                    <p className="text-[#0A1C37]/80 text-sm font-medium">Total Incentives Earned</p>
                    <h3 className="text-3xl font-bold mt-2">{formatCurrency(calculateTotalEarned())}</h3>
                </div>
                <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Paid to Date</p>
                    <h3 className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">{formatCurrency(calculateTotalPaid())}</h3>
                </div>
                <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pending Payment</p>
                    <h3 className="text-3xl font-bold mt-2 text-yellow-600 dark:text-yellow-400">{formatCurrency(calculateTotalEarned() - calculateTotalPaid())}</h3>
                </div>
            </div>

            <Card className="dark:bg-surface-dark dark:border-white/10">
                <CardHeader><CardTitle className="dark:text-white">Incentive History</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Month</th>
                                    <th className="px-4 py-3">Sale ID</th>
                                    <th className="px-4 py-3 text-right">Total Amount</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3">Installments</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {incentives.map((inc) => (
                                    <React.Fragment key={inc.id}>
                                        <tr 
                                            className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${expandedRecord === inc.id ? 'bg-slate-50 dark:bg-white/5' : ''}`}
                                            onClick={() => setExpandedRecord(expandedRecord === inc.id ? null : inc.id)}
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${expandedRecord === inc.id ? 'rotate-180' : ''}`} />
                                                    {inc.calculation_month} {inc.calculation_year}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{inc.sale_id.slice(0, 8)}...</td>
                                            <td className="px-4 py-3 text-right font-bold text-[#0A1C37] dark:text-white">{formatCurrency(inc.total_incentive_amount)}</td>
                                            <td className="px-4 py-3 text-center">
                                                {inc.is_locked ? (
                                                    <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400"><Lock size={14} /> Locked</span>
                                                ) : (
                                                    <span className="text-blue-600 dark:text-blue-400">Active</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Inst 1: {formatCurrency(inc.installment_1_amount)} <StatusBadge paid={inc.installment_1_paid} /></span>
                                                        <span className="text-xs text-gray-400 uppercase text-[9px] font-bold">Payout Period: {inc.calculation_month}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRecord === inc.id && (
                                            <tr className="bg-slate-50/50 dark:bg-black/20">
                                                <td colSpan={5} className="px-8 py-4 border-l-4 border-[#00E576]">
                                                    <div className="space-y-4">
                                                        <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                            <Info size={14} /> Month's Performance & Breakdown
                                                        </h5>
                                                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/5">
                                                            <table className="w-full text-[11px]">
                                                                <thead className="bg-white/50 dark:bg-white/5 text-gray-400 uppercase">
                                                                    <tr>
                                                                        <th className="px-3 py-2 text-left">Booking Ref</th>
                                                                        <th className="px-3 py-2 text-right">Sq Ft</th>
                                                                        <th className="px-3 py-2 text-center">Payment %</th>
                                                                        <th className="px-3 py-2 text-right">Release %</th>
                                                                        <th className="px-3 py-2 text-right">Releasable (₹)</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
                                                                    {calculateIncentiveDetails(inc.calculation_month, inc.calculation_year).map((b, idx) => (
                                                                        <tr key={idx} className="hover:bg-white dark:hover:bg-white/5">
                                                                            <td className="px-3 py-2 font-mono font-bold text-slate-500">{b.booking_no}</td>
                                                                            <td className="px-3 py-2 text-right">{b.sqft?.toLocaleString()}</td>
                                                                            <td className="px-3 py-2 text-center font-bold text-blue-500">{b.payment_pct}%</td>
                                                                            <td className="px-3 py-2 text-right">
                                                                                <span className="bg-[#00E576]/10 text-[#00E576] px-1.5 py-0.5 rounded font-black text-[9px]">{b.release_pct}%</span>
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right font-bold text-[#00E576]">{formatCurrency(b.releasable)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {incentives.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No incentive records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
