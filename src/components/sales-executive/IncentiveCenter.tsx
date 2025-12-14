import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Incentive } from '../../types/database';
import { CheckCircle, Clock, Lock } from 'lucide-react';

export function IncentiveCenter() {
    const { profile } = useAuth();
    const [incentives, setIncentives] = useState<Incentive[]>([]);

    useEffect(() => {
        loadIncentives();
    }, [profile]);

    const loadIncentives = async () => {
        if (!profile?.id) return;
        try {
            const { data, error } = await supabase
                .from('incentives')
                .select('*')
                .eq('sales_executive_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setIncentives(data || []);
        } catch (error) {
            console.error('Error loading incentives:', error);
        } finally {

        }
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

    return (
        <div className="space-y-6">
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
                                    <tr key={inc.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200">{inc.calculation_month} {inc.calculation_year}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{inc.sale_id.slice(0, 8)}...</td>
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
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Inst 2: {formatCurrency(inc.installment_2_amount)} <StatusBadge paid={inc.installment_2_paid} /></span>
                                                </div>
                                                <div className="flex flex-col gap-1 border-l dark:border-white/10 pl-2">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Inst 3: {formatCurrency(inc.installment_3_amount)} <StatusBadge paid={inc.installment_3_paid} /></span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Inst 4: {formatCurrency(inc.installment_4_amount)} <StatusBadge paid={inc.installment_4_paid} /></span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
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
