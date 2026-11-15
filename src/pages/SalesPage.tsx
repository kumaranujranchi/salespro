import { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/format';
import { useQuery, useMutation } from "../lib/reactive";
import { api, Id } from '../lib/api-endpoints';
import { useDialog } from '../contexts/DialogContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { KPICard } from '../components/ui/KPICard';
import { TrendingUp, Plus, Wallet, Search, Filter, Calendar, DollarSign, Layers, PieChart, Eye, Edit, ChevronDown, ChevronUp, RotateCcw, ArrowUp, ArrowDown, Ban, CreditCard } from 'lucide-react';
import { SalesFormModal } from '../components/sales/SalesFormModal';
import { PaymentManager } from '../components/sales/PaymentManager';
import { SalesDetailsModal } from '../components/sales/SalesDetailsModal';
import { SalesCancellationModal } from '../components/sales/SalesCancellationModal';
import { startOfYear, startOfMonth, isSameMonth, parseISO, format } from 'date-fns';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { toast } from 'sonner';

export function SalesPage() {
  const { profile } = useAuth();
  const dialog = useDialog();
  
  const [activeMetric, setActiveMetric] = useState<'area' | 'revenue' | 'units'>('revenue');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // States for modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  // Mobile collapsible cards state
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const toggleSaleExpand = (id: string) => {
    setExpandedSaleId(prev => (prev === id ? null : id));
  };

  const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
  const canViewAllSales = ['super_admin', 'admin', 'director', 'platform_admin', 'sales_manager'].includes(normalizedRole);
  const [scope, setScope] = useState<'all' | 'my'>(canViewAllSales ? 'all' : 'my');
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string>('all');

  const effectiveExecutiveId = useMemo(() => {
    if (!canViewAllSales) {
      return (profile?.id || (profile as any)?._id) as string;
    }
    if (scope === 'my') {
      return (profile?.id || (profile as any)?._id) as string;
    }
    if (selectedExecutiveId !== 'all') {
      return selectedExecutiveId;
    }
    return undefined;
  }, [canViewAllSales, scope, selectedExecutiveId, profile]);

  // Backend queries
  const sales = useQuery(api.sales.listSales, profile?.tenant_id ? { 
    tenant_id: profile.tenant_id as Id<"tenants">,
    executive_id: effectiveExecutiveId,
    scope: scope
  } : "skip");

  const payments = useQuery(api.payments.listPayments, profile?.tenant_id ? {
    tenant_id: profile.tenant_id as Id<"tenants">,
    executive_id: effectiveExecutiveId,
    scope: scope
  } : "skip");

  const projects = useQuery(api.projects.listRunningProjects, profile?.tenant_id ? {
    tenant_id: profile.tenant_id as Id<"tenants">
  } : "skip");

  const staff = useQuery(api.profiles.listUsersByTenant, (profile?.tenant_id && canViewAllSales) ? {
    tenant_id: profile.tenant_id as Id<"tenants">,
    is_active: true
  } : "skip");

  const deleteSale = useMutation(api.sales.deleteSale);

  const handleDelete = async (sale: any) => {
    setIsDetailOpen(false);
    if (!await dialog.confirm('Delete this sale record?')) return;
    try {
      await deleteSale({ id: sale._id });
      toast.success('Sale record deleted successfully.');
    } catch {
      toast.error('Failed to delete sale record.');
    }
  };

  const handleEdit = (sale: any) => {
    setIsDetailOpen(false);
    setSelectedSale(sale);
    setIsFormOpen(true);
  };

  const handleCancelSale = (sale: any) => {
    setIsDetailOpen(false);
    setSelectedSale(sale);
    setIsCancelOpen(true);
  };

  const canEdit = profile?.role === 'super_admin' || 
    profile?.role === 'admin' || 
    profile?.role === 'director' || 
    profile?.role === 'sales_manager' || 
    profile?.role === 'team_leader' || 
    (profile as any)?.role_details?.permissions?.menu?.sales === 'edit';

  // Safe date helper
  const safeFormatDate = (dateStr: any) => {
    if (!dateStr) return 'N/A';
    try {
      const parsed = parseISO(dateStr);
      if (isNaN(parsed.getTime())) {
        const fallback = new Date(dateStr);
        if (isNaN(fallback.getTime())) return 'N/A';
        return format(fallback, 'dd/MM/yyyy');
      }
      return format(parsed, 'dd/MM/yyyy');
    } catch {
      return 'N/A';
    }
  };

  const safeIsSameMonth = (dateStr: any, compareDate: Date) => {
    if (!dateStr) return false;
    try {
      const parsed = parseISO(dateStr);
      if (isNaN(parsed.getTime())) {
        const fallback = new Date(dateStr);
        if (isNaN(fallback.getTime())) return false;
        return isSameMonth(fallback, compareDate);
      }
      return isSameMonth(parsed, compareDate);
    } catch {
      return false;
    }
  };

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter(s => {
      const matchSearch = !searchQuery || 
        String(s.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(s.project?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [sales, searchQuery]);

  const metrics = useMemo(() => {
    if (!sales || !payments) return { totalSales: 0, thisMonth: 0, totalArea: 0, totalRevenue: 0, totalReceived: 0 };
    const now = new Date();
    const activeSales = sales.filter(s => s.status !== 'cancelled');
    const activeSaleIds = new Set(activeSales.map(s => String(s._id || s.id)));
    const userPayments = payments.filter((p: any) => activeSaleIds.has(String(p.sale_id)));
    
    return {
      totalSales: activeSales.length,
      thisMonth: activeSales.filter(s => safeIsSameMonth(s.sale_date, now)).length,
      totalArea: activeSales.reduce((sum, s) => sum + (Number(s.area_sqft) || 0), 0),
      totalRevenue: activeSales.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0),
      totalReceived: userPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
    };
  }, [sales, payments]);

  if (!sales || !payments) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-gray-100 dark:border-white/10 sm:border-0 sm:pb-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Sales Dashboard</h1>
            {!canViewAllSales && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                My Sales
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            {canViewAllSales
              ? (scope === 'my' ? 'Showing your personal bookings and collection history' : 'Manage company bookings and collection history')
              : 'Manage your personal bookings and collection history'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {canViewAllSales && (
            <div className="inline-flex rounded-xl bg-gray-100 dark:bg-white/5 p-1 border border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => { setScope('all'); setSelectedExecutiveId('all'); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  scope === 'all' && selectedExecutiveId === 'all'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All Sales
              </button>
              <button
                type="button"
                onClick={() => { setScope('my'); setSelectedExecutiveId('all'); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  scope === 'my'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                My Sales
              </button>
            </div>
          )}
          <Button variant="gradient" onClick={() => { setSelectedSale(null); setIsFormOpen(true); }} className="self-start sm:self-auto">
            <Plus size={18} className="mr-2"/> New Sale
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard title="Total Sales" value={metrics.totalSales} icon={Layers} iconColor="text-blue-600" iconBgColor="bg-blue-100" />
        <KPICard title="This Month" value={metrics.thisMonth} icon={Calendar} iconColor="text-indigo-600" iconBgColor="bg-indigo-100" />
        <KPICard title="Total Area" value={metrics.totalArea.toLocaleString() + ' Sq Ft'} icon={PieChart} iconColor="text-orange-600" iconBgColor="bg-orange-100" />
        <KPICard title="Revenue" value={formatCurrency(metrics.totalRevenue)} icon={TrendingUp} iconColor="text-green-600" iconBgColor="bg-green-100" />
      </div>

      <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center gap-2">
                 <CardTitle>Sales Records</CardTitle>
                 <span className="text-xs text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full font-medium">
                   {filteredSales.length} {filteredSales.length === 1 ? 'Record' : 'Records'}
                 </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                 {canViewAllSales && scope === 'all' && staff && staff.length > 0 && (
                   <select
                     value={selectedExecutiveId}
                     onChange={e => setSelectedExecutiveId(e.target.value)}
                     className="text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="all">All Executives</option>
                     {staff.map((u: any) => (
                       <option key={u._id || u.id} value={u._id || u.id}>
                         {u.full_name || u.name}
                       </option>
                     ))}
                   </select>
                 )}
                 <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input placeholder="Search customer or project..." className="pl-9 text-xs w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                 </div>
              </div>
           </div>
        </CardHeader>
        <CardContent>
           {/* Desktop Table View (Hidden on mobile) */}
           <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                    <tr>
                       <th className="px-4 py-3">Date</th>
                       <th className="px-4 py-3">Customer</th>
                       <th className="px-4 py-3">Project</th>
                       {canViewAllSales && scope === 'all' && <th className="px-4 py-3">Executive</th>}
                       <th className="px-4 py-3 text-right">Revenue</th>
                       <th className="px-4 py-3 text-center">Status</th>
                       <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {filteredSales.map(sale => (
                       <tr key={sale._id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-4 py-3">{safeFormatDate(sale.sale_date)}</td>
                          <td className="px-4 py-3">
                             <div className="font-medium">{sale.customer?.name}</div>
                             <div className="text-xs text-gray-500">{sale.customer?.phone}</div>
                          </td>
                          <td className="px-4 py-3">
                             <div>{sale.project?.name}</div>
                             <div className="text-xs text-gray-500">Unit: {sale.unit_number}</div>
                          </td>
                          {canViewAllSales && scope === 'all' && (
                             <td className="px-4 py-3">
                                <div className="font-medium text-xs text-gray-700 dark:text-gray-300">
                                   {sale.executive_name || sale.sales_executive?.name || 'Assigned Executive'}
                                </div>
                             </td>
                          )}
                          <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(sale.total_revenue)}</td>
                          <td className="px-4 py-3 text-center">
                             <span className={`px-2 py-1 rounded-full text-xs ${sale.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {(sale.status || 'Booked').toUpperCase()}
                             </span>
                          </td>
                           <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                 {canEdit && (
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(sale)} title="Edit & Update Sale" className="text-emerald-600 dark:text-emerald-400"><Edit size={16}/></Button>
                                 )}
                                 <Button variant="ghost" size="sm" onClick={() => { setSelectedSale(sale); setIsDetailOpen(true); }} title="View Details"><Eye size={16}/></Button>
                                 <Button variant="ghost" size="sm" onClick={() => { setSelectedSale(sale); setIsPaymentOpen(true); }} title="Manage Payments" className="text-blue-600 dark:text-blue-400"><CreditCard size={16}/></Button>
                              </div>
                           </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Mobile Collapsible Cards View (Shown only on mobile) */}
           <div className="block md:hidden">
             {filteredSales.length === 0 ? (
               <div className="py-10 px-4 text-center text-gray-400">
                 <p className="font-medium text-sm text-gray-600 dark:text-gray-300">No sales records found.</p>
                 <p className="text-xs text-gray-400 mt-1">Adjust search query or create a new sale.</p>
               </div>
             ) : (
               <div className="divide-y divide-gray-100 dark:divide-white/5 -mx-4 -my-4">
                 {filteredSales.map(sale => {
                   const sId = String(sale._id || sale.id);
                   const isExpanded = expandedSaleId === sId;

                   return (
                     <div
                       key={sId}
                       onClick={() => toggleSaleExpand(sId)}
                       className="p-3.5 space-y-2.5 transition-colors cursor-pointer hover:bg-slate-50/70 dark:hover:bg-white/5 active:bg-slate-100/60 dark:active:bg-white/10"
                     >
                       {/* Top Row: Customer & Revenue */}
                       <div className="flex items-start justify-between gap-2">
                         <div className="min-w-0 flex-1">
                           <div className="flex items-center gap-1.5">
                             <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                               {sale.customer?.name || 'Customer'}
                             </span>
                             <span className="text-slate-400 shrink-0">
                               {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                             </span>
                           </div>
                           <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                             <span className="truncate">{sale.project?.name || 'Project'}</span>
                             <span>•</span>
                             <span className="font-medium text-slate-700 dark:text-slate-300 shrink-0">Unit: {sale.unit_number || 'N/A'}</span>
                           </div>
                           {canViewAllSales && scope === 'all' && (
                             <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                               Executive: <span className="font-medium text-slate-700 dark:text-slate-200">{sale.executive_name || sale.sales_executive?.name || 'Executive'}</span>
                             </div>
                           )}
                           {sale.customer?.phone && (
                             <div className="text-[11px] text-gray-400 mt-0.5">
                               {sale.customer?.phone}
                             </div>
                           )}
                         </div>

                         <div className="text-right shrink-0">
                           <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                             {formatCurrency(sale.total_revenue)}
                           </div>
                           <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase mt-1 ${
                             sale.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                           }`}>
                             {(sale.status || 'Booked').toUpperCase()}
                           </span>
                         </div>
                       </div>

                       {/* Quick Info Bar */}
                       <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-white/5 px-2.5 py-1.5 rounded-lg">
                         <span>Date: <strong className="text-slate-700 dark:text-slate-200">{safeFormatDate(sale.sale_date)}</strong></span>
                         {sale.area_sqft ? (
                           <span>Area: <strong className="text-slate-700 dark:text-slate-200">{Number(sale.area_sqft).toLocaleString()} Sq Ft</strong></span>
                         ) : null}
                       </div>

                       {/* Collapsible Expanded Details */}
                       {isExpanded && (
                         <div
                           onClick={(e) => e.stopPropagation()}
                           className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-1.5 text-xs text-gray-600 dark:text-gray-300 bg-slate-50/50 dark:bg-white/5 p-2.5 rounded-lg"
                         >
                           {sale.rate_per_sqft && (
                             <div className="flex justify-between">
                               <span className="text-gray-400">Rate / Sq Ft:</span>
                               <span className="font-medium">{formatCurrency(sale.rate_per_sqft)}</span>
                             </div>
                           )}
                           {sale.customer?.email && (
                             <div className="flex justify-between">
                               <span className="text-gray-400">Email:</span>
                               <span className="font-medium truncate max-w-[200px]">{sale.customer?.email}</span>
                             </div>
                           )}
                           {sale.co_applicant?.name && (
                             <div className="flex justify-between">
                               <span className="text-gray-400">Co-Applicant:</span>
                               <span className="font-medium">{sale.co_applicant.name} ({sale.co_applicant.relationship || 'Co-Applicant'})</span>
                             </div>
                           )}
                           {sale.created_by_name && (
                             <div className="flex justify-between">
                               <span className="text-gray-400">Booked By:</span>
                               <span className="font-medium">{sale.created_by_name}</span>
                             </div>
                           )}
                         </div>
                       )}

                       {/* Mobile Action Buttons */}
                       <div className="flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                         {canEdit && (
                           <button
                             type="button"
                             onClick={() => handleEdit(sale)}
                             className="flex-1 py-1.5 px-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1"
                           >
                             <Edit size={13} /> Edit
                           </button>
                         )}

                         <button
                           type="button"
                           onClick={() => { setSelectedSale(sale); setIsDetailOpen(true); }}
                           className="flex-1 py-1.5 px-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                         >
                           <Eye size={13} /> Details
                         </button>

                         <button
                           type="button"
                           onClick={() => { setSelectedSale(sale); setIsPaymentOpen(true); }}
                           className="flex-1 py-1.5 px-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg transition-colors flex items-center justify-center gap-1"
                         >
                           <CreditCard size={13} /> Payments
                         </button>

                         <button
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             toggleSaleExpand(sId);
                           }}
                           className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                           aria-label={isExpanded ? "Collapse details" : "Expand details"}
                         >
                           {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                         </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
           </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <SalesFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={() => {}} editingSale={selectedSale} />
      )}
      {isPaymentOpen && selectedSale && (
        <PaymentManager isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} sale={selectedSale} canEdit={canEdit} />
      )}
      {isDetailOpen && selectedSale && (
        <SalesDetailsModal 
           isOpen={isDetailOpen} 
           onClose={() => setIsDetailOpen(false)} 
           sale={selectedSale}
           onEdit={handleEdit}
           onCancel={handleCancelSale}
           onDelete={handleDelete}
           canEdit={canEdit}
        />
      )}
      {isCancelOpen && selectedSale && (
        <SalesCancellationModal 
           isOpen={isCancelOpen} 
           onClose={() => setIsCancelOpen(false)} 
           sale={selectedSale}
           onSuccess={() => setIsCancelOpen(false)} 
        />
      )}
    </div>
  );
}
