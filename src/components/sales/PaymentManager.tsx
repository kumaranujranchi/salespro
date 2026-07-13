import { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { useQuery, useMutation } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal, ModalFooter } from '../ui/Modal';
import { Plus, Download, TrendingUp, History, Edit2, X, Share2, FileSpreadsheet, Lock, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';
import { exportPaymentLedgerPDF, exportPaymentLedgerExcel, sharePaymentLedger } from '../../utils/export';

interface PaymentManagerProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any | null;
    canEdit?: boolean;
}

export function PaymentManager({ isOpen, onClose, sale, canEdit = false }: PaymentManagerProps) {
    const { profile, tenant } = useAuth();
    const dialog = useDialog();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingPayment, setEditingPayment] = useState<any | null>(null);

    const [paymentData, setPaymentData] = useState({
        paymentDate: new Date().toISOString().slice(0, 10),
        amount: '',
        paymentType: 'installment',
        paymentMode: 'cheque',
        remarks: '',
        transactionReference: ''
    });

    // Convex Queries
    const payments = useQuery(api.payments.listPayments, (isOpen && sale && profile?.tenant_id) ? {
        tenant_id: profile.tenant_id as Id<"tenants">,
        sale_id: sale?._id as Id<"sales">
    } : "skip");

    // Mutations
    const addPayment = useMutation(api.payments.addPayment);
    const deletePayment = useMutation(api.payments.deletePayment);

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sale || !profile?.tenant_id) return;
        setIsSubmitting(true);

        try {
            await addPayment({
                tenant_id: profile.tenant_id as Id<"tenants">,
                sale_id: sale._id as Id<"sales">,
                payment_date: paymentData.paymentDate,
                amount: parseFloat(paymentData.amount),
                payment_type: paymentData.paymentType,
                payment_mode: paymentData.paymentMode,
                remarks: paymentData.remarks,
                transaction_reference: paymentData.transactionReference,
                recorded_by: profile.id as Id<"profiles">
            });

            toast.success("Payment recorded successfully");
            setShowAddForm(false);
            setPaymentData({
                paymentDate: new Date().toISOString().slice(0, 10),
                amount: '',
                paymentType: 'installment',
                paymentMode: 'cheque',
                remarks: '',
                transactionReference: ''
            });
        } catch (err: any) {
            toast.error(err.message || "Failed to save payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!sale) return null;

    const isFreePlan = tenant?.plan_tier === 'free';
    const totalReceived = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const totalRevenue = sale.total_revenue || 0;
    const pendingAmount = totalRevenue - totalReceived;
    const receivedPercentage = totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Payments - ${sale.customer?.name}`} size="xl">
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <SummaryCard title="Total Value" value={formatCurrency(totalRevenue)} color="text-gray-900" />
                    <SummaryCard title="Received" value={formatCurrency(totalReceived)} color="text-green-600" subtitle={`${receivedPercentage.toFixed(1)}%`} />
                    <SummaryCard title="Pending" value={formatCurrency(pendingAmount)} color="text-red-600" />
                </div>

                {/* Ledger actions bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={isFreePlan ? () => toast.info("Downloading payment ledger is a Pro feature. Please upgrade your plan.") : () => exportPaymentLedgerPDF(sale, payments || [], tenant)}
                            className="bg-white dark:bg-transparent text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            title="Download PDF"
                        >
                            {isFreePlan ? <Lock size={14} className="mr-1.5" /> : <FileText size={14} className="mr-1.5" />}
                            PDF Ledger {isFreePlan && "(Pro)"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={isFreePlan ? () => toast.info("Downloading payment ledger is a Pro feature. Please upgrade your plan.") : () => exportPaymentLedgerExcel(sale, payments || [], tenant)}
                            className="bg-white dark:bg-transparent text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Download Excel"
                        >
                            {isFreePlan ? <Lock size={14} className="mr-1.5" /> : <FileSpreadsheet size={14} className="mr-1.5" />}
                            Excel {isFreePlan && "(Pro)"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={isFreePlan ? () => toast.info("Sharing payment ledger is a Pro feature. Please upgrade your plan.") : () => sharePaymentLedger(sale, payments || [], tenant)}
                            className="bg-white dark:bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Share Ledger"
                        >
                            {isFreePlan ? <Lock size={14} className="mr-1.5" /> : <Share2 size={14} className="mr-1.5" />}
                            Share {isFreePlan && "(Pro)"}
                        </Button>
                    </div>
                    {canEdit && (
                        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? "outline" : "primary"}>
                            {showAddForm ? "Cancel" : "Add Payment"}
                        </Button>
                    )}
                </div>

                <div className="flex justify-between items-center">
                    <h4 className="font-bold flex items-center gap-2"><History size={18}/> Payment History</h4>
                </div>

                {showAddForm && canEdit && (
                    <form onSubmit={handleAddPayment} className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                        <Input label="Date" type="date" value={paymentData.paymentDate} onChange={e => setPaymentData({ ...paymentData, paymentDate: e.target.value })} required />
                        <Input label="Amount" type="number" value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })} required />
                        <Select label="Type" value={paymentData.paymentType} onChange={e => setPaymentData({ ...paymentData, paymentType: e.target.value })} 
                            options={[
                                { label: 'Installment', value: 'installment' },
                                { label: 'Booking', value: 'booking' },
                                { label: 'Final', value: 'final' }
                            ]} />
                        <Select label="Mode" value={paymentData.paymentMode} onChange={e => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                            options={[
                                { label: 'Cheque', value: 'cheque' },
                                { label: 'Cash', value: 'cash' },
                                { label: 'UPI', value: 'upi' },
                                { label: 'Transfer', value: 'bank_transfer' }
                            ]} />
                        <div className="col-span-2">
                           <Button type="submit" isLoading={isSubmitting} className="w-full">Save Payment</Button>
                        </div>
                    </form>
                )}

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left">Date</th>
                                <th className="px-4 py-2 text-left">Type</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                                {canEdit && <th className="px-4 py-2 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {payments?.map(p => (
                                <tr key={p._id}>
                                    <td className="px-4 py-2">{p.payment_date}</td>
                                    <td className="px-4 py-2 capitalize">{p.payment_type}</td>
                                    <td className="px-4 py-2 text-right font-bold">{formatCurrency(p.amount)}</td>
                                    {canEdit && (
                                        <td className="px-4 py-2 text-right">
                                            <button 
                                                onClick={async () => {
                                                    if (await dialog.confirm("Are you sure you want to delete this payment record?")) {
                                                        await deletePayment({ id: p._id });
                                                        toast.success("Payment record deleted successfully");
                                                    }
                                                }} 
                                                className="text-red-500 hover:text-red-700 ml-2"
                                                title="Delete Payment"
                                            >
                                                <X size={14}/>
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ModalFooter><Button variant="outline" onClick={onClose}>Close</Button></ModalFooter>
        </Modal>
    );
}

function SummaryCard({ title, value, color, subtitle }: any) {
    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
            <p className="text-xs text-gray-500">{title}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
        </div>
    );
}
