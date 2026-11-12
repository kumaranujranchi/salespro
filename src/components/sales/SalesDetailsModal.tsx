import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { formatCurrency } from '../../utils/format';
import { useQuery } from "../../lib/reactive";
import { api, Id } from '../../lib/api-endpoints';
import { Modal } from '../ui/Modal';
import { format, parseISO } from 'date-fns';
import { User, MapPin, DollarSign, Calendar, CreditCard, Ban, Pencil, Trash2, FileText, FileSpreadsheet, Share2, Lock, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { UpgradeToProModal } from '../ui/UpgradeToProModal';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { exportPaymentLedgerPDF, exportPaymentLedgerExcel, sharePaymentLedger, sharePaymentReceiptWhatsApp } from '../../utils/export';

interface SalesDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any | null;
    onCancel?: (sale: any) => void;
    onEdit?: (sale: any) => void;
    onDelete?: (sale: any) => void;
    canEdit?: boolean;
}

// Internal fallback boundary to prevent modal crashes from taking down the parent page
class ModalErrorBoundary extends Component<{ children: ReactNode; onClose: () => void }, { hasError: boolean; error: Error | null }> {
    state = { hasError: false, error: null };
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Safe Modal Error caught:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Unable to display sale details</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">Some information in this record contains an unexpected format. The team has been notified.</p>
                    <Button onClick={this.props.onClose} variant="outline" size="sm">Close Window</Button>
                </div>
            );
        }
        return this.props.children;
    }
}

export function SalesDetailsModal(props: SalesDetailsModalProps) {
    if (!props.isOpen) return null;
    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} title="Sale Details" size="xl">
            <ModalErrorBoundary onClose={props.onClose}>
                <SalesDetailsContent {...props} />
            </ModalErrorBoundary>
        </Modal>
    );
}

function SalesDetailsContent({ onClose, sale, onCancel, onEdit, onDelete, canEdit }: SalesDetailsModalProps) {
    const { profile, tenant } = useAuth();
    const isFreePlan = tenant?.plan_tier === 'free';
    const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
    const isSuperAdmin = normalizedRole === 'super_admin' || normalizedRole === 'platform_admin' || profile?.role === 'super_admin' || profile?.role === 'platform_admin';
    const [activeTab, setActiveTab] = useState<'profile' | 'coapplicant_address'>('profile');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const handleLockedLedgerClick = () => {
        if (isSuperAdmin) {
            setShowUpgradeModal(true);
        } else {
            toast.info("Downloading payment ledger is a Pro feature. Please contact your organization administrator to upgrade the plan.");
        }
    };

    // Backend queries - safely query only if tenant_id and sale ID are present
    const saleId = sale?._id || sale?.id;
    const payments = useQuery(
        api.payments.listPayments,
        (sale && profile?.tenant_id && saleId) ? {
            tenant_id: profile.tenant_id as Id<"tenants">,
            sale_id: saleId as Id<"sales">
        } : "skip"
    );

    if (!sale) return null;

    // Bulletproof Date Formatter - NEVER returns a raw Date object or throws
    const formatDate = (dateVal: any): string => {
        if (!dateVal) return 'N/A';
        try {
            if (dateVal instanceof Date) {
                if (isNaN(dateVal.getTime())) return 'N/A';
                return format(dateVal, 'dd MMM yyyy');
            }
            if (typeof dateVal === 'number') {
                const d = new Date(dateVal);
                if (isNaN(d.getTime())) return 'N/A';
                return format(d, 'dd MMM yyyy');
            }
            if (typeof dateVal === 'string') {
                const trimmed = dateVal.trim();
                if (!trimmed) return 'N/A';
                const parsed = parseISO(trimmed);
                if (!isNaN(parsed.getTime())) {
                    return format(parsed, 'dd MMM yyyy');
                }
                const fallback = new Date(trimmed);
                if (!isNaN(fallback.getTime())) {
                    return format(fallback, 'dd MMM yyyy');
                }
                return trimmed;
            }
            return String(dateVal);
        } catch {
            return typeof dateVal === 'string' ? dateVal : 'N/A';
        }
    };

    // Safe payments calculation - strictly ensure array and numeric operations
    const paymentItems = Array.isArray(payments) ? payments : [];
    const totalReceived = paymentItems.reduce((sum: number, p: any) => sum + (Number(p?.amount) || 0), 0);
    const saleRevenue = Number(sale.total_revenue) || 0;
    const pendingBalance = Math.max(0, saleRevenue - totalReceived);

    // Safe customer and property details
    const customerName = (typeof sale.customer === 'object' && sale.customer?.name) 
        ? sale.customer.name 
        : (sale.customer_name || sale.customer || 'Customer');
    const customerPhone = (typeof sale.customer === 'object' && sale.customer?.phone)
        ? sale.customer.phone
        : (sale.customer_phone || sale.lead_mobile || 'N/A');
    const customerEmail = (typeof sale.customer === 'object' && sale.customer?.email)
        ? sale.customer.email
        : (sale.customer_email || sale.lead_email || 'N/A');
    const customerCode = (typeof sale.customer === 'object' && sale.customer?.lead_id)
        ? sale.customer.lead_id
        : (sale.lead_code || 'System Generated');

    const projectName = (typeof sale.project === 'object' && sale.project?.name)
        ? sale.project.name
        : (sale.project_name || sale.project || 'General Project');
    const unitNumber = sale.unit_number || 'N/A';
    const areaSqft = sale.area_sqft || 0;

    return (
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border dark:border-white/10">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(saleRevenue)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Received</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalReceived)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Balance</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(pendingBalance)}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* Customer Info */}
                <section className="space-y-3">
                    <h4 className="font-bold flex items-center gap-2 border-b dark:border-white/10 pb-2 text-gray-900 dark:text-white">
                        <User size={18} className="text-blue-500" /> Customer
                    </h4>
                    <div className="space-y-1 text-sm">
                        <p><span className="text-gray-500">Name:</span> <strong className="text-gray-800 dark:text-gray-200">{customerName}</strong></p>
                        <p><span className="text-gray-500">Phone:</span> <strong className="text-gray-800 dark:text-gray-200">{customerPhone}</strong></p>
                        <p><span className="text-gray-500">Date:</span> <span className="text-gray-800 dark:text-gray-200">{formatDate(sale.sale_date)}</span></p>
                    </div>
                </section>

                {/* Project Info */}
                <section className="space-y-3">
                    <h4 className="font-bold flex items-center gap-2 border-b dark:border-white/10 pb-2 text-gray-900 dark:text-white">
                        <MapPin size={18} className="text-emerald-500" /> Property
                    </h4>
                    <div className="space-y-1 text-sm">
                        <p><span className="text-gray-500">Project:</span> <strong className="text-gray-800 dark:text-gray-200">{projectName}</strong></p>
                        <p><span className="text-gray-500">Unit:</span> <span className="text-gray-800 dark:text-gray-200">{unitNumber}</span></p>
                        <p><span className="text-gray-500">Area:</span> <span className="text-gray-800 dark:text-gray-200">{areaSqft} Sq Ft</span></p>
                    </div>
                </section>
            </div>

            {/* Legal Status */}
            <section className="space-y-3">
                <h4 className="font-bold flex items-center gap-2 border-b dark:border-white/10 pb-2 text-gray-900 dark:text-white">
                    <FileText size={18} className="text-indigo-500" /> Status
                </h4>
                <div className="flex gap-4">
                    <StatusBadge label="Agreement" done={sale.is_agreement_done} date={sale.agreement_date} />
                    <StatusBadge label="Registry" done={sale.is_registry_done} date={sale.registry_date} />
                </div>
            </section>

            {/* Tabs Navigation for Details */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 pt-2 rounded-t-lg border-t mt-4">
                <button
                    type="button"
                    className={`pb-2.5 px-5 font-semibold text-sm border-b-2 transition-all ${
                        activeTab === 'profile'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-bold'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                    onClick={() => setActiveTab('profile')}
                >
                    Applicant Profile
                </button>
                <button
                    type="button"
                    className={`pb-2.5 px-5 font-semibold text-sm border-b-2 transition-all ${
                        activeTab === 'coapplicant_address'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-bold'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                    onClick={() => setActiveTab('coapplicant_address')}
                >
                    Co-Applicant & Addresses
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
                <div className="bg-slate-50/50 dark:bg-slate-900/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Customer ID:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{customerCode}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Father/Husband:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.father_husband_name || 'N/A'}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Date of Birth:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{formatDate(sale.dob)}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Gender:</span> <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">{sale.gender || 'N/A'}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Alt Mobile:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.alternate_mobile || 'N/A'}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Email ID:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{customerEmail}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">PAN Number:</span> <span className="font-semibold uppercase text-gray-800 dark:text-gray-200">{sale.pan_number || 'N/A'}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Aadhaar No:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.aadhaar_number || 'N/A'}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Occupation:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.occupation || 'N/A'}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Company Name:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.company_name || 'N/A'}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Annual Income:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.annual_income || 'N/A'}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Marital Status:</span> <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">{sale.marital_status || 'N/A'}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Nationality:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.nationality || 'Indian'}</span></p>
                        <p className="flex justify-between border-b dark:border-white/5 pb-1.5"><span className="text-gray-500 font-medium">Passport (NRI):</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.passport || 'N/A'}</span></p>
                    </div>
                </div>
            )}

            {activeTab === 'coapplicant_address' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Current Address Card */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-3">
                        <h4 className="font-bold flex items-center gap-2 border-b dark:border-white/10 pb-2 text-slate-800 dark:text-slate-200">
                            <MapPin size={18} className="text-blue-500" /> Current Address
                        </h4>
                        {sale.address_house_no || sale.address_street || sale.address_city ? (
                            <div className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
                                <p className="font-semibold">{sale.address_house_no} {sale.address_street}</p>
                                <p className="text-gray-600 dark:text-gray-400">{sale.address_city}, {sale.address_state} - {sale.address_pin_code}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">Not provided</p>
                        )}
                    </div>

                    {/* Permanent Address Card */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-3">
                        <h4 className="font-bold flex items-center gap-2 border-b dark:border-white/10 pb-2 text-slate-800 dark:text-slate-200">
                            <MapPin size={18} className="text-green-500" /> Permanent Address
                        </h4>
                        {sale.address_same_as_current ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">Same as Current Address</p>
                        ) : sale.perm_address_house_no || sale.perm_address_street || sale.perm_address_city ? (
                            <div className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
                                <p className="font-semibold">{sale.perm_address_house_no} {sale.perm_address_street}</p>
                                <p className="text-gray-600 dark:text-gray-400">{sale.perm_address_city}, {sale.perm_address_state} - {sale.perm_address_pin_code}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">Not provided</p>
                        )}
                    </div>

                    {/* Co-Applicant Details Card */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-3">
                        <h4 className="font-bold flex items-center gap-2 border-b dark:border-white/10 pb-2 text-slate-800 dark:text-slate-200">
                            <User size={18} className="text-indigo-500" /> Co-Applicant Details
                        </h4>
                        {sale.co_applicant_name ? (
                            <div className="text-sm text-gray-800 dark:text-gray-200 space-y-2">
                                <p className="flex justify-between border-b dark:border-white/5 pb-1"><span className="text-gray-500">Name:</span> <span className="font-semibold">{sale.co_applicant_name}</span></p>
                                <p className="flex justify-between border-b dark:border-white/5 pb-1"><span className="text-gray-500">Relation:</span> <span className="font-semibold">{sale.co_applicant_relation || 'N/A'}</span></p>
                                <p className="flex justify-between border-b dark:border-white/5 pb-1"><span className="text-gray-500">Mobile:</span> <span className="font-semibold">{sale.co_applicant_mobile || 'N/A'}</span></p>
                                <p className="flex justify-between border-b dark:border-white/5 pb-1"><span className="text-gray-500">Aadhaar:</span> <span className="font-semibold">{sale.co_applicant_aadhaar || 'N/A'}</span></p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No co-applicant details provided.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Ledger Actions */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Payment Ledger</h4>
                    <p className="text-xs text-gray-500">Download or share the complete statement of accounts.</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
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
                    {paymentItems.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sharePaymentReceiptWhatsApp(paymentItems[paymentItems.length - 1], sale, tenant)}
                            className="bg-white dark:bg-transparent text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Share Latest Payment Receipt on WhatsApp"
                        >
                            <MessageSquare size={14} className="mr-1.5" />
                            WhatsApp Receipt
                        </Button>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-white/10">
                {canEdit && (
                    <>
                        <Button variant="outline" onClick={() => onEdit?.(sale)}><Pencil size={16} className="mr-2"/> Edit</Button>
                        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => onCancel?.(sale)}><Ban size={16} className="mr-2"/> Cancel Sale</Button>
                    </>
                )}
                <Button onClick={onClose}>Close</Button>
            </div>

            <UpgradeToProModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Payment Ledger PDF & Excel Export"
                description="Downloading and sharing branded payment ledgers and customer statements is available on the Pro Plan. Upgrade now to unlock."
            />
        </div>
    );
}

function StatusBadge({ label, done, date }: { label: string; done?: boolean; date?: any }) {
    let displayDate: string | null = null;
    if (date) {
        if (date instanceof Date) {
            displayDate = isNaN(date.getTime()) ? null : format(date, 'dd/MM/yyyy');
        } else if (typeof date === 'string') {
            displayDate = date;
        } else if (typeof date === 'number') {
            displayDate = format(new Date(date), 'dd/MM/yyyy');
        } else {
            displayDate = String(date);
        }
    }
    return (
        <div className={`flex-1 p-3 rounded-lg border ${done ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/40' : 'bg-gray-50 border-gray-200 dark:bg-white/5 dark:border-white/10'}`}>
            <p className="text-xs font-bold uppercase text-gray-400">{label}</p>
            <p className={`font-bold ${done ? 'text-green-700 dark:text-green-400' : 'text-gray-400'}`}>{done ? 'COMPLETED' : 'PENDING'}</p>
            {done && displayDate && <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">{displayDate}</p>}
        </div>
    );
}
