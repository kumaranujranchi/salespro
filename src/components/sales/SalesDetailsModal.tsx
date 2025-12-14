import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { supabase } from '../../lib/supabase';
import { Sale, Payment } from '../../types/database';
import { Modal } from '../ui/Modal';
import { format } from 'date-fns';
import { User, MapPin, DollarSign, Calendar, CreditCard, Ban, Pencil, Trash2, FileText, FileSpreadsheet, Share2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { exportPaymentLedgerPDF, exportPaymentLedgerExcel, sharePaymentLedger } from '../../utils/export';

interface SalesDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
    onCancel?: (sale: Sale) => void;
    onEdit?: (sale: Sale) => void;
    onDelete?: (sale: Sale) => void;
    canEdit?: boolean;
}

export function SalesDetailsModal({ isOpen, onClose, sale, onCancel, onEdit, onDelete, canEdit }: SalesDetailsModalProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const { profile } = useAuth();
    
    // Check if user is admin/super_admin for Excel export
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

    useEffect(() => {
        if (isOpen && sale) {
            loadPayments(sale.id);
        } else {
            setPayments([]);
        }
    }, [isOpen, sale]);

    const loadPayments = async (saleId: string) => {
        setLoadingPayments(true);
        const { data } = await supabase
            .from('payments')
            .select('*')
            .eq('sale_id', saleId)
            .order('payment_date', { ascending: false });

        if (data) setPayments(data as Payment[]);
        setLoadingPayments(false);
    };

    if (!sale) return null;



    // Helper to safely format date
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'dd MMM yyyy');
        } catch {
            return dateString;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sales Record Details" size="xl">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">

                {/* 1. Header Info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-blue-50 dark:bg-white/5 p-4 rounded-xl border border-blue-100 dark:border-white/10 relative">
                    <div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-1">Total Revenue</div>
                        <div className="text-3xl font-bold text-[#0A1C37] dark:text-white">{formatCurrency(sale.total_revenue)}</div>
                    </div>

                    <div className="mt-2 md:mt-0 flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
                        <div className="flex flex-wrap gap-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${sale.is_agreement_done ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                                Agreement: {sale.is_agreement_done ? 'Done' : 'Pending'}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${sale.is_registry_done ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                                Registry: {sale.is_registry_done ? 'Done' : 'Pending'}
                            </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
                            {/* Edit/Action Buttons - Only for Admin/Authorized */}
                            {canEdit && sale.metadata?.booking_status !== 'cancelled' && (
                                <>
                                    {onEdit && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                onEdit(sale);
                                                onClose();
                                            }}
                                            className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex-1 md:flex-none justify-center"
                                        >
                                            <Pencil size={14} className="mr-1.5" /> Edit
                                        </Button>
                                    )}
                                    {onCancel && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                onCancel(sale);
                                                onClose();
                                            }}
                                            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 flex-1 md:flex-none justify-center"
                                        >
                                            <Ban size={14} className="mr-1.5" /> Cancel
                                        </Button>
                                    )}
                                    {onDelete && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this sales record? This will also delete all associated payments.')) {
                                                    onDelete(sale);
                                                    onClose();
                                                }
                                            }}
                                            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 flex-1 md:flex-none justify-center"
                                            title="Delete Record"
                                        >
                                            <Trash2 size={14} className="mr-1.5" /> Delete
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* 2. Customer Details */}
                    <div className="space-y-3">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white border-b dark:border-white/10 pb-2">
                            <User size={18} className="text-blue-500" /> Customer Information
                        </h3>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <div className="text-gray-500 dark:text-gray-400">Name:</div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{(sale as any).customer?.name || 'N/A'}</div>

                            <div className="text-gray-500 dark:text-gray-400">Phone:</div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{(sale as any).customer?.phone || 'N/A'}</div>

                            <div className="text-gray-500 dark:text-gray-400">Email:</div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{(sale as any).customer?.email || 'N/A'}</div>

                            <div className="text-gray-500 dark:text-gray-400">Address:</div>
                            <div className="font-medium text-gray-900 dark:text-gray-200 col-span-2 md:col-span-1 truncate" title={(sale as any).customer?.address}>{(sale as any).customer?.address || 'N/A'}</div>
                        </div>
                    </div>

                    {/* 3. Property Details */}
                    <div className="space-y-3">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white border-b dark:border-white/10 pb-2">
                            <MapPin size={18} className="text-orange-500" /> Property Details
                        </h3>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <div className="text-gray-500 dark:text-gray-400">Project:</div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{(sale as any).project?.name || 'N/A'}</div>

                            <div className="text-gray-500 dark:text-gray-400">Unit / Plot:</div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{sale.unit_number || 'N/A'}</div>

                            <div className="text-gray-500 dark:text-gray-400">Area:</div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{sale.area_sqft} Sq. Ft.</div>

                            <div className="text-gray-500 dark:text-gray-400">Rate:</div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(sale.rate_per_sqft)} / Sq. Ft.</div>
                        </div>
                    </div>
                </div>

                {/* 4. Financial Breakdown */}
                <div className="space-y-3">
                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white border-b dark:border-white/10 pb-2">
                        <DollarSign size={18} className="text-green-500" /> Financial Breakdown
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg border dark:border-white/10">
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Base Price</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-200">{formatCurrency(sale.base_price)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">PLC</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-200">{formatCurrency(sale.plc)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Dev Charges</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-200">{formatCurrency(sale.dev_charges)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Discount</div>
                            <div className="font-semibold text-red-600 dark:text-red-400">-{formatCurrency(sale.discount)}</div>
                        </div>
                    </div>
                </div>

                {/* 5. Important Dates */}
                <div className="space-y-3">
                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white border-b dark:border-white/10 pb-2">
                        <Calendar size={18} className="text-purple-500" /> Important Dates
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-gray-500 dark:text-gray-400">Booking Date</div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{formatDate(sale.sale_date)}</div>
                        </div>
                        <div>
                            <div className="text-gray-500 dark:text-gray-400">Agreement Date</div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{formatDate(sale.agreement_date)}</div>
                        </div>
                        <div>
                            <div className="text-gray-500 dark:text-gray-400">Registry Date</div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{formatDate(sale.registry_date)}</div>
                        </div>
                    </div>
                </div>

                {/* 6. Payment Progress Bar */}
                <div className="space-y-3">
                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white border-b dark:border-white/10 pb-2">
                        <DollarSign size={18} className="text-emerald-500" /> Payment Progress
                    </h3>
                    {(() => {
                        const totalRevenue = sale.total_revenue || 0;
                        const totalReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                        const percent = totalRevenue > 0 ? Math.min(100, (totalReceived / totalRevenue) * 100) : 0;
                        const pending = Math.max(0, totalRevenue - totalReceived);

                        return (
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Total Received</div>
                                        <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalReceived)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{percent.toFixed(1)}%</div>
                                    </div>
                                </div>

                                {/* Progress Bar Track */}
                                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    {/* Progress Bar Fill */}
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>

                                <div className="flex justify-between mt-2 text-sm">
                                    <div className="text-gray-500 dark:text-gray-400">
                                        Target: <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(totalRevenue)}</span>
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400">
                                        Pending: <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(pending)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* 7. Payment History */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center border-b dark:border-white/10 pb-2">
                         <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                            <CreditCard size={18} className="text-indigo-500" /> Payment History
                        </h3>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportPaymentLedgerPDF(sale, payments)}
                                className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                                title="Download PDF"
                            >
                                <FileText size={14} className="mr-1.5" /> Ledger
                            </Button>
                            {isAdmin && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportPaymentLedgerExcel(sale, payments)}
                                    className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                    title="Download Excel"
                                >
                                    <FileSpreadsheet size={14} className="mr-1.5" /> Excel
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sharePaymentLedger(sale, payments)}
                                className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                title="Share Ledger"
                            >
                                <Share2 size={14} className="mr-1.5" /> Share
                            </Button>
                        </div>
                    </div>

                    {loadingPayments ? (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading payments...</div>
                    ) : payments.length > 0 ? (
                        <div className="overflow-x-auto border border-gray-200 dark:border-white/10 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-400 font-medium">
                                    <tr>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Type</th>
                                        <th className="px-4 py-2">Mode</th>
                                        <th className="px-4 py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                    {payments.map((p) => (
                                        <tr key={p.id}>
                                            <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{formatDate(p.payment_date)}</td>
                                            <td className="px-4 py-2 capitalize text-gray-700 dark:text-gray-300">{p.payment_type?.replace('_', ' ')}</td>
                                            <td className="px-4 py-2 capitalize text-gray-700 dark:text-gray-300">{p.payment_mode?.replace('_', ' ')}</td>
                                            <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(p.amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 dark:bg-black/20 font-bold">
                                        <td className="px-4 py-2 text-gray-900 dark:text-gray-200" colSpan={3}>Total Received</td>
                                        <td className="px-4 py-2 text-right text-green-700 dark:text-green-400">
                                            {formatCurrency(payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0))}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-400 dark:text-gray-500">
                            No payments recorded yet.
                        </div>
                    )}
                </div>

            </div>
        </Modal>
    );
}
