import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { useQuery } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Modal } from '../ui/Modal';
import { format, parseISO } from 'date-fns';
import { User, MapPin, DollarSign, Calendar, CreditCard, Ban, Pencil, Trash2, FileText, FileSpreadsheet, Share2, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
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
    const toast = useToast();
    const isFreePlan = tenant?.plan_tier === 'free';
    
    // Convex Queries
    const payments = useQuery(api.payments.listPayments, (isOpen && sale && profile?.tenant_id) ? {
        tenant_id: profile.tenant_id as Id<"tenants">,
        sale_id: sale?._id as Id<"sales">
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

                {/* Additional Customer Information */}
                <div className="grid grid-cols-2 gap-8 border-t pt-6">
                    {/* Primary Applicant Profile */}
                    <section className="space-y-3">
                        <h4 className="font-bold flex items-center gap-2 border-b pb-2 text-slate-800 dark:text-slate-200">
                            <User size={18}/> Applicant Profile
                        </h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Customer ID:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.customer?.lead_id || 'System Generated'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Father/Husband:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.father_husband_name || 'N/A'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">DOB:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{formatDate(sale.dob) || 'N/A'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Gender:</span> <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">{sale.gender || 'N/A'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Alt Mobile:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.alternate_mobile || 'N/A'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Email ID:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.customer?.email || 'N/A'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">PAN Number:</span> <span className="font-semibold uppercase text-gray-800 dark:text-gray-200">{sale.pan_number || 'N/A'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Aadhaar No:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.aadhaar_number || 'N/A'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Occupation:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.occupation || 'N/A'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Company Name:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.company_name || 'N/A'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Annual Income:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.annual_income || 'N/A'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Marital Status:</span> <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">{sale.marital_status || 'N/A'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Nationality:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.nationality || 'Indian'}</span></p>
                            <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Passport (NRI):</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.passport || 'N/A'}</span></p>
                        </div>
                    </section>

                    {/* Co-Applicant & Addresses */}
                    <div className="space-y-6">
                        {/* Co-Applicant Details */}
                        <section className="space-y-3">
                            <h4 className="font-bold flex items-center gap-2 border-b pb-2 text-slate-800 dark:text-slate-200">
                                <User size={18}/> Co-Applicant Details
                            </h4>
                            {sale.co_applicant_name ? (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Name:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.co_applicant_name}</span></p>
                                    <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Relation:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.co_applicant_relation || 'N/A'}</span></p>
                                    <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Mobile:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.co_applicant_mobile || 'N/A'}</span></p>
                                    <p className="flex justify-between border-b pb-1"><span className="text-gray-500 font-medium">Aadhaar:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.co_applicant_aadhaar || 'N/A'}</span></p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No co-applicant details provided.</p>
                            )}
                        </section>

                        {/* Addresses */}
                        <section className="space-y-3">
                            <h4 className="font-bold flex items-center gap-2 border-b pb-2 text-slate-800 dark:text-slate-200">
                                <MapPin size={18}/> Addresses
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Current Address</p>
                                    {sale.address_house_no || sale.address_street || sale.address_city ? (
                                        <div className="text-gray-800 dark:text-gray-200 mt-1">
                                            <p>{sale.address_house_no} {sale.address_street}</p>
                                            <p>{sale.address_city}, {sale.address_state} - {sale.address_pin_code}</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic text-xs mt-1">Not provided</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Permanent Address</p>
                                    {sale.address_same_as_current ? (
                                        <p className="text-gray-500 italic mt-1">Same as Current Address</p>
                                    ) : sale.perm_address_house_no || sale.perm_address_street || sale.perm_address_city ? (
                                        <div className="text-gray-800 dark:text-gray-200 mt-1">
                                            <p>{sale.perm_address_house_no} {sale.perm_address_street}</p>
                                            <p>{sale.perm_address_city}, {sale.perm_address_state} - {sale.perm_address_pin_code}</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic text-xs mt-1">Not provided</p>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Payment Ledger Actions */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Payment Ledger</h4>
                        <p className="text-xs text-gray-500">Download or share the complete statement of accounts.</p>
                    </div>
                    <div className="flex gap-2.5">
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
                </div>

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
