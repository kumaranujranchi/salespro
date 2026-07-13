import { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/format';
import { useQuery, useMutation } from "convex/react";
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useDialog } from '../contexts/DialogContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { KPICard } from '../components/ui/KPICard';
import { TrendingUp, Plus, Wallet, Search, Filter, Calendar, DollarSign, Layers, PieChart, Eye, ChevronDown, ChevronUp, RotateCcw, ArrowUp, ArrowDown, Ban, CreditCard } from 'lucide-react';
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

  // Convex Queries
  const sales = useQuery(api.sales.listSales, profile?.tenant_id ? { 
    tenant_id: profile.tenant_id as Id<"tenants"> 
  } : "skip");

  const payments = useQuery(api.payments.listPayments, profile?.tenant_id ? {
    tenant_id: profile.tenant_id as Id<"tenants">
  } : "skip");

  const projects = useQuery(api.projects.listRunningProjects, profile?.tenant_id ? {
    tenant_id: profile.tenant_id as Id<"tenants">
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
    if (!filteredSales || !payments) return { totalSales: 0, thisMonth: 0, totalArea: 0, totalRevenue: 0, totalReceived: 0 };
    const now = new Date();
    const activeSales = filteredSales.filter(s => s.status !== 'cancelled');
    
    return {
      totalSales: activeSales.length,
      thisMonth: activeSales.filter(s => safeIsSameMonth(s.sale_date, now)).length,
      totalArea: activeSales.reduce((sum, s) => sum + (Number(s.area_sqft) || 0), 0),
      totalRevenue: activeSales.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0),
      totalReceived: payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    };
  }, [filteredSales, payments]);

  if (!sales || !payments) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Dashboard</h1>
          <p className="text-gray-500">Manage bookings and collection history</p>
        </div>
        <Button variant="gradient" onClick={() => { setSelectedSale(null); setIsFormOpen(true); }}><Plus size={18} className="mr-2"/> New Sale</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Sales" value={metrics.totalSales} icon={Layers} iconColor="text-blue-600" iconBgColor="bg-blue-100" />
        <KPICard title="This Month" value={metrics.thisMonth} icon={Calendar} iconColor="text-indigo-600" iconBgColor="bg-indigo-100" />
        <KPICard title="Total Area" value={metrics.totalArea.toLocaleString() + ' Sq Ft'} icon={PieChart} iconColor="text-orange-600" iconBgColor="bg-orange-100" />
        <KPICard title="Revenue" value={formatCurrency(metrics.totalRevenue)} icon={TrendingUp} iconColor="text-green-600" iconBgColor="bg-green-100" />
      </div>

      <Card>
        <CardHeader>
           <div className="flex justify-between items-center">
              <CardTitle>Sales Records</CardTitle>
              <div className="relative w-72">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <Input placeholder="Search customer or project..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
           </div>
        </CardHeader>
        <CardContent>
           <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                    <tr>
                       <th className="px-4 py-3">Date</th>
                       <th className="px-4 py-3">Customer</th>
                       <th className="px-4 py-3">Project</th>
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
                          <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(sale.total_revenue)}</td>
                          <td className="px-4 py-3 text-center">
                             <span className={`px-2 py-1 rounded-full text-xs ${sale.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {(sale.status || 'Booked').toUpperCase()}
                             </span>
                          </td>
                           <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                 <Button variant="ghost" size="sm" onClick={() => { setSelectedSale(sale); setIsDetailOpen(true); }} title="View Details"><Eye size={16}/></Button>
                                 <Button variant="ghost" size="sm" onClick={() => { setSelectedSale(sale); setIsPaymentOpen(true); }} title="Manage Payments" className="text-blue-600 dark:text-blue-400"><CreditCard size={16}/></Button>
                              </div>
                           </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </CardContent>
      </Card>

      <SalesFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={() => {}} editingSale={selectedSale} />
      <PaymentManager isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} sale={selectedSale} canEdit={canEdit} />
      <SalesDetailsModal 
         isOpen={isDetailOpen} 
         onClose={() => setIsDetailOpen(false)} 
         sale={selectedSale}
         onEdit={handleEdit}
         onCancel={handleCancelSale}
         onDelete={handleDelete}
         canEdit={canEdit}
      />
      <SalesCancellationModal 
         isOpen={isCancelOpen} 
         onClose={() => setIsCancelOpen(false)} 
         sale={selectedSale}
         onSuccess={() => setIsCancelOpen(false)} 
      />
    </div>
  );
}
