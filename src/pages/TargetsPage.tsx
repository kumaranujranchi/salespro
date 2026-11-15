import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from "../lib/reactive";
import { api, Id } from '../lib/api-endpoints';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TargetFormModal } from '../components/targets/TargetFormModal';
import { TargetSettingsModal } from '../components/targets/TargetSettingsModal';
import { Plus, Pencil, Trash2, Target as TargetIcon, Settings2, Layers, Hash, DollarSign, Calendar, UserCheck, TrendingUp, Sparkles } from 'lucide-react';
import { Select } from '../components/ui/Select';
import { isSameMonth, parseISO, startOfYear, endOfYear, eachMonthOfInterval, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { toast } from 'sonner';

export function TargetsPage() {
  const { profile, tenant } = useAuth();
  const dialog = useDialog();

  const targetModel = tenant?.settings?.general?.target_model || 'area';
  const defaultMetric = targetModel === 'units' ? 'units' : targetModel === 'area' ? 'area' : 'revenue';
  const [activeMetric, setActiveMetric] = useState<'area' | 'revenue' | 'units'>(defaultMetric);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);

  // Sync default metric if tenant model changes
  useEffect(() => {
    if (tenant?.settings?.general?.target_model) {
      const model = tenant.settings.general.target_model;
      if (model === 'units' || model === 'area' || model === 'revenue') {
        setActiveMetric(model);
      }
    }
  }, [tenant?.settings?.general?.target_model]);

  const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
  const isExecutive = normalizedRole === 'sales_executive';
  const canManage = ['super_admin', 'admin', 'director', 'team_leader', 'platform_admin'].includes(normalizedRole);

  // Backend queries
  const targets = useQuery(api.targets.listTargets, profile?.tenant_id ? { 
    tenant_id: profile.tenant_id as Id<"tenants">,
    user_id: selectedUserId ? selectedUserId as Id<"profiles"> : undefined,
    year: selectedYear
  } : "skip");

  const sales = useQuery(api.sales.listSales, profile?.tenant_id ? {
    tenant_id: profile.tenant_id as Id<"tenants">,
    executive_id: selectedUserId ? selectedUserId as Id<"profiles"> : undefined
  } : "skip");

  const staff = useQuery(api.profiles.listUsersByTenant, profile?.tenant_id ? {
    tenant_id: profile.tenant_id as Id<"tenants">,
    is_active: true
  } : "skip");

  // Mutations
  const deleteTarget = useMutation(api.targets.deleteTarget);

  const handleDelete = async (id: string | Id<"sales_targets">) => {
    if (!await dialog.confirm('Are you sure you want to delete this target?')) return;
    try {
      await deleteTarget({ id });
      toast.success("Target deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete target");
    }
  };

  const chartData = useMemo(() => {
    if (!targets || !sales) return [];
    
    const months = eachMonthOfInterval({ 
      start: startOfYear(new Date(parseInt(selectedYear), 0, 1)), 
      end: endOfYear(new Date(parseInt(selectedYear), 0, 1)) 
    });

    return months.map(monthDate => {
      const mStr = format(monthDate, 'MMM');
      const mMatch = (d: string) => isSameMonth(parseISO(d), monthDate);
      
      const target = targets.find(t => mMatch(t.start_date));
      const monthSales = sales.filter(s => mMatch(s.sale_date));

      const rawTarget = target ? (
        activeMetric === 'revenue' 
          ? Number(target.target_amount || 0) 
          : activeMetric === 'units' 
          ? Number(target.target_units || 0) 
          : Number(target.target_sqft || 0)
      ) : 0;

      const rawAchievement = activeMetric === 'revenue' 
        ? monthSales.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0)
        : activeMetric === 'units' 
        ? monthSales.length 
        : monthSales.reduce((sum, s) => sum + (Number(s.area_sqft) || 0), 0);

      return {
        month: mStr,
        target: Number(rawTarget) || 0,
        achievement: Number(rawAchievement) || 0
      };
    });
  }, [targets, sales, activeMetric, selectedYear]);

  const annualSummary = useMemo(() => {
    const totalTarget = chartData.reduce((s, c) => s + (Number(c.target) || 0), 0);
    const totalAchieved = chartData.reduce((s, c) => s + (Number(c.achievement) || 0), 0);
    const achievementPercent = totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(1) : '0.0';
    return { totalTarget, totalAchieved, achievementPercent };
  }, [chartData]);

  // Filtered and enriched targets list for table
  const targetList = useMemo(() => {
    if (!targets) return [];
    const validSales = Array.isArray(sales) ? sales : [];

    return targets
      .filter(t => {
        if (!selectedYear) return true;
        return t.start_date && t.start_date.startsWith(selectedYear);
      })
      .map(t => {
        const tDate = parseISO(t.start_date);
        const memberSales = validSales.filter(s => {
          const matchUser = (String(s.sales_executive_id || s.executive_id) === String(t.user_id));
          return matchUser && isSameMonth(parseISO(s.sale_date), tDate);
        });

        const achievedSqft = memberSales.reduce((sum, s) => sum + (Number(s.area_sqft) || 0), 0);
        const achievedUnits = memberSales.length;
        const achievedRevenue = memberSales.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0);

        const sqftTarget = Number(t.target_sqft) || 0;
        const unitsTarget = Number(t.target_units) || 0;
        const revenueTarget = Number(t.target_amount) || 0;

        let primaryPercent = 0;
        if (activeMetric === 'revenue' && revenueTarget > 0) {
          primaryPercent = (achievedRevenue / revenueTarget) * 100;
        } else if (activeMetric === 'units' && unitsTarget > 0) {
          primaryPercent = (achievedUnits / unitsTarget) * 100;
        } else if (activeMetric === 'area' && sqftTarget > 0) {
          primaryPercent = (achievedSqft / sqftTarget) * 100;
        } else if (revenueTarget > 0) {
          primaryPercent = (achievedRevenue / revenueTarget) * 100;
        } else if (sqftTarget > 0) {
          primaryPercent = (achievedSqft / sqftTarget) * 100;
        } else if (unitsTarget > 0) {
          primaryPercent = (achievedUnits / unitsTarget) * 100;
        }

        return {
          ...t,
          monthLabel: format(tDate, 'MMMM yyyy'),
          sqftTarget,
          unitsTarget,
          revenueTarget,
          achievedSqft,
          achievedUnits,
          achievedRevenue,
          percent: primaryPercent.toFixed(1)
        };
      });
  }, [targets, sales, selectedYear, activeMetric]);

  const targetModelLabel = 
    targetModel === 'units' ? 'Units (Count)' :
    targetModel === 'revenue' ? 'Revenue (₹)' :
    targetModel === 'hybrid' ? 'Multi-Metric (Hybrid)' : 'Area (Sq Ft)';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Target Management</h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <Sparkles size={12} /> Model: {targetModelLabel}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Customize, assign, and track team performance across Area, Units, and Revenue</p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSettingsModalOpen(true)}
              className="gap-2 border-gray-300 dark:border-white/10"
              title="Customize Organization Target Model"
            >
              <Settings2 size={16} />
              <span className="hidden sm:inline">Customize Model</span>
            </Button>
            <Button
              onClick={() => { setEditingTarget(null); setIsModalOpen(true); }}
              className="gap-1.5 !bg-emerald-600 hover:!bg-emerald-700 !text-white"
            >
              <Plus size={18} />
              <span>Assign Target</span>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-3.5 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {!isExecutive ? (
                <Select
                  label="Member"
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  options={[{ label: 'All Team Members', value: '' }, ...(staff?.map(s => ({ label: s.full_name, value: s._id || s.id })) || [])]}
                  className="w-full sm:w-56"
                />
              ) : <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-xl border text-xs font-medium flex items-center justify-center">Your Targets</div>}
              <Select
                label="Year"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                options={[2024, 2025, 2026, 2027].map(y => ({ label: y.toString(), value: y.toString() }))}
                className="w-full sm:w-28"
              />
            </div>

            {/* Metric Switcher - Native Segmented Control */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveMetric('revenue')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeMetric === 'revenue'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <DollarSign size={13} />
                <span>Revenue</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('area')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeMetric === 'area'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span>Area</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('units')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeMetric === 'units'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Hash size={13} />
                <span>Units</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-600" />
                Performance Chart ({activeMetric === 'revenue' ? 'Revenue' : activeMetric === 'area' ? 'Area' : 'Units'})
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
               {(!targets || !sales) ? <LoadingSpinner/> : (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="month" />
                       <YAxis
                         tickFormatter={(v: number) => {
                           if (activeMetric === 'revenue') {
                             if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                             if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                             if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
                             return `₹${v}`;
                           }
                           if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                           return String(v);
                         }}
                       />
                       <Tooltip
                         formatter={(value: any, name: string) => [
                           `${activeMetric === 'revenue' ? '₹' : ''}${Number(value || 0).toLocaleString('en-IN')}${activeMetric === 'area' ? ' Sq Ft' : activeMetric === 'units' ? ' Units' : ''}`,
                           name
                         ]}
                       />
                       <Legend />
                       <Bar dataKey="target" name="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="achievement" name="Achieved" fill="#00E576" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
               )}
            </CardContent>
         </Card>

         <Card>
            <CardHeader><CardTitle className="text-base font-bold">Annual Summary ({selectedYear})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Total Target {activeMetric === 'area' ? '(Sq Ft)' : activeMetric === 'units' ? '(Units)' : '(Revenue)'}
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {activeMetric === 'revenue' ? '₹' : ''}
                      {annualSummary.totalTarget.toLocaleString('en-IN')}
                      {activeMetric === 'area' ? ' Sq Ft' : activeMetric === 'units' ? ' Units' : ''}
                    </p>
                </div>
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                      Total Achieved {activeMetric === 'area' ? '(Sq Ft)' : activeMetric === 'units' ? '(Units)' : '(Revenue)'}
                    </p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {activeMetric === 'revenue' ? '₹' : ''}
                      {annualSummary.totalAchieved.toLocaleString('en-IN')}
                      {activeMetric === 'area' ? ' Sq Ft' : activeMetric === 'units' ? ' Units' : ''}
                    </p>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">
                      Achievement Rate: <strong className="font-bold">{annualSummary.achievementPercent}%</strong>
                    </p>
                </div>
            </CardContent>
         </Card>
      </div>

      {/* Assigned Targets Management Table / Mobile Cards */}
      <Card>
        <CardHeader className="p-3.5 sm:p-5 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                <UserCheck size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    Assigned Targets
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                    {selectedYear}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 truncate hidden sm:block">
                  Individual member monthly goals across customizable metrics
                </p>
              </div>
            </div>

            <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {targetList.length} Targets
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2 sm:hidden leading-relaxed">
            Individual monthly goals across customizable metrics
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {targetList.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3.5 shadow-sm border border-emerald-100/80 dark:border-emerald-900/30">
                <TargetIcon size={28} strokeWidth={2.2} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                No Targets Set for {selectedYear}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1.5 leading-relaxed">
                Configure monthly revenue, area, or unit goals to track sales team achievements.
              </p>
              {canManage && (
                <div className="mt-4 pt-1">
                  <Button
                    size="sm"
                    onClick={() => { setEditingTarget(null); setIsModalOpen(true); }}
                    className="w-full sm:w-auto px-5 py-2 !bg-emerald-600 hover:!bg-emerald-700 active:scale-[0.98] !text-white text-xs font-semibold rounded-xl shadow-sm inline-flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus size={16} />
                    <span>Assign First Target</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View (Hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-white/10">
                    <tr>
                      <th className="px-5 py-3">Team Member</th>
                      <th className="px-5 py-3">Month</th>
                      <th className="px-5 py-3">Configured Target</th>
                      <th className="px-5 py-3">Actual Achieved</th>
                      <th className="px-5 py-3">Completion</th>
                      {canManage && <th className="px-5 py-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {targetList.map((t: any) => (
                      <tr key={t._id || t.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-gray-900 dark:text-white">{t.user_name || 'Team Member'}</div>
                          <div className="text-[11px] text-gray-400 capitalize">{t.user_role?.replace('_', ' ') || 'Sales Executive'}</div>
                        </td>

                        <td className="px-5 py-3.5 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {t.monthLabel}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {t.sqftTarget > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                                <Layers size={11} /> {t.sqftTarget.toLocaleString('en-IN')} Sq Ft
                              </span>
                            )}
                            {t.unitsTarget > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40">
                                <Hash size={11} /> {t.unitsTarget} Units
                              </span>
                            )}
                            {t.revenueTarget > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                                <DollarSign size={11} /> ₹{t.revenueTarget.toLocaleString('en-IN')}
                              </span>
                            )}
                            {t.sqftTarget === 0 && t.unitsTarget === 0 && t.revenueTarget === 0 && (
                              <span className="text-xs text-gray-400 italic">Not set</span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                            {t.sqftTarget > 0 && (
                              <span>{t.achievedSqft.toLocaleString('en-IN')} Sq Ft</span>
                            )}
                            {t.unitsTarget > 0 && (
                              <span>{t.achievedUnits} Units</span>
                            )}
                            {t.revenueTarget > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">₹{t.achievedRevenue.toLocaleString('en-IN')}</span>
                            )}
                            {t.sqftTarget === 0 && t.unitsTarget === 0 && t.revenueTarget === 0 && (
                              <span>-</span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              Number(t.percent) >= 100 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : Number(t.percent) >= 50
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300'
                            }`}>
                              {t.percent}%
                            </span>
                          </div>
                        </td>

                        {canManage && (
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditingTarget(t); setIsModalOpen(true); }}
                                title="Edit Target"
                                className="text-gray-500 hover:text-emerald-600"
                              >
                                <Pencil size={15} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(t._id || t.id)}
                                title="Delete Target"
                                className="text-gray-500 hover:text-rose-600"
                              >
                                <Trash2 size={15} />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Native App Card List (Shown only on mobile) */}
              <div className="block md:hidden p-3 space-y-3">
                {targetList.map((t: any) => {
                  const percentNum = Number(t.percent) || 0;
                  const isComplete = percentNum >= 100;
                  const isHalfway = percentNum >= 50;

                  return (
                    <div
                      key={t._id || t.id}
                      className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5 space-y-3 shadow-2xs"
                    >
                      {/* Top Member & Month Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {t.user_name || 'Team Member'}
                          </div>
                          <div className="text-[11px] text-slate-500 capitalize mt-0.5 truncate">
                            {t.user_role?.replace('_', ' ') || 'Sales Executive'}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/5">
                            {t.monthLabel}
                          </span>
                        </div>
                      </div>

                      {/* Native Progress Bar & Completion % */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Completion Rate
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isComplete
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : isHalfway
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:text-gray-300'
                          }`}>
                            {t.percent}% Achieved
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isComplete ? 'bg-emerald-500' : isHalfway ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(percentNum, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Target vs Achieved Micro-Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/90 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-white/5">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Target</span>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 space-y-0.5">
                            {t.revenueTarget > 0 && <div>₹{t.revenueTarget.toLocaleString('en-IN')}</div>}
                            {t.sqftTarget > 0 && <div>{t.sqftTarget.toLocaleString('en-IN')} Sq Ft</div>}
                            {t.unitsTarget > 0 && <div>{t.unitsTarget} Units</div>}
                            {t.revenueTarget === 0 && t.sqftTarget === 0 && t.unitsTarget === 0 && <span className="text-slate-400 italic">Not set</span>}
                          </div>
                        </div>

                        <div className="bg-white/90 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-white/5">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Achieved</span>
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 space-y-0.5">
                            {t.revenueTarget > 0 && <div>₹{t.achievedRevenue.toLocaleString('en-IN')}</div>}
                            {t.sqftTarget > 0 && <div>{t.achievedSqft.toLocaleString('en-IN')} Sq Ft</div>}
                            {t.unitsTarget > 0 && <div>{t.achievedUnits} Units</div>}
                            {t.revenueTarget === 0 && t.sqftTarget === 0 && t.unitsTarget === 0 && <span className="text-slate-400">-</span>}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      {canManage && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-white/5">
                          <button
                            type="button"
                            onClick={() => { setEditingTarget(t); setIsModalOpen(true); }}
                            className="flex-1 py-1.5 px-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Pencil size={13} /> Edit Target
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t._id || t.id)}
                            className="py-1.5 px-2.5 text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Delete Target"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <TargetFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
        editingTarget={editingTarget}
      />

      <TargetSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
