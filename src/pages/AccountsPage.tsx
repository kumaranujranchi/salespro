import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from '../lib/reactive';
import { api } from '../lib/api-endpoints';
import { formatCurrency } from '../utils/format';
import {
  exportPaymentLedgerPDF,
  exportPaymentLedgerExcel,
  sharePaymentLedger,
  exportPaymentReceiptPDF,
  sharePaymentReceiptWhatsApp,
  exportCollectionsExcel
} from '../utils/export';
import {
  CreditCard,
  Plus,
  Download,
  Search,
  Filter,
  FileText,
  MessageSquare,
  Receipt,
  Trash2,
  TrendingUp,
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Send,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { toast } from 'sonner';
import { useDialog } from '../contexts/DialogContext';

export function AccountsPage() {
  const { profile, tenant } = useAuth();
  const dialog = useDialog();

  const [activeTab, setActiveTab] = useState<'collections' | 'transactions' | 'analytics'>('collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [dueRangeFilter, setDueRangeFilter] = useState<'all' | 'high' | 'very_high'>('all');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<any | null>(null);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedSaleForLedger, setSelectedSaleForLedger] = useState<any | null>(null);

  // Form State for Recording Payment
  const [paymentForm, setPaymentForm] = useState({
    sale_id: '',
    payment_date: new Date().toISOString().slice(0, 10),
    amount: '',
    payment_type: 'installment',
    payment_mode: 'upi',
    transaction_reference: '',
    remarks: '',
    send_whatsapp_receipt: true
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Queries
  const sales = useQuery(api.sales.getSales, tenant?._id ? { tenant_id: tenant._id } : "skip") as any[];
  const payments = useQuery(api.payments.listPayments, tenant?._id ? { tenant_id: tenant._id } : "skip") as any[];
  const projects = useQuery(api.projects.listAllProjects, tenant?._id ? { tenant_id: tenant._id } : "skip") as any[];

  // Mutations
  const addPaymentMutation = useMutation(api.payments.addPayment);
  const deletePaymentMutation = useMutation(api.payments.deletePayment);

  // Calculate Map of Total Received per Sale
  const saleReceivedMap = useMemo(() => {
    const map = new Map<string, number>();
    if (payments && Array.isArray(payments)) {
      payments.forEach((p: any) => {
        const sId = String(p.sale_id);
        const current = map.get(sId) || 0;
        map.set(sId, current + (Number(p.amount) || 0));
      });
    }
    return map;
  }, [payments]);

  // Outstanding Collections List
  const collectionsList = useMemo(() => {
    if (!sales || !Array.isArray(sales)) return [];

    return sales.map((sale: any) => {
      const sId = String(sale.id || sale._id);
      const totalRevenue = Number(sale.total_revenue) || 0;
      const totalReceived = saleReceivedMap.get(sId) || 0;
      const balanceDue = Math.max(0, totalRevenue - totalReceived);

      // Find last payment date
      const salePayments = (payments || []).filter((p: any) => String(p.sale_id) === sId);
      const lastPayment = salePayments.sort(
        (a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      )[0];

      return {
        ...sale,
        sId,
        customerName: sale.customer?.name || sale.lead_customer_name || 'Customer',
        customerPhone: sale.customer?.phone || sale.lead_mobile || 'N/A',
        projectName: sale.project?.name || sale.project_name || 'N/A',
        unitNumber: sale.unit_number || 'N/A',
        saleDate: sale.sale_date,
        totalRevenue,
        totalReceived,
        balanceDue,
        lastPaymentDate: lastPayment ? lastPayment.payment_date : undefined,
        executiveName: sale.executive_name || sale.sales_executive_name || 'Unassigned',
        paymentsCount: salePayments.length
      };
    });
  }, [sales, saleReceivedMap, payments]);

  // Overall Financial Metrics
  const metrics = useMemo(() => {
    const totalConsideration = collectionsList.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const totalCollected = collectionsList.reduce((acc, curr) => acc + curr.totalReceived, 0);
    const totalOutstanding = Math.max(0, totalConsideration - totalCollected);
    const collectionEfficiency = totalConsideration > 0 ? (totalCollected / totalConsideration) * 100 : 0;
    const pendingCount = collectionsList.filter(c => c.balanceDue > 0).length;

    return {
      totalConsideration,
      totalCollected,
      totalOutstanding,
      collectionEfficiency,
      pendingCount
    };
  }, [collectionsList]);

  // Filtered Collections
  const filteredCollections = useMemo(() => {
    return collectionsList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.customerName.toLowerCase().includes(q) ||
        item.customerPhone.includes(q) ||
        item.unitNumber.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q);

      const matchProject = projectFilter === 'all' || item.project_id === projectFilter;

      let matchDue = true;
      if (dueRangeFilter === 'high') {
        matchDue = item.balanceDue >= 500000; // >= 5 Lakhs
      } else if (dueRangeFilter === 'very_high') {
        matchDue = item.balanceDue >= 2500000; // >= 25 Lakhs
      }

      return matchSearch && matchProject && matchDue;
    });
  }, [collectionsList, searchQuery, projectFilter, dueRangeFilter]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    if (!payments || !Array.isArray(payments)) return [];

    return payments.filter((p: any) => {
      const q = searchQuery.toLowerCase().trim();
      const sale = sales?.find(s => String(s.id || s._id) === String(p.sale_id));
      const customerName = (sale?.customer?.name || sale?.lead_customer_name || '').toLowerCase();
      const unitNo = (sale?.unit_number || '').toLowerCase();
      const ref = (p.transaction_reference || '').toLowerCase();

      const matchSearch =
        !q || customerName.includes(q) || unitNo.includes(q) || ref.includes(q) || String(p.amount).includes(q);

      const matchMode = modeFilter === 'all' || p.payment_mode === modeFilter;

      return matchSearch && matchMode;
    });
  }, [payments, sales, searchQuery, modeFilter]);

  // Quick Open Payment Form for Specific Customer
  const openRecordModalForSale = (saleItem: any) => {
    setSelectedSaleForPayment(saleItem);
    setPaymentForm(prev => ({
      ...prev,
      sale_id: saleItem.sId || String(saleItem.id || saleItem._id),
      amount: '',
      payment_type: 'installment',
      payment_mode: 'upi',
      transaction_reference: '',
      remarks: `Installment for Unit ${saleItem.unitNumber}`
    }));
    setIsRecordModalOpen(true);
  };

  // Submit Payment Record
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?._id) return;
    if (!paymentForm.sale_id) {
      toast.error('Please select a customer / booking unit.');
      return;
    }
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const newPayment = await addPaymentMutation({
        tenant_id: tenant._id,
        sale_id: paymentForm.sale_id,
        payment_date: paymentForm.payment_date,
        amount: amt,
        payment_type: paymentForm.payment_type,
        payment_mode: paymentForm.payment_mode,
        transaction_reference: paymentForm.transaction_reference,
        remarks: paymentForm.remarks,
        recorded_by: profile?.full_name || profile?.email || 'Accountant'
      });

      toast.success(`Payment of ${formatCurrency(amt)} recorded successfully!`);

      // WhatsApp Share Prompt
      if (paymentForm.send_whatsapp_receipt) {
        const matchingSale = sales?.find(s => String(s.id || s._id) === String(paymentForm.sale_id));
        if (matchingSale) {
          sharePaymentReceiptWhatsApp(
            { ...newPayment, amount: amt, payment_date: paymentForm.payment_date, payment_mode: paymentForm.payment_mode, transaction_reference: paymentForm.transaction_reference },
            matchingSale,
            tenant
          );
        }
      }

      setIsRecordModalOpen(false);
      setSelectedSaleForPayment(null);
      setPaymentForm({
        sale_id: '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        payment_type: 'installment',
        payment_mode: 'upi',
        transaction_reference: '',
        remarks: '',
        send_whatsapp_receipt: true
      });
    } catch (err: any) {
      toast.error('Failed to record payment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Delete Payment Record
  const handleDeletePayment = async (paymentId: string) => {
    if (await dialog.confirm('Are you sure you want to delete this payment record? This will adjust the customer\'s balance due.')) {
      try {
        await deletePaymentMutation({ id: paymentId });
        toast.success('Payment record removed successfully.');
      } catch (err: any) {
        toast.error('Failed to delete payment: ' + (err.message || 'Error'));
      }
    }
  };

  // 1-Click WhatsApp Reminder for Overdue Collection
  const sendCollectionReminderWhatsApp = (item: any) => {
    const cleanPhone = item.customerPhone.replace(/\D/g, '');
    const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const companyName = tenant?.name || 'Accounts Department';

    const text =
`*PAYMENT BALANCE REMINDER - ${companyName.toUpperCase()}*
----------------------------------------
Dear *${item.customerName}*,

Greetings from *${companyName}*.

This is a gentle update regarding your property booking:
• *Project:* ${item.projectName}
• *Unit No:* ${item.unitNumber}
• *Total Consideration:* ${formatCurrency(item.totalRevenue)}
• *Total Paid So Far:* ${formatCurrency(item.totalReceived)}
• *Pending Balance Due:* *${formatCurrency(item.balanceDue)}*

Kindly arrange for the installment payment at your earliest convenience. For bank transfer details or receipts, reply directly to this message.

Thank you,
_${companyName} Accounts & Recovery Team_`;

    const url = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <CreditCard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Accounts & Collections
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Record payments, generate official receipts & manage collection recoveries
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCollectionsExcel(collectionsList.filter(c => c.balanceDue > 0), tenant)}
            className="border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download size={15} className="mr-1.5" />
            Export Collection Sheet
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedSaleForPayment(null);
              setIsRecordModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5"
          >
            <Plus size={16} />
            Record Payment
          </Button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales Consideration</p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(metrics.totalConsideration)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Building size={12} /> Across {collectionsList.length} total bookings
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Collected</p>
          <h3 className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(metrics.totalCollected)}
          </h3>
          <p className="text-[11px] text-emerald-600/80 mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} /> {metrics.collectionEfficiency.toFixed(1)}% recovery rate
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Outstanding Dues</p>
          <h3 className="text-lg sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(metrics.totalOutstanding)}
          </h3>
          <p className="text-[11px] text-rose-500/80 mt-1 flex items-center gap-1">
            <AlertCircle size={12} /> Pending from {metrics.pendingCount} customers
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Transactions Logged</p>
          <h3 className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {payments?.length || 0}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Receipt size={12} /> Digital receipts generated
          </p>
        </div>
      </div>

      {/* Tabs & Search Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('collections')}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'collections'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Outstanding Collections ({metrics.pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'transactions'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Payment Transactions ({payments?.length || 0})
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search customer, phone, unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          {activeTab === 'collections' && (
            <>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl dark:text-white"
              >
                <option value="all">All Projects</option>
                {projects?.map((proj: any) => (
                  <option key={proj.id || proj._id} value={proj.id || proj._id}>
                    {proj.name}
                  </option>
                ))}
              </select>

              <select
                value={dueRangeFilter}
                onChange={(e) => setDueRangeFilter(e.target.value as any)}
                className="text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl dark:text-white"
              >
                <option value="all">All Balances</option>
                <option value="high">Dues ≥ ₹5 Lakhs</option>
                <option value="very_high">Dues ≥ ₹25 Lakhs</option>
              </select>
            </>
          )}

          {activeTab === 'transactions' && (
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl dark:text-white"
            >
              <option value="all">All Modes</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="bank_transfer">Bank Transfer / NEFT</option>
            </select>
          )}
        </div>
      </div>

      {/* TAB 1: Outstanding Collections (Kiska payment baki hai) */}
      {activeTab === 'collections' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Pending Recovery & Collections Tracker
              </h3>
              <p className="text-xs text-slate-500">
                Track customers with outstanding payments, record payments directly, or send WhatsApp reminders.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg">
              Showing {filteredCollections.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Project & Unit</th>
                  <th className="py-3 px-4 text-right">Total Consideration</th>
                  <th className="py-3 px-4 text-right">Total Received</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Last Payment</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredCollections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2 opacity-60" />
                      <p className="font-medium text-slate-600 dark:text-slate-300">No outstanding dues matching filters.</p>
                      <p className="text-xs text-slate-400 mt-1">All customers are up-to-date or adjust search criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCollections.map((item) => (
                    <tr key={item.sId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{item.customerName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          {item.customerPhone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.projectName}</div>
                        <div className="text-xs text-slate-400">Unit: {item.unitNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrency(item.totalRevenue)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.totalReceived)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-block font-bold text-xs px-2.5 py-1 rounded-lg ${
                          item.balanceDue > 0
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}>
                          {formatCurrency(item.balanceDue)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {item.lastPaymentDate ? (
                          <div className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {new Date(item.lastPaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No payments yet</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openRecordModalForSale(item)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                            title="Record new payment for this customer"
                          >
                            <Plus size={13} /> Record
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSaleForLedger(item);
                              setIsLedgerModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                            title="View Statement & Payment Ledger"
                          >
                            <FileText size={16} />
                          </button>

                          {item.balanceDue > 0 && (
                            <button
                              type="button"
                              onClick={() => sendCollectionReminderWhatsApp(item)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                              title="Send Balance Reminder on WhatsApp"
                            >
                              <MessageSquare size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Payment Transactions (Payment chadhna & receipts) */}
      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Recorded Payments & Receipts
              </h3>
              <p className="text-xs text-slate-500">
                Download official PDF receipts with company logo or share with customers via WhatsApp.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setSelectedSaleForPayment(null);
                setIsRecordModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              <Plus size={14} /> Add Payment
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4">Receipt / Date</th>
                  <th className="py-3 px-4">Customer & Unit</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4">Type & Mode</th>
                  <th className="py-3 px-4">Reference / Notes</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4 text-right">Receipt Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Receipt size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-medium text-slate-600 dark:text-slate-300">No payment transactions found.</p>
                      <p className="text-xs text-slate-400 mt-1">Click "Add Payment" to record a new receipt.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p: any) => {
                    const sale = sales?.find(s => String(s.id || s._id) === String(p.sale_id));
                    const customerName = sale?.customer?.name || sale?.lead_customer_name || 'Customer';
                    const unitNo = sale?.unit_number || 'N/A';
                    const projectName = sale?.project?.name || sale?.project_name || 'Project';

                    return (
                      <tr key={p._id || p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            RCP-{String(p._id || p.id).slice(-6).toUpperCase()}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{customerName}</div>
                          <div className="text-xs text-slate-400">{projectName} • Unit {unitNo}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(Number(p.amount) || 0)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {p.payment_mode || 'Cash'}
                          </span>
                          <span className="block text-[11px] text-slate-400 capitalize mt-0.5">
                            {p.payment_type || 'Installment'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[180px] truncate">
                          {p.transaction_reference ? (
                            <span className="font-mono text-[11px] block">{p.transaction_reference}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                          {p.remarks && <span className="text-slate-400 italic block truncate">{p.remarks}</span>}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {p.recorded_by || 'Staff'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {sale && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => exportPaymentReceiptPDF(p, sale, tenant)}
                                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                  title="Download Official PDF Receipt with Company Logo"
                                >
                                  <Receipt size={13} /> Receipt PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => sharePaymentReceiptWhatsApp(p, sale, tenant)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                                  title="Share Receipt on WhatsApp"
                                >
                                  <MessageSquare size={15} />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(p._id || p.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Delete payment record"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Record Payment Form ("Payment Chadhna") */}
      {isRecordModalOpen && (
        <Modal
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false);
            setSelectedSaleForPayment(null);
          }}
          title={selectedSaleForPayment ? `Record Payment - ${selectedSaleForPayment.customerName}` : "Record Customer Payment"}
          size="lg"
        >
          <form onSubmit={handleSavePayment} className="p-6 space-y-4">
            {/* Customer Booking Selector (if not pre-selected) */}
            {!selectedSaleForPayment && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Customer & Property Booking *
                </label>
                <select
                  value={paymentForm.sale_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, sale_id: e.target.value })}
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  required
                >
                  <option value="">-- Choose Booking --</option>
                  {collectionsList.map((c) => (
                    <option key={c.sId} value={c.sId}>
                      {c.customerName} - {c.projectName} (Unit: {c.unitNumber}) [Bal: {formatCurrency(c.balanceDue)}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedSaleForPayment && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSaleForPayment.customerName}</span>
                  <span className="text-slate-500 block">{selectedSaleForPayment.projectName} • Unit {selectedSaleForPayment.unitNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current Balance Due</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(selectedSaleForPayment.balanceDue)}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Date *
                </label>
                <Input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Received (INR) *
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 500000"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode *
                </label>
                <Select
                  value={paymentForm.payment_mode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                  options={[
                    { label: 'UPI / QR Code', value: 'upi' },
                    { label: 'Bank Transfer / NEFT / RTGS', value: 'bank_transfer' },
                    { label: 'Cheque / DD', value: 'cheque' },
                    { label: 'Cash Payment', value: 'cash' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Type *
                </label>
                <Select
                  value={paymentForm.payment_type}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}
                  options={[
                    { label: 'Installment Payment', value: 'installment' },
                    { label: 'Booking Advance Amount', value: 'booking' },
                    { label: 'Milestone / Slab Payment', value: 'milestone' },
                    { label: 'Final Possession Payment', value: 'final' },
                    { label: 'Maintenance / Other Charges', value: 'maintenance' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Reference / Cheque No.
              </label>
              <Input
                placeholder="e.g. UTR128392183 or Cheque #004521"
                value={paymentForm.transaction_reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Notes
              </label>
              <Input
                placeholder="e.g. Received via HDFC Bank, 2nd floor slab milestone"
                value={paymentForm.remarks}
                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
              />
            </div>

            {/* Auto WhatsApp Option */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Share WhatsApp Receipt Immediately
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Opens WhatsApp with pre-filled acknowledgment upon saving.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={paymentForm.send_whatsapp_receipt}
                onChange={(e) => setPaymentForm({ ...paymentForm, send_whatsapp_receipt: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRecordModalOpen(false);
                  setSelectedSaleForPayment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmittingPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Save Payment & Issue Receipt
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* MODAL 2: View Full Statement & Ledger */}
      {isLedgerModalOpen && selectedSaleForLedger && (
        <Modal
          isOpen={isLedgerModalOpen}
          onClose={() => {
            setIsLedgerModalOpen(false);
            setSelectedSaleForLedger(null);
          }}
          title={`Statement of Accounts - ${selectedSaleForLedger.customerName}`}
          size="xl"
        >
          <div className="p-6 space-y-5">
            {/* Property Summary Banner */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Project</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{selectedSaleForLedger.projectName}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Unit Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{selectedSaleForLedger.unitNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Total Consideration</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(selectedSaleForLedger.totalRevenue)}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Balance Due</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">{formatCurrency(selectedSaleForLedger.balanceDue)}</span>
              </div>
            </div>

            {/* Actions for Ledger */}
            <div className="flex items-center justify-between gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex-wrap">
              <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                Official Statement with Company Logo:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const salePayments = (payments || []).filter(
                      (p: any) => String(p.sale_id) === String(selectedSaleForLedger.sId)
                    );
                    exportPaymentLedgerPDF(selectedSaleForLedger, salePayments, tenant);
                  }}
                  className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs"
                >
                  <FileText size={14} className="mr-1" /> Download PDF Ledger
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const salePayments = (payments || []).filter(
                      (p: any) => String(p.sale_id) === String(selectedSaleForLedger.sId)
                    );
                    exportPaymentLedgerExcel(selectedSaleForLedger, salePayments, tenant);
                  }}
                  className="bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 text-xs"
                >
                  <Download size={14} className="mr-1" /> Excel Sheet
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const salePayments = (payments || []).filter(
                      (p: any) => String(p.sale_id) === String(selectedSaleForLedger.sId)
                    );
                    sharePaymentLedger(selectedSaleForLedger, salePayments, tenant);
                  }}
                  className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs"
                >
                  <Send size={14} className="mr-1" /> Share
                </Button>
              </div>
            </div>

            {/* Table of Payments for this Sale */}
            <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Particulars</th>
                    <th className="py-2.5 px-3">Mode & Ref</th>
                    <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                    <th className="py-2.5 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {((payments || []).filter((p: any) => String(p.sale_id) === String(selectedSaleForLedger.sId))).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No payments logged for this customer yet.
                      </td>
                    </tr>
                  ) : (
                    (payments || [])
                      .filter((p: any) => String(p.sale_id) === String(selectedSaleForLedger.sId))
                      .map((p: any) => (
                        <tr key={p._id || p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                          <td className="py-2.5 px-3 font-medium capitalize">{p.payment_type || 'Installment'}</td>
                          <td className="py-2.5 px-3 text-slate-500 uppercase">
                            {p.payment_mode || 'Cash'} {p.transaction_reference ? `(${p.transaction_reference})` : ''}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(Number(p.amount) || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => exportPaymentReceiptPDF(p, selectedSaleForLedger, tenant)}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 p-1 rounded"
                              title="Download PDF Receipt"
                            >
                              <Receipt size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => sharePaymentReceiptWhatsApp(p, selectedSaleForLedger, tenant)}
                              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-1 rounded ml-1"
                              title="Share on WhatsApp"
                            >
                              <MessageSquare size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsLedgerModalOpen(false);
                  setSelectedSaleForLedger(null);
                }}
              >
                Close
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  );
}

