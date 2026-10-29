import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '../../lib/reactive';
import { api } from '../../lib/api-endpoints';
import { formatCurrency } from '../../utils/format';
import { exportPaymentReceiptPDF, sharePaymentReceiptWhatsApp } from '../../utils/export';
import { UpcomingEvents } from './widgets/UpcomingEvents';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Receipt,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Building,
  FileText
} from 'lucide-react';
import { Button } from '../ui/Button';

export function AccountantDashboard() {
  const { profile, tenant } = useAuth();
  const navigate = useNavigate();

  const sales = useQuery(api.sales.getSales, tenant?._id ? { tenant_id: tenant._id } : "skip") as any[];
  const payments = useQuery(api.payments.listPayments, tenant?._id ? { tenant_id: tenant._id } : "skip") as any[];

  // Financial calculations
  const stats = useMemo(() => {
    const totalConsideration = (sales || []).reduce((acc: number, curr: any) => acc + (Number(curr.total_revenue) || 0), 0);
    const totalCollected = (payments || []).reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
    const totalOutstanding = Math.max(0, totalConsideration - totalCollected);
    const recoveryRate = totalConsideration > 0 ? (totalCollected / totalConsideration) * 100 : 0;

    return {
      totalConsideration,
      totalCollected,
      totalOutstanding,
      recoveryRate,
      totalReceipts: payments?.length || 0
    };
  }, [sales, payments]);

  // Recent 5 Payments
  const recentPayments = useMemo(() => {
    if (!payments || !Array.isArray(payments)) return [];
    return [...payments]
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
      .slice(0, 5);
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-3xl p-6 sm:p-8 shadow-xl text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-1 bg-white/20 rounded-2xl backdrop-blur-sm">
              {profile?.image_url ? (
                <img src={profile.image_url} alt={profile.full_name || 'User'} className="w-14 h-14 rounded-xl object-cover border-2 border-white/50" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center text-xl font-bold border-2 border-white/40">
                  {profile?.full_name?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  Accounts & Finance Portal
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
                Welcome, {profile?.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-teal-100 text-xs sm:text-sm mt-0.5">
                Manage payment receipts, customer ledgers, and recovery collections.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              onClick={() => navigate('/accounts')}
              className="bg-white text-teal-800 hover:bg-teal-50 font-bold shadow-md text-xs sm:text-sm gap-1.5"
            >
              <CreditCard size={16} /> Open Accounts Workspace
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales Consideration</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(stats.totalConsideration)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Across all active property deals</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Collected</p>
          <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(stats.totalCollected)}
          </h3>
          <p className="text-[11px] text-emerald-600/80 mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} /> {stats.recoveryRate.toFixed(1)}% recovery rate
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Outstanding Dues</p>
          <h3 className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(stats.totalOutstanding)}
          </h3>
          <p className="text-[11px] text-rose-500/80 mt-1 flex items-center gap-1">
            <AlertCircle size={12} /> Pending collection balance
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Receipts Issued</p>
          <h3 className="text-xl sm:text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {stats.totalReceipts}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Receipt size={12} /> Logged in system
          </p>
        </div>
      </div>

      {/* Quick Action Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payment Receipts */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Recent Payment Receipts
              </h3>
              <p className="text-xs text-slate-500">
                Latest customer payments logged into RealSalePro.
              </p>
            </div>
            <Link
              to="/accounts"
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1"
            >
              View All ({stats.totalReceipts}) <ArrowRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {recentPayments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recent payment transactions recorded yet.
              </div>
            ) : (
              recentPayments.map((p: any) => {
                const sale = sales?.find(s => String(s.id || s._id) === String(p.sale_id));
                const customerName = sale?.customer?.name || sale?.lead_customer_name || 'Customer';
                const unitNo = sale?.unit_number || 'N/A';

                return (
                  <div key={p._id || p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {customerName}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Unit: {unitNo} • {new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                          {formatCurrency(Number(p.amount) || 0)}
                        </span>
                        <span className="text-[10px] uppercase text-slate-400 font-semibold">
                          {p.payment_mode || 'Cash'}
                        </span>
                      </div>

                      {sale && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => exportPaymentReceiptPDF(p, sale, tenant)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                            title="Download PDF Receipt"
                          >
                            <Receipt size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => sharePaymentReceiptWhatsApp(p, sale, tenant)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Share on WhatsApp"
                          >
                            <MessageSquare size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar: Upcoming Events & Tasks */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border border-teal-100 dark:border-teal-900/30 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-teal-900 dark:text-teal-200 text-sm flex items-center gap-1.5">
              <TrendingUp size={16} /> Quick Accounting Actions
            </h4>
            <div className="space-y-2">
              <Button
                onClick={() => navigate('/accounts')}
                className="w-full justify-between bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 text-xs border border-teal-200/60 dark:border-white/10"
              >
                <span>Record New Payment</span>
                <Plus size={14} />
              </Button>
              <Button
                onClick={() => navigate('/accounts')}
                variant="outline"
                className="w-full justify-between bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs border border-slate-200 dark:border-white/10"
              >
                <span>Export Outstanding Due Sheet</span>
                <FileText size={14} />
              </Button>
            </div>
          </div>

          <UpcomingEvents />
        </div>
      </div>
    </div>
  );
}
