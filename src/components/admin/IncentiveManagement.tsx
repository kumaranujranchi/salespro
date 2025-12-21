import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Plus, Save, X, User, Edit2, Trash2, Filter, AlertCircle, Target, ChevronDown, CheckCircle, Info } from 'lucide-react';
import { IncentivePlanSummary } from '../IncentivePlanSummary';
import { useAuth } from '../../contexts/AuthContext';

interface Incentive {
  id: string;
  sales_executive_id: string;
  calculation_month: string;
  calculation_year: number;
  total_incentive_amount: number;
  created_at?: string;
  profiles?: {
    full_name: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

export function IncentiveManagement() {
  const { tenant } = useAuth();
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modals State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedUserBreakdown, setExpandedUserBreakdown] = useState<string | null>(null);

  // Filters
  const [filterUser, setFilterUser] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const [formData, setFormData] = useState({
    sales_executive_id: '',
    calculation_month: new Date().toLocaleString('default', { month: 'long' }),
    calculation_year: new Date().getFullYear(),
    total_incentive_amount: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch incentives with user details
      const { data: incentivesData, error: incentivesError } = await supabase
        .from('incentives')
        .select(`
          *,
          profiles:sales_executive_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (incentivesError) throw incentivesError;
      setIncentives(incentivesData || []);

      // Fetch all potential sales executives (profiles)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch sales for calculation
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('tenant_id', tenant?.id);

      if (salesError) throw salesError;
      setSales(salesData || []);

      // Fetch all payments for these sales
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, sale_id');

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!formData.sales_executive_id || !formData.total_incentive_amount) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    try {
      const amount = parseFloat(formData.total_incentive_amount);
      if (isNaN(amount)) throw new Error('Invalid amount');

      const recordData = {
        sales_executive_id: formData.sales_executive_id,
        calculation_month: formData.calculation_month,
        calculation_year: formData.calculation_year,
        total_incentive_amount: amount,
      };

      if (editingId) {
        // Update existing record
        const { error } = await supabase
          .from('incentives')
          .update(recordData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new record
        const newRecord = {
          ...recordData,
          sale_id: crypto.randomUUID(), // Generate valid UUID
          installment_1_amount: amount,
          installment_1_paid: false,
          is_locked: false
        };

        const { error } = await supabase
          .from('incentives')
          .insert([newRecord]);

        if (error) throw error;
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving incentive:', error);
      setErrorMessage(error.message || error.error_description || 'Unknown error');
    }
  };

  const handleEdit = (inc: Incentive) => {
    setFormData({
      sales_executive_id: inc.sales_executive_id,
      calculation_month: inc.calculation_month,
      calculation_year: inc.calculation_year,
      total_incentive_amount: inc.total_incentive_amount.toString()
    });
    setEditingId(inc.id);
    setIsAdding(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const calculateDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('incentives')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      setDeleteId(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting incentive:', error);
      setErrorMessage('Failed to delete incentive');
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      sales_executive_id: '',
      calculation_month: new Date().toLocaleString('default', { month: 'long' }),
      calculation_year: new Date().getFullYear(),
      total_incentive_amount: ''
    });
  };

  // Filter Logic
  const filteredIncentives = incentives.filter(inc => {
    const matchesUser = filterUser ? inc.sales_executive_id === filterUser : true;
    const matchesMonth = filterMonth ? inc.calculation_month === filterMonth : true;
    const matchesYear = filterYear ? inc.calculation_year.toString() === filterYear : true;
    return matchesUser && matchesMonth && matchesYear;
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2025, 2026, 2027];

  // Automated Calculation Helpers
  const calculateIncentiveForUser = (userId: string, month: string, year: number) => {
    const userSales = sales.filter(s => {
      const saleDate = new Date(s.sale_date);
      const saleMonth = saleDate.toLocaleString('default', { month: 'long' });
      const saleYear = saleDate.getFullYear();
      const isEligible = s.sales_executive_id === userId && saleMonth === month && saleYear === year;
      
      // ELIGIBILITY RULE 1: Only if agreement is finalized
      return isEligible && s.is_agreement_done;
    });

    if (userSales.length === 0) return { total: 0, releasable: 0, totalSqft: 0, totalRevenue: 0 };

    const plan = tenant?.settings?.incentive_plan;
    if (!plan || plan.type === 'manual') return { total: 0, releasable: 0, totalSqft: 0, totalRevenue: 0 };

    const totalSqft = userSales.reduce((sum, s) => sum + (s.area_sqft || 0), 0);
    const totalRevenue = userSales.reduce((sum, s) => sum + (s.total_revenue || 0), 0);

    let totalProjected = 0;
    let currentlyReleasable = 0;

    // 1. Calculate Total Projected based on slabs
    let baseRate = 0;
    if (plan.rules?.tiers) {
      const tiers = plan.rules.tiers || [];
      // MATCHING IMAGE: Slab 1: <3000 (1%), Slab 2: 3000-5000 (2%), Slab 3: 5000-7000 (3%), Slab 4: >7100 (4%)
      // Note: We'll use the dynamic tiers from tenant settings if available, otherwise default to image rules
      const applicableTier = tiers.find((t: any) => totalSqft >= t.min && (t.max === null || totalSqft <= t.max));
      if (applicableTier) {
        baseRate = applicableTier.rate;
      } else {
        // Fallback to Image Rules if tiers in DB are wrong/missing
        if (totalSqft >= 7100) baseRate = 4;
        else if (totalSqft >= 5000) baseRate = 3;
        else if (totalSqft >= 3000) baseRate = 2;
        else if (totalSqft >= 0) baseRate = 1;
      }
      totalProjected = (totalRevenue * baseRate) / 100;
    } else if (plan.rules?.rules) {
      const pRules = plan.rules.rules || [];
      userSales.forEach(s => {
        const rule = pRules.find((r: any) => r.project_id === s.project_id) || pRules.find((r: any) => r.project_id === 'all');
        if (rule) {
          totalProjected += (s.total_revenue * rule.base_rate) / 100 + (rule.milestone_bonus || 0);
        }
      });
    }

    // 2. Calculate Releasable based on Payment Milestones and Registry
    const bookingBreakdown = userSales.map(s => {
      const salePayments = payments.filter(p => p.sale_id === s.id).reduce((sum, p) => sum + p.amount, 0);
      const paymentPct = (salePayments / s.total_revenue) * 100;
      
      let releasePct = 0;
      if (s.is_registry_done) {
        releasePct = 100;
      } else {
        if (paymentPct >= 75) releasePct = 75;
        else if (paymentPct >= 50) releasePct = 50;
        else if (paymentPct >= 30) releasePct = 30;
      }

      const saleTotalIncentive = plan.rules?.tiers 
        ? (s.total_revenue * baseRate) / 100 
        : (s.total_revenue * (plan.rules?.rules?.find((r: any) => r.project_id === s.project_id || r.project_id === 'all')?.base_rate || 0)) / 100;
      
      const saleReleasable = (saleTotalIncentive * releasePct) / 100;
      currentlyReleasable += saleReleasable;

      return {
        id: s.id,
        booking_no: s.id.slice(0, 8).toUpperCase(),
        sqft: s.area_sqft || 0,
        revenue: s.total_revenue,
        payment_pct: paymentPct.toFixed(1),
        is_agreement_done: s.is_agreement_done,
        is_registry_done: s.is_registry_done,
        release_pct: releasePct,
        projected: saleTotalIncentive,
        releasable: saleReleasable
      };
    });

    return { 
      total: totalProjected, 
      releasable: currentlyReleasable, 
      totalSqft, 
      totalRevenue,
      bookings: bookingBreakdown
    };
  };

  const getActivePlanSummary = () => {
    const plan = tenant?.settings?.incentive_plan;
    if (!plan || plan.type === 'manual') return 'Manual Only';
    if (plan.rules?.tiers) return `Slab-Based (${plan.rules.tiers.length} Tiers)`;
    if (plan.rules?.rules) return 'Project Specific Overrides';
    return 'Automated (JSON)';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-1 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-gray-500 mb-1 sm:mb-0">
            <Filter size={18} />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="p-2 text-xs sm:text-sm rounded-md border bg-gray-50 dark:bg-black/20 dark:border-white/10 dark:text-white w-full sm:min-w-[150px]"
            >
              <option value="" className="dark:bg-[#121e18]">All Users</option>
              {profiles.map(p => <option key={p.id} value={p.id} className="dark:bg-[#121e18]">{p.full_name}</option>)}
            </select>

            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="p-2 text-xs sm:text-sm rounded-md border bg-gray-50 dark:bg-black/20 dark:border-white/10 dark:text-white w-full"
            >
              <option value="" className="dark:bg-[#121e18]">All Months</option>
              {months.map(m => <option key={m} value={m} className="dark:bg-[#121e18]">{m}</option>)}
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="p-2 text-xs sm:text-sm rounded-md border bg-gray-50 dark:bg-black/20 dark:border-white/10 dark:text-white w-full"
            >
              <option value="" className="dark:bg-[#121e18]">All Years</option>
              {years.map(y => <option key={y} value={y} className="dark:bg-[#121e18]">{y}</option>)}
            </select>
          </div>

          {(filterUser || filterMonth || filterYear) && (
            <button
              onClick={() => { setFilterUser(''); setFilterMonth(''); setFilterYear(''); }}
              className="p-2 text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 self-end sm:self-auto"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

          {tenant?.settings?.incentive_plan?.type !== 'custom' && (
            <button
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg whitespace-nowrap"
            >
              <Plus size={20} />
              Add Manual Incentive
            </button>
          )}
       </div>

      {/* Plan Summary Section */}
      {tenant?.settings?.incentive_plan?.type === 'custom' && (
        <>
          <IncentivePlanSummary tenant={tenant} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-white to-amber-50 dark:from-white/5 dark:to-transparent rounded-xl border border-amber-100 dark:border-white/5 shadow-sm">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Sq Ft (This Month)</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-gray-900 dark:text-white">
                    {sales.filter(s => {
                      const date = new Date(s.sale_date);
                      return date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
                    }).reduce((sum, s) => sum + (s.area_sqft || 0), 0).toLocaleString()}
                  </p>
                  <span className="text-xs text-gray-400 font-medium">Applied to slabs</span>
                </div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-white to-green-50 dark:from-white/5 dark:to-transparent rounded-xl border border-green-100 dark:border-white/5 shadow-sm">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Estimated Payout Pipeline</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-[#00E576]">
                    {formatCurrency(profiles.reduce((sum, p) => {
                  const result = calculateIncentiveForUser(p.id, new Date().toLocaleString('default', { month: 'long' }), new Date().getFullYear());
                  return sum + result.releasable;
                }, 0))}
                  </p>
                  <span className="text-xs text-gray-400 font-medium">Across all executives</span>
                </div>
            </div>
          </div>
        </>
      )}

      {/* Automated Calculations Table */}
      {tenant?.settings?.incentive_plan?.type === 'custom' && (
        <Card className="dark:bg-[#121e18] border border-amber-500/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={20} className="text-amber-500" />
              <CardTitle className="dark:text-white">Automated Calculations ({filterMonth || new Date().toLocaleString('default', { month: 'long' })})</CardTitle>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Projected From {getActivePlanSummary()}</span>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                <thead className="bg-amber-50 dark:bg-amber-900/10 text-amber-900/60 dark:text-amber-200/40 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Sales Executive</th>
                    <th className="px-4 py-3 text-right">Total Sq Ft</th>
                    <th className="px-4 py-3 text-right">Total Revenue</th>
                    <th className="px-4 py-3 text-right">Calculated Incentive</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 dark:divide-white/5">
                    {profiles.filter(p => p.role === 'sales_executive' || p.role === 'team_leader').map(p => {
                      const currentMonth = filterMonth || new Date().toLocaleString('default', { month: 'long' });
                      const currentYear = filterYear ? parseInt(filterYear) : new Date().getFullYear();
                      const result = calculateIncentiveForUser(p.id, currentMonth, currentYear);
                      
                      if (result.total === 0 && result.totalSqft === 0) return null;

                      return (
                        <React.Fragment key={p.id}>
                          <tr 
                            className={`hover:bg-amber-500/5 transition-colors cursor-pointer ${expandedUserBreakdown === p.id ? 'bg-amber-500/10' : ''}`}
                            onClick={() => setExpandedUserBreakdown(expandedUserBreakdown === p.id ? null : p.id)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`transition-transform ${expandedUserBreakdown === p.id ? 'rotate-180' : ''}`}>
                                  <ChevronDown size={14} className="text-gray-400" />
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">{p.full_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-500">{result.totalSqft.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(result.totalRevenue)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-bold text-amber-600">{formatCurrency(result.releasable)}</span>
                                <span className="text-[10px] text-gray-400">of {formatCurrency(result.total)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {incentives.some(inc => inc.sales_executive_id === p.id && inc.calculation_month === currentMonth && inc.calculation_year === currentYear) ? (
                                <span className="text-[10px] bg-green-500/20 text-green-600 px-2 py-1 rounded-full font-bold">ALREADY PAID</span>
                              ) : (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData({
                                      sales_executive_id: p.id,
                                      calculation_month: currentMonth,
                                      calculation_year: currentYear,
                                      total_incentive_amount: result.releasable.toFixed(2)
                                    });
                                    setIsAdding(true);
                                    window.scrollTo({ top: 300, behavior: 'smooth' });
                                  }}
                                  className="text-[10px] bg-amber-500 text-white px-2 py-1 rounded-full font-bold hover:bg-amber-600 transition-colors shadow-sm"
                                >
                                  POST MANUAL RECORD
                                </button>
                              )}
                            </td>
                          </tr>
                          
                          {/* Expanded Booking Breakdown */}
                          {expandedUserBreakdown === p.id && (
                            <tr className="bg-amber-50/30 dark:bg-amber-900/5">
                              <td colSpan={5} className="px-8 py-4 border-l-4 border-amber-500/50">
                                <h5 className="text-[11px] font-bold text-amber-900/60 dark:text-amber-200/40 uppercase mb-3 flex items-center gap-2">
                                  <Info size={14} /> Booking-wise Eligibility & Release Breakdown
                                </h5>
                                <div className="overflow-hidden rounded-xl border border-amber-200/30 dark:border-white/5 bg-white/50 dark:bg-black/20 shadow-sm">
                                  <table className="w-full text-xs">
                                    <thead className="bg-amber-100/30 dark:bg-white/5 text-[10px] uppercase text-gray-500">
                                      <tr>
                                        <th className="px-3 py-2 text-left">Booking Ref</th>
                                        <th className="px-3 py-2 text-right">Area (Sq Ft)</th>
                                        <th className="px-3 py-2 text-center">Agreement</th>
                                        <th className="px-3 py-2 text-center">Payment %</th>
                                        <th className="px-3 py-2 text-center">Registry</th>
                                        <th className="px-3 py-2 text-right">Release %</th>
                                        <th className="px-3 py-2 text-right">Releasable (₹)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-100 dark:divide-white/5">
                                      {result.bookings?.map((b: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-amber-50 transition-colors">
                                          <td className="px-3 py-2 font-mono font-bold text-gray-600 dark:text-gray-400">{b.booking_no}</td>
                                          <td className="px-3 py-2 text-right">{b.sqft.toLocaleString()}</td>
                                          <td className="px-3 py-2 text-center">
                                            {b.is_agreement_done ? (
                                              <span className="text-green-500 inline-flex items-center gap-1"><CheckCircle size={12} /> Yes</span>
                                            ) : (
                                              <span className="text-red-400">No</span>
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-center font-bold text-blue-600">{b.payment_pct}%</td>
                                          <td className="px-3 py-2 text-center">
                                            {b.is_registry_done ? (
                                              <span className="text-green-600 font-bold uppercase text-[9px]">Completed</span>
                                            ) : (
                                              <span className="text-gray-400 uppercase text-[9px]">Pending</span>
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-right">
                                            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 px-1.5 py-0.5 rounded-md font-black">{b.release_pct}%</span>
                                          </td>
                                          <td className="px-3 py-2 text-right font-black text-amber-600">{formatCurrency(b.releasable)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
               </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <Card className="bg-slate-50 dark:bg-[#121e18] border border-[#00E576]/30 shadow-lg shadow-[#00E576]/5">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">{editingId ? 'Edit Incentive' : 'Add New Incentive'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Sales Executive</label>
                <select
                  className="w-full p-2 rounded-md border bg-white dark:bg-black/20 dark:border-white/10 dark:text-white"
                  value={formData.sales_executive_id}
                  onChange={(e) => setFormData({ ...formData, sales_executive_id: e.target.value })}
                >
                  <option value="" className="dark:bg-[#121e18]">Select User</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id} className="dark:bg-[#121e18]">{p.full_name} ({p.role})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Month</label>
                  <select
                    className="w-full p-2 rounded-md border bg-white dark:bg-black/20 dark:border-white/10 dark:text-white"
                    value={formData.calculation_month}
                    onChange={(e) => setFormData({ ...formData, calculation_month: e.target.value })}
                  >
                    {months.map(m => <option key={m} value={m} className="dark:bg-[#121e18]">{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Year</label>
                  <select
                    className="w-full p-2 rounded-md border bg-white dark:bg-black/20 dark:border-white/10 dark:text-white"
                    value={formData.calculation_year}
                    onChange={(e) => setFormData({ ...formData, calculation_year: Number(e.target.value) })}
                  >
                    {years.map(y => <option key={y} value={y} className="dark:bg-[#121e18]">{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Amount (₹)</label>
                <input
                  type="number"
                  className="w-full p-2 rounded-md border bg-white dark:bg-black/20 dark:border-white/10 dark:text-white"
                  placeholder="0.00"
                  value={formData.total_incentive_amount}
                  onChange={(e) => setFormData({ ...formData, total_incentive_amount: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-[#00E576] hover:bg-[#00C853] text-[#0A1C37] p-2 rounded-md font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={18} /> {editingId ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={resetForm}
                  className="bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white p-2 rounded-md hover:bg-gray-300 dark:hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incentives Table */}
      <Card className="dark:bg-surface-dark dark:border-white/10">
        <CardHeader>
          <CardTitle className="dark:text-white">All Incentives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 uppercase">
                <tr>
                  <th className="px-4 py-3">User Name</th>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3 text-right">Incentive Amount</th>
                  <th className="px-4 py-3 text-right">Date Added</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
                ) : filteredIncentives.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-gray-500">No records found.</td></tr>
                ) : (
                  filteredIncentives.map((inc) => (
                    <tr key={inc.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        {inc.profiles?.full_name || 'Unknown User'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inc.calculation_month}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inc.calculation_year}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#00E576]">
                        {formatCurrency(inc.total_incentive_amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500">
                        {new Date(inc.created_at || '').toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(inc)}
                            className="p-1.5 text-[#00E576] hover:bg-[#00E576]/10 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(inc.id)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="bg-[#00E576]/10 border border-[#00E576]/20 rounded-lg p-4 flex items-start gap-3">
        <div className="mt-1">
          <AlertCircle size={20} className="text-[#00E576]" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Automated Calculation Status</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {tenant?.settings?.incentive_plan?.type !== 'fixed' 
              ? `System is calculating incentives automatically based on the ${getActivePlanSummary()} plan. You can still post manual records as needed.`
              : "This page is currently for manual incentive management. Automated incentive calculations are available in our customized plans."
            }
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Incentive"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this incentive? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={calculateDelete}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
            >
              Delete Incentive
            </button>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        title="Error"
      >
        <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500">
            <AlertCircle size={32} />
          </div>
          <p className="text-gray-600 dark:text-gray-300">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="px-6 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
