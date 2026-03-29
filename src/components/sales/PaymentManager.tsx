import { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal, ModalFooter } from '../ui/Modal';
import { Plus, Download, TrendingUp, History, Edit2, X, Share2, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';

interface PaymentManagerProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any | null;
}

export function PaymentManager({ isOpen, onClose, sale }: PaymentManagerProps) {
    const { profile } = useAuth();
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
        sale_id: sale._id as Id<"sales">
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

    const totalReceived = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const totalRevenue = sale.total_revenue || 0;
    const pendingAmount = totalRevenue - totalReceived;
    const receivedPercentage = totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0;

    const chartData = [
        { name: 'Received', value: totalReceived },
        { name: 'Pending', value: pendingAmount < 0 ? 0 : pendingAmount }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Payments - ${sale.customer?.name}`} size="xl">
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <SummaryCard title="Total Value" value={formatCurrency(totalRevenue)} color="text-gray-900" />
                    <SummaryCard title="Received" value={formatCurrency(totalReceived)} color="text-green-600" subtitle={`${receivedPercentage.toFixed(1)}%`} />
                    <SummaryCard title="Pending" value={formatCurrency(pendingAmount)} color="text-red-600" />
                </div>

                <div className="flex justify-between items-center">
                    <h4 className="font-bold flex items-center gap-2"><History size={18}/> Payment History</h4>
                    <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? "outline" : "primary"}>
                        {showAddForm ? "Cancel" : "Add Payment"}
                    </Button>
                </div>

                {showAddForm && (
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
                                <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {payments?.map(p => (
                                <tr key={p._id}>
                                    <td className="px-4 py-2">{p.payment_date}</td>
                                    <td className="px-4 py-2 capitalize">{p.payment_type}</td>
                                    <td className="px-4 py-2 text-right font-bold">{formatCurrency(p.amount)}</td>
                                    <td className="px-4 py-2 text-right">
                                        <button onClick={() => deletePayment({ id: p._id })} className="text-red-500 hover:text-red-700 ml-2"><X size={14}/></button>
                                    </td>
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
