import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { supabase } from '../../lib/supabase';
import { Sale, Payment } from '../../types/database';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal, ModalFooter } from '../ui/Modal';
import { Plus, Download, TrendingUp, History, Edit2, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

interface PaymentManagerProps {
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
}

export function PaymentManager({ isOpen, onClose, sale }: PaymentManagerProps) {
    const { user } = useAuth();
    const dialog = useDialog();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Payment Form State
    // New Payment Form State
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [paymentData, setPaymentData] = useState({
        paymentDate: new Date().toISOString().slice(0, 10),
        amount: '',
        paymentType: 'installment',
        paymentMode: 'cheque',
        remarks: ''
    });

    useEffect(() => {
        if (isOpen && sale) {
            loadPayments();
            setShowAddForm(false);
        }
    }, [isOpen, sale]);

    const loadPayments = async () => {
        if (!sale) return;
        setLoading(true);
        const { data } = await supabase
            .from('payments')
            .select('*')
            .eq('sale_id', sale.id)
            .order('payment_date', { ascending: false });

        if (data) setPayments(data as Payment[]); // Cast if needed, assuming types match DB
        setLoading(false);
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sale || !user) return;
        setIsSubmitting(true);

        try {
            if (editingPayment) {
                // Update existing payment
                const { error } = await supabase
                    .from('payments')
                    .update({
                        payment_date: paymentData.paymentDate,
                        amount: parseFloat(paymentData.amount),
                        payment_type: paymentData.paymentType,
                        payment_mode: paymentData.paymentMode,
                        remarks: paymentData.remarks,
                    })
                    .eq('id', editingPayment.id);

                if (error) throw error;
                await dialog.alert('Payment updated successfully!', { variant: 'success' });
            } else {
                // Insert new payment
                const { error } = await supabase.from('payments').insert({
                    sale_id: sale.id,
                    payment_date: paymentData.paymentDate,
                    amount: parseFloat(paymentData.amount),
                    payment_type: paymentData.paymentType,
                    payment_mode: paymentData.paymentMode,
                    remarks: paymentData.remarks,
                    recorded_by: user.id
                });

                if (error) throw error;
                await dialog.alert('Payment recorded successfully!', { variant: 'success' });
            }

            setShowAddForm(false);
            setEditingPayment(null);
            setPaymentData({
                paymentDate: new Date().toISOString().slice(0, 10),
                amount: '',
                paymentType: 'installment',
                paymentMode: 'cheque',
                remarks: ''
            });
            loadPayments();
        } catch (err: any) {
            console.error('Error saving payment:', err);
            await dialog.alert('Failed to save payment.', { variant: 'danger' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditPayment = (payment: Payment) => {
        setEditingPayment(payment);
        setPaymentData({
            paymentDate: payment.payment_date,
            amount: payment.amount.toString(),
            paymentType: payment.payment_type || 'installment',
            paymentMode: payment.payment_mode || 'cheque',
            remarks: payment.remarks || ''
        });
        setShowAddForm(true);
    };

    const handleCancelForm = () => {
        setShowAddForm(false);
        setEditingPayment(null);
        setPaymentData({
            paymentDate: new Date().toISOString().slice(0, 10),
            amount: '',
            paymentType: 'installment',
            paymentMode: 'cheque',
            remarks: ''
        });
    };

    const handleDownloadLedger = () => {
        if (!payments.length || !sale) return;

        // CSV Headers
        const headers = ['Date', 'Payment Type', 'Payment Mode', 'Amount', 'Remarks', 'Transaction Ref'];

        // CSV Rows
        const rows = payments.map(p => [
            new Date(p.payment_date).toLocaleDateString(),
            p.payment_type?.replace('_', ' ').toUpperCase() || '',
            p.payment_mode?.replace('_', ' ').toUpperCase() || '',
            p.amount,
            `"${p.remarks || ''}"`, // Quote remarks to handle commas
            `"${(p as any).transaction_reference || ''}"`
        ]);

        // Combine
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Ledger_${(sale as any).customer?.name || 'Customer'}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!sale) return null;

    const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalRevenue = sale.total_revenue || 0;
    const pendingAmount = totalRevenue - totalReceived;
    const receivedPercentage = totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0;

    const chartData = [
        { name: 'Received', value: totalReceived },
        { name: 'Pending', value: pendingAmount < 0 ? 0 : pendingAmount }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Payment Management - ${(sale as any).customer?.name || 'Customer'}`}
            size="xl"
        >
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#131f1a] p-5 rounded-lg border border-gray-200 dark:border-[#2a3f35] shadow-sm dark:shadow-none">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Sale Value</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <div className="bg-white dark:bg-[#131f1a] p-5 rounded-lg border border-gray-200 dark:border-[#2a3f35] shadow-sm dark:shadow-none">
                        <p className="text-sm text-green-600 dark:text-[#00d26a] font-medium">Received Amount</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-[#00d26a] mt-1">{formatCurrency(totalReceived)}</p>
                        <p className="text-xs text-gray-500 mt-1">{receivedPercentage.toFixed(1)}% Collected</p>
                    </div>
                    <div className="bg-white dark:bg-[#131f1a] p-5 rounded-lg border border-gray-200 dark:border-[#2a3f35] shadow-sm dark:shadow-none">
                        <p className="text-sm text-red-500 dark:text-red-400 font-medium">Pending Balance</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-500 mt-1">{formatCurrency(pendingAmount)}</p>
                    </div>
                </div>

                {/* Main Content Area: Chart & Action */}
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Collection Graph */}
                    <div className="w-full md:w-1/2 h-48 bg-white dark:bg-[#131f1a] rounded-lg p-2 border border-gray-200 dark:border-[#2a3f35] shadow-sm dark:shadow-none">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2 px-2 flex items-center gap-1">
                            <TrendingUp size={14} /> Collection Progress
                        </h4>
                        <ResponsiveContainer width="100%" height="80%">
                            <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={70} 
                                    tick={({ x, y, payload }) => (
                                        <text x={x} y={y} dy={4} textAnchor="end" className="fill-gray-600 dark:fill-gray-400 text-xs font-medium">
                                            {payload.value}
                                        </text>
                                    )} 
                                />
                                <RechartsTooltip 
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(val: number) => formatCurrency(val)} 
                                    contentStyle={{ backgroundColor: 'var(--bg-surface, #fff)', borderColor: 'var(--border-color, #e2e8f0)', color: 'var(--text-primary, #000)' }}
                                    itemStyle={{ color: 'inherit' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Actions */}
                    <div className="w-full md:w-1/2 flex flex-col justify-center gap-3">
                        <Button 
                            className="w-full bg-[#10B981] hover:bg-[#059669] text-white dark:bg-[#00d26a] dark:hover:bg-[#00b359] dark:text-black font-semibold border-none"
                            onClick={() => showAddForm ? handleCancelForm() : setShowAddForm(true)}
                        >
                            {showAddForm ? 'Cancel' : 'Add Payment'}
                            {!showAddForm && <Plus size={16} className="ml-2" />}
                            {showAddForm && <X size={16} className="ml-2" />}
                        </Button>
                        <Button 
                            className="w-full bg-transparent hover:bg-gray-50 border border-emerald-500 text-emerald-600 dark:bg-transparent dark:border-[#00d26a] dark:text-[#00d26a] dark:hover:bg-[#00d26a]/10"
                            onClick={handleDownloadLedger}
                        >
                            <Download size={16} className="mr-2" /> Download Ledger
                        </Button>
                    </div>
                </div>

                {/* Add Payment Form */}
                <form onSubmit={handleAddPayment} className={`bg-gray-50 dark:bg-[#131f1a] p-6 rounded-lg border border-gray-200 dark:border-[#2a3f35] space-y-4 ${showAddForm ? 'block' : 'hidden'}`}>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{editingPayment ? 'Edit Payment Entry' : 'New Payment Entry'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label="Date" 
                            type="date" 
                            className="bg-white dark:bg-[#1a2c25] border-gray-300 dark:border-[#2a3f35] focus:border-[#10B981] dark:focus:border-[#00d26a] text-gray-900 dark:text-white placeholder-gray-500"
                            value={paymentData.paymentDate} 
                            onChange={e => setPaymentData({ ...paymentData, paymentDate: e.target.value })} 
                            required 
                        />
                        <Input 
                            label="Amount" 
                            type="number" 
                            className="bg-white dark:bg-[#1a2c25] border-gray-300 dark:border-[#2a3f35] focus:border-[#10B981] dark:focus:border-[#00d26a] text-gray-900 dark:text-white placeholder-gray-500"
                            value={paymentData.amount} 
                            onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })} 
                            required 
                        />
                        <Select
                            label="Payment Type"
                            className="bg-white dark:bg-[#1a2c25] border-gray-300 dark:border-[#2a3f35] focus:border-[#10B981] dark:focus:border-[#00d26a] text-gray-900 dark:text-white"
                            value={paymentData.paymentType}
                            onChange={e => setPaymentData({ ...paymentData, paymentType: e.target.value })}
                            options={[
                                { label: 'EMI', value: 'emi' },
                                { label: 'Advance', value: 'advance' },
                                { label: 'Booking', value: 'booking' },
                                { label: 'Token', value: 'token' },
                                { label: 'Loan Disbursment', value: 'loan_disbursement' },
                            ]}
                        />
                        <Select
                            label="Mode"
                            className="bg-white dark:bg-[#1a2c25] border-gray-300 dark:border-[#2a3f35] focus:border-[#10B981] dark:focus:border-[#00d26a] text-gray-900 dark:text-white"
                            value={paymentData.paymentMode}
                            onChange={e => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                            options={[
                                { label: 'Cash', value: 'cash' },
                                { label: 'Cheque', value: 'cheque' },
                                { label: 'Account Transfer', value: 'account_transfer' },
                                { label: 'UPI', value: 'upi' },
                                { label: 'DD', value: 'dd' },
                            ]}
                        />
                    </div>
                    <Input 
                        label="Remarks / Transaction Ref" 
                        className="bg-white dark:bg-[#1a2c25] border-gray-300 dark:border-[#2a3f35] focus:border-[#10B981] dark:focus:border-[#00d26a] text-gray-900 dark:text-white placeholder-gray-500"
                        value={paymentData.remarks} 
                        onChange={e => setPaymentData({ ...paymentData, remarks: e.target.value })} 
                    />
                    <div className="flex justify-end">
                        <Button 
                            type="submit" 
                            className="bg-[#10B981] hover:bg-[#059669] text-white dark:bg-[#00d26a] dark:hover:bg-[#00b359] dark:text-black font-bold px-6 border-none"
                            isLoading={isSubmitting} 
                            size="sm"
                        >
                            {editingPayment ? 'Update Payment' : 'Save Payment'}
                        </Button>
                    </div>
                </form>

                {/* Payment History List */}
                <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <History size={16} /> Payment History
                    </h4>
                    {loading ? (
                        <div className="text-center py-4 text-gray-400">Loading...</div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 dark:border-[#2a3f35] bg-gray-50 dark:bg-[#131f1a]/50 rounded-lg">
                            No payments recorded yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-gray-200 dark:border-[#2a3f35] rounded-lg bg-white dark:bg-[#131f1a]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-[#1a2c25] text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-[#2a3f35]">
                                    <tr>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Type</th>
                                        <th className="px-4 py-2">Mode</th>
                                        <th className="px-4 py-2 text-right">Amount</th>
                                        <th className="px-4 py-2">Remarks</th>
                                        <th className="px-4 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-[#2a3f35]">
                                    {payments.map(payment => (
                                        <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2c25] text-gray-700 dark:text-gray-300">
                                            <td className="px-4 py-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 capitalize">{payment.payment_type?.replace('_', ' ')}</td>
                                            <td className="px-4 py-2 capitalize">{payment.payment_mode?.replace('_', ' ')}</td>
                                            <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(Number(payment.amount))}</td>
                                            <td className="px-4 py-2 text-gray-500 truncate max-w-[150px]">{payment.remarks || '-'}</td>
                                            <td className="px-4 py-2 text-right">
                                                <button 
                                                    onClick={() => handleEditPayment(payment)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-[#2a3f35] rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                                    title="Edit Payment"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <ModalFooter>
                <Button 
                    onClick={onClose} 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-[#00d26a] dark:hover:bg-[#00b359] dark:text-black font-bold border-none px-6"
                >
                    Close
                </Button>
            </ModalFooter>
        </Modal>
    );
}
