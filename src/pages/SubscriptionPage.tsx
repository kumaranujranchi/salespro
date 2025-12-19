import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Check,
  Zap,
  AlertCircle,
  Loader2,
  CreditCard,
  Calendar,
  Shield,
  Download,
  Receipt
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TenantData {
  id: string;
  name: string;
  plan_tier: string;
  billing_cycle: string;
  trial_ends_at: string | null;
  subscription_status: string;
  is_active: boolean;
  next_billing_date?: string;
  created_at?: string;
}

interface BillingRecord {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  razorpay_payment_id: string;
  description: string;
}

export function SubscriptionPage() {
  const { tenant, user } = useAuth();
  const navigate = useNavigate();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    fetchTenantData();
    fetchBillingHistory();
  }, [tenant]);

  const fetchTenantData = async () => {
    if (!tenant?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('id, name, plan_tier, billing_cycle, trial_ends_at, subscription_status, is_active, next_billing_date, created_at')
        .eq('id', tenant.id)
        .single();

      if (fetchError) throw fetchError;

      if (!data) {
        throw new Error('Tenant data not found');
      }

      setTenantData(data as TenantData);

      // Calculate days remaining
      let endDate: Date;

      if (data.trial_ends_at) {
        endDate = new Date(data.trial_ends_at);
      } else {
        const now = new Date();
        endDate = new Date(now.setDate(now.getDate() + 14));
      }

      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays);

    } catch (err: any) {
      console.error('Error fetching tenant data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    if (!tenant?.id) return;

    try {
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch billing history', error);
        return;
      }

      if (data) {
        setBillingHistory(data);
      }
    } catch (err) {
      console.warn('Error fetching billing history:', err);
    }
  };

  const generateInvoice = (record: BillingRecord) => {
    const doc = new jsPDF();

    // Brand Colors
    const primaryColor = '#4F46E5'; // Indigo 600

    // Header
    doc.setFontSize(24);
    doc.setTextColor(primaryColor);
    doc.text('TAX INVOICE', 14, 25);

    // Company Details (Seller)
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Synergy Brand Architect', 14, 40);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Patna, Bihar', 14, 46);
    doc.text('Email: support@realsalepro.com', 14, 52);

    // Invoice Details (Right Side)
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const rightColX = 140;
    doc.text(`Invoice Date: ${new Date(record.created_at).toLocaleDateString()}`, rightColX, 40);
    doc.text(`Invoice #: ${record.id.slice(0, 8).toUpperCase()}`, rightColX, 46);
    doc.text(`Payment ID: ${record.razorpay_payment_id}`, rightColX, 52);

    // Bill To
    doc.text('Bill To:', 14, 65);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(tenant?.name || 'Valued Customer', 14, 71);
    if (user?.email) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(user.email, 14, 76);
    }

    // Calculations
    // Assuming Amount is Inclusive of 18% GST because most B2C prices are inclusive
    const totalAmount = record.amount / 100;
    const baseAmount = totalAmount / 1.18;
    const gstAmount = totalAmount - baseAmount;

    // Table
    autoTable(doc, {
      startY: 85,
      head: [['Description', 'Base Amount', 'GST (18%)', 'Total']],
      body: [
        [
          record.description || 'Subscription Plan',
          `INR ${baseAmount.toFixed(2)}`,
          `INR ${gstAmount.toFixed(2)}`,
          `INR ${totalAmount.toFixed(2)}`
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      styles: { fontSize: 10, cellPadding: 5 },
    });

    // Total Section
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal:', 130, finalY);
    doc.text('IGST (18%):', 130, finalY + 6);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', 130, finalY + 14);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    // Align values to the right margin (approx 195mm for A4)
    doc.text(`INR ${baseAmount.toFixed(2)}`, 195, finalY, { align: 'right' });
    doc.text(`INR ${gstAmount.toFixed(2)}`, 195, finalY + 6, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text(`INR ${totalAmount.toFixed(2)}`, 195, finalY + 14, { align: 'right' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    const pageHeight = doc.internal.pageSize.height;
    doc.text('This is a computer generated invoice and does not require a signature.', 14, pageHeight - 20);

    // Save
    doc.save(`Invoice_${record.id.slice(0, 8)}.pdf`);
  };

  const trialFeatures = [
    'All Pro Features Included',
    'Unlimited Users',
    'Real-time Analytics',
    'Priority Email Support',
    'Full CRM Module Access',
    'Lead Management',
    'Sales Tracking',
    'Custom Reports'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Subscription</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tenantData) {
    return null;
  }

  const isPro = tenantData.plan_tier === 'pro';
  const isTrial = tenantData.subscription_status === 'trial';
  const isActive = tenantData.subscription_status === 'active';

  // Calculate generic next billing date if not in DB
  const getNextBillingDate = () => {
    if (tenantData.next_billing_date) return new Date(tenantData.next_billing_date);

    // Fallback based on last update or creation
    // This is just for display if real data is missing
    const baseDate = new Date();
    if (tenantData.billing_cycle === 'yearly') {
      return new Date(baseDate.setFullYear(baseDate.getFullYear() + 1));
    } else if (tenantData.billing_cycle === 'semi_annual') {
      return new Date(baseDate.setMonth(baseDate.getMonth() + 6));
    } else {
      return new Date(baseDate.setMonth(baseDate.getMonth() + 1));
    }
  };

  const billingAmount = tenantData.billing_cycle === 'yearly' ? 12000 : tenantData.billing_cycle === 'semi_annual' ? 7200 : 1500;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E1A15] py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Subscription & Billing
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
              Manage your plan, view history, and payment details
            </p>
          </div>
          {!isActive && (
            <button
              onClick={() => navigate('/pricing')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Upgrade Plan
            </button>
          )}
        </div>

        {/* Status Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Card 1: Current Plan */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Shield className="w-6 h-6" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  isTrial ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-red-100 text-red-700'
                  }`}>
                  {isActive ? 'Active' : isTrial ? 'Trial Phase' : 'Inactive'}
                </span>
              </div>
              <h3 className="text-slate-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider mb-1">
                Current Plan
              </h3>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {isPro ? 'Pro Subscription' : 'Starter Plan'}
              </div>
              <div className="text-sm text-slate-600 dark:text-gray-400">
                {isActive
                  ? `Billed ${tenantData.billing_cycle === 'yearly' ? 'Yearly' : tenantData.billing_cycle === 'semi_annual' ? 'Every 6 Months' : 'Monthly'}`
                  : `${daysRemaining} days left in trial`
                }
              </div>
            </div>
          </div>

          {/* Card 2: Billing Status */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-slate-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider mb-1">
                Upcoming Invoice
              </h3>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {formatCurrency(billingAmount)}
              </div>
              <div className="text-sm text-slate-600 dark:text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Renewing on {getNextBillingDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Usage / Stats (Placeholder for now) */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-slate-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider mb-1">
                Plan Benefits
              </h3>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                All Systems Go
              </div>
              <div className="text-sm text-slate-600 dark:text-gray-400">
                You have full access to all Pro features
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Features List */}
          <div className="lg:col-span-1 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 p-6 h-fit">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Included in your plan
            </h3>
            <ul className="space-y-4">
              {trialFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            {!isActive && (
              <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 text-sm mb-2">Upgrade now for full access</h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 mb-3">
                  Don't lose your data when the trial ends. Secure your pricing today.
                </p>
                <button onClick={() => navigate('/pricing')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  View Plans →
                </button>
              </div>
            )}
          </div>

          {/* Billing History Table */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-400" />
                Payment History
              </h3>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                Download All
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {billingHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-medium mb-1">No payment history yet</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
                    Once you make a payment, your invoices and receipts will appear here.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-medium">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {billingHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {new Date(record.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                          {record.description || 'Pro Subscription'}
                          <div className="text-xs text-slate-400 font-normal mt-0.5">{record.razorpay_payment_id}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {formatCurrency(record.amount / 100)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                            ${record.status === 'captured' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}
                          `}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => generateInvoice(record)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="Download Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
