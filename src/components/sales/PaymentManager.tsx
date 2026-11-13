import { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { useQuery, useMutation } from "../../lib/reactive";
import { api, Id } from '../../lib/api-endpoints';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal, ModalFooter } from '../ui/Modal';
import { UpgradeToProModal } from '../ui/UpgradeToProModal';
import { Plus, Download, TrendingUp, History, Edit2, X, Share2, FileSpreadsheet, Lock, FileText, MessageSquare, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';
import { exportPaymentLedgerPDF, exportPaymentLedgerExcel, sharePaymentLedger, exportPaymentReceiptPDF, sharePaymentReceiptWhatsApp } from '../../utils/export';

interface PaymentManagerProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any | null;
    canEdit?: boolean;
}

export function PaymentManager(props: PaymentManagerProps) {
    if (!props.isOpen || !props.sale) return null;
    return <PaymentManagerContent {...props} />;
}

function PaymentManagerContent({ isOpen, onClose, sale, canEdit = false }: PaymentManagerProps) {
    const { profile, tenant } = useAuth();
    const dialog = useDialog();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingPayment, setEditingPayment] = useState<any | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const [paymentData, setPaymentData] = useState({
        paymentDate: new Date().toISOString().slice(0, 10),
        amount: '',
        paymentType: 'installment',
        paymentMode: 'cheque',
        remarks: '',
        transactionReference: ''
    });

    const isFreePlan = tenant?.plan_tier === 'free';
    const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
    const isSuperAdmin = normalizedRole === 'super_admin' || normalizedRole === 'platform_admin' || profile?.role === 'super_admin' || profile?.role === 'platform_admin';

    const saleId = sale?._id || sale?.id;

    // Backend queries
    const payments = useQuery(api.payments.listPayments, (sale && profile?.tenant_id && saleId) ? {
        tenant_id: profile.tenant_id as Id<"tenants">,
        sale_id: saleId as Id<"sales">
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
                sale_id: (sale._id || sale.id) as Id<"sales">,
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

    const handleLockedLedgerClick = () => {
        if (isSuperAdmin) {
            setShowUpgradeModal(true);
        } else {
            toast.info("Downloading payment ledger is a Pro feature. Please contact your organization administrator to upgrade the plan.");
        }
    };

    const paymentItems = Array.isArray(payments) ? payments : [];
    const totalReceived = paymentItems.reduce((sum: number, p: any) => sum + (Number(p?.amount) || 0), 0);
    const totalRevenue = Number(sale?.total_revenue) || 0;
    const pendingAmount = Math.max(0, totalRevenue - totalReceived);
    const receivedPercentage = totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0;

    const customerDisplayName = (typeof sale?.customer === 'object' && sale?.customer?.name)
        ? sale.customer.name
        : (sale?.customer_name || sale?.customer || 'Customer');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Payments - ${customerDisplayName}`} size="xl">
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <SummaryCard title="Total Value" value={formatCurrency(totalRevenue)} color="text-gray-900" />
                    <SummaryCard title="Received" value={formatCurrency(totalReceived)} color="text-green-600" subtitle={`${receivedPercentage.toFixed(1)}%`} />
                    <SummaryCard title="Pending" value={formatCurrency(pendingAmount)} color="text-red-600" />
                </div>

                {/* Ledger actions bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={isFreePlan ? handleLockedLedgerClick : () => exportPaymentLedgerPDF(sale, paymentItems, tenant)}
                            className="bg-white dark:bg-transparent text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            title="Download PDF"
                        >
                            {isFreePlan ? <Lock size={14} className="mr-1.5" /> : <FileText size={14} className="mr-1.5" />}
                            PDF Ledger {isFreePlan && "(Pro)"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={isFreePlan ? handleLockedLedgerClick : () => exportPaymentLedgerExcel(sale, paymentItems, tenant)}
                            className="bg-white dark:bg-transparent text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Download Excel"
                        >
                            {isFreePlan ? <Lock size={14} className="mr-1.5" /> : <FileSpreadsheet size={14} className="mr-1.5" />}
                            Excel {isFreePlan && "(Pro)"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={isFreePlan ? handleLockedLedgerClick : () => sharePaymentLedger(sale, paymentItems, tenant)}
                            className="bg-white dark:bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Share Ledger"
                        >
                            {isFreePlan ? <Lock size={14} className="mr-1.5" /> : <Share2 size={14} className="mr-1.5" />}
                            Share {isFreePlan && "(Pro)"}
                        </Button>
                    </div>
                    {canEdit && (
                        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                            <Plus size={16} className="mr-1" /> Record Payment
                        </Button>
                    )}
                </div>

                {showAddForm && (
                    <form onSubmit={handleAddPayment} className="p-4 bg-gray-50 rounded-lg border space-y-4">
                        <h4 className="font-bold text-sm">New Payment Entry</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500">Date</label>
                                <Input type="date" value={paymentData.paymentDate} onChange={e => setPaymentData({...paymentData, paymentDate: e.target.value})} required />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Amount (₹)</label>
                                <Input type="number" step="0.01" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} required placeholder="0.00" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Payment Type</label>
                                <Select value={paymentData.paymentType} onChange={e => setPaymentData({...paymentData, paymentType: e.target.value})}>
                                    <option value="booking_amount">Booking Amount</option>
                                    <option value="installment">Installment</option>
                                    <option value="part_payment">Part Payment</option>
                                    <option value="registry_charge">Registry Charge</option>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Mode</label>
                                <Select value={paymentData.paymentMode} onChange={e => setPaymentData({...paymentData, paymentMode: e.target.value})}>
                                    <option value="cheque">Cheque</option>
                                    <option value="neft_rtgs">NEFT/RTGS</option>
                                    <option value="upi">UPI</option>
                                    <option value="cash">Cash</option>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Reference / Cheque No.</label>
                            <Input value={paymentData.transactionReference} onChange={e => setPaymentData({...paymentData, transactionReference: e.target.value})} placeholder="UTR / Cheque No" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Remarks</label>
                            <Input value={paymentData.remarks} onChange={e => setPaymentData({...paymentData, remarks: e.target.value})} placeholder="Optional remarks" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddForm(false)}>Cancel</Button>
                            <Button size="sm" type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Payment"}</Button>
                        </div>
                    </form>
                )}

                {/* History Table */}
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Type</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                                <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paymentItems.map(p => (
                                <tr key={p._id || p.id}>
                                    <td className="px-4 py-2">{p.payment_date}</td>
                                    <td className="px-4 py-2 capitalize">{p.payment_type}</td>
                                    <td className="px-4 py-2 text-right font-bold">{formatCurrency(p.amount)}</td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => exportPaymentReceiptPDF(p, sale, tenant)}
                                                className="p-1 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                                title="Download Payment Receipt (PDF)"
                                            >
                                                <Receipt size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => sharePaymentReceiptWhatsApp(p, sale, tenant)}
                                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                                title="Share Receipt on WhatsApp"
                                            >
                                                <MessageSquare size={15} />
                                            </button>
                                            {canEdit && (
                                                <button 
                                                    onClick={async () => {
                                                        if (await dialog.confirm("Are you sure you want to delete this payment record?")) {
                                                             await deletePayment({ id: p._id || p.id });
                                                            toast.success("Payment record deleted successfully");
                                                        }
                                                    }} 
                                                    className="text-red-500 hover:text-red-700 ml-1 p-1 rounded hover:bg-red-50"
                                                    title="Delete Payment"
                                                >
                                                    <X size={14}/>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ModalFooter><Button variant="outline" onClick={onClose}>Close</Button></ModalFooter>

            <UpgradeToProModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Payment Ledger PDF & Excel Export"
                description="Downloading and sharing branded payment ledgers and customer statements is available on the Pro Plan. Upgrade now to unlock."
            />
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
