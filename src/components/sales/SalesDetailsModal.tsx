import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Modal } from '../ui/Modal';
import { format, parseISO } from 'date-fns';
import { User, MapPin, DollarSign, Calendar, CreditCard, Ban, Pencil, Trash2, FileText, FileSpreadsheet, Share2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { exportPaymentLedgerPDF, exportPaymentLedgerExcel, sharePaymentLedger } from '../../utils/export';

interface SalesDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any | null;
    onCancel?: (sale: any) => void;
    onEdit?: (sale: any) => void;
    onDelete?: (sale: any) => void;
    canEdit?: boolean;
}

export function SalesDetailsModal({ isOpen, onClose, sale, onCancel, onEdit, onDelete, canEdit }: SalesDetailsModalProps) {
    const { profile, tenant } = useAuth();
    
    // Convex Queries
    const payments = useQuery(api.payments.listPayments, (isOpen && sale && profile?.tenant_id) ? {
        tenant_id: profile.tenant_id as Id<"tenants">,
        sale_id: sale._id as Id<"sales">
    } : "skip");

    if (!sale) return null;

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'dd MMM yyyy');
        } catch {
            return dateString;
        }
    };

    const totalReceived = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const pendingBalance = sale.total_revenue - totalReceived;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sale Details" size="xl">
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border">
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Total Revenue</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(sale.total_revenue)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Received</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Balance</p>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(pendingBalance)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    {/* Customer Info */}
                    <section className="space-y-3">
                        <h4 className="font-bold flex items-center gap-2 border-b pb-2"><User size={18}/> Customer</h4>
                        <div className="space-y-1 text-sm">
                            <p><span className="text-gray-500">Name:</span> {sale.customer?.name}</p>
                            <p><span className="text-gray-500">Phone:</span> {sale.customer?.phone}</p>
                            <p><span className="text-gray-500">Date:</span> {formatDate(sale.sale_date)}</p>
                        </div>
                    </section>

                    {/* Project Info */}
                    <section className="space-y-3">
                        <h4 className="font-bold flex items-center gap-2 border-b pb-2"><MapPin size={18}/> Property</h4>
                        <div className="space-y-1 text-sm">
                            <p><span className="text-gray-500">Project:</span> {sale.project?.name}</p>
                            <p><span className="text-gray-500">Unit:</span> {sale.unit_number}</p>
                            <p><span className="text-gray-500">Area:</span> {sale.area_sqft} Sq Ft</p>
                        </div>
                    </section>
                </div>

                {/* Legal Status */}
                <section className="space-y-3">
                    <h4 className="font-bold flex items-center gap-2 border-b pb-2"><FileText size={18}/> Status</h4>
                    <div className="flex gap-4">
                        <StatusBadge label="Agreement" done={sale.is_agreement_done} date={sale.agreement_date} />
                        <StatusBadge label="Registry" done={sale.is_registry_done} date={sale.registry_date} />
                    </div>
                </section>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    {canEdit && (
                        <>
                            <Button variant="outline" onClick={() => onEdit?.(sale)}><Pencil size={16} className="mr-2"/> Edit</Button>
                            <Button variant="outline" className="text-red-600" onClick={() => onCancel?.(sale)}><Ban size={16} className="mr-2"/> Cancel Sale</Button>
                        </>
                    )}
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
}

function StatusBadge({ label, done, date }: any) {
    return (
        <div className={`flex-1 p-3 rounded-lg border ${done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-xs font-bold uppercase text-gray-400">{label}</p>
            <p className={`font-bold ${done ? 'text-green-700' : 'text-gray-400'}`}>{done ? 'COMPLETED' : 'PENDING'}</p>
            {done && date && <p className="text-[10px] text-green-600">{date}</p>}
        </div>
    );
}
