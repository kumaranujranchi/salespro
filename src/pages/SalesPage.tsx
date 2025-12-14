import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatCurrency } from '../utils/format';
import { supabase } from '../lib/supabase';
import { useDialog } from '../contexts/DialogContext';
import { useAuth } from '../contexts/AuthContext';
import { Sale } from '../types/database';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { MultiSelect } from '../components/ui/MultiSelect';
import { KPICard } from '../components/ui/KPICard';
import { TrendingUp, Plus, Wallet, Search, Filter, Calendar, DollarSign, Layers, PieChart, Eye, ChevronDown, ChevronUp, RotateCcw, ArrowUp, ArrowDown, Ban } from 'lucide-react';
import { SalesFormModal } from '../components/sales/SalesFormModal';
import { PaymentManager } from '../components/sales/PaymentManager';
import { SalesDetailsModal } from '../components/sales/SalesDetailsModal';
import { SalesCancellationModal } from '../components/sales/SalesCancellationModal';
import { startOfYear, startOfMonth, endOfMonth, isAfter, isSameMonth, parseISO, format } from 'date-fns';

import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function SalesPage() {
  const { profile } = useAuth();
  const dialog = useDialog();
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<any[]>([]); // Fetch all payments for metrics
  const [loading, setLoading] = useState(true);

  // RBAC Roles
  const isSalesExecutive = profile?.role === 'sales_executive';
  const isTeamLeader = profile?.role === 'team_leader';
  const isAdminOrCRM = ['super_admin', 'admin', 'crm', 'director'].includes(profile?.role || '');
  // Standard users (SE, TL, Director) cannot edit/delete, only View.
  const canEdit = !isSalesExecutive && !isTeamLeader && profile?.role !== 'director';

  // --- Advanced Filtering & Sorting State ---
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    executives: [] as { value: string; label: string }[],
    teamLeaders: [] as { value: string; label: string }[],
    projects: [] as { value: string; label: string }[],
  });

  const [filters, setFilters] = useState({
    executiveId: '',
    teamLeaderId: '',
    dateFrom: '',
    dateTo: '',
    projectIds: [] as string[],
    isRegistryDone: 'all' as 'all' | 'yes' | 'no',
    isAgreementDone: 'all' as 'all' | 'yes' | 'no',
  });

  const [sortConfig, setSortConfig] = useState({
    column: 'sale_date',
    direction: 'desc' as 'asc' | 'desc',
    foreignTable: null as string | null // 'customer', 'project', 'executive'
  });

  // Legacy / UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Load Options for Filters
  useEffect(() => {
    const loadOptions = async () => {
      // 1. Load Projects (Active)
      const { data: projects } = await supabase.from('projects').select('id, name').eq('status', 'active');
      if (projects) {
        setFilterOptions(prev => ({
          ...prev,
          projects: projects.map(p => ({ value: p.id, label: p.name }))
        }));
      }

      // 2. Load Profiles (Execs and TLs)
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
      if (profiles) {
        setFilterOptions(prev => ({
          ...prev,
          executives: profiles.filter(p => p.role === 'sales_executive' || p.role === 'team_leader').map(p => ({ value: p.id, label: p.full_name })),
          teamLeaders: profiles.filter(p => p.role === 'team_leader' || p.role === 'super_admin' || p.role === 'admin').map(p => ({ value: p.id, label: p.full_name }))
        }));
      }
    };

    if (profile) loadOptions();
  }, [profile]);

  // Load Sales with Server-Side Filtering
  const loadSales = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    let query = supabase
      .from('sales')
      .select(`
            *,
            project:project_id(name),
            customer:customer_id(*),
            executive:sales_executive_id!inner(full_name, reporting_manager_id)
        `);

    // 1. Role-Based Access Control (Base Scope)
    // Team Leader logic: See own sales + team's sales
    let teamMemberIds: string[] = [];
    if (isTeamLeader) {
      const { data: subordinates } = await supabase
        .from('profiles')
        .select('id')
        .eq('reporting_manager_id', profile.id);

      if (subordinates) teamMemberIds = subordinates.map(s => s.id);
      teamMemberIds.push(profile.id);

      // If filtering by specific executive, ensure they are in team
      if (filters.executiveId && !teamMemberIds.includes(filters.executiveId)) {
        // User trying to filter outside permission - show only allowed matching or none
        query = query.in('sales_executive_id', teamMemberIds);
      } else if (!filters.executiveId) {
        query = query.in('sales_executive_id', teamMemberIds);
      }
    } else if (isSalesExecutive) {
      // Sales Executive only sees own data
      query = query.eq('sales_executive_id', profile.id);
    }

    // 2. Apply Filters
    if (filters.executiveId && (!isSalesExecutive || filters.executiveId === profile.id)) {
      query = query.eq('sales_executive_id', filters.executiveId);
    }

    if (filters.teamLeaderId && !isSalesExecutive) {
      // Filter by sales where executive's reporting manager is the selected TL
      // We use the joined table 'executive' with !inner
      // Note: 'executive' alias must match select statement
      query = query.eq('executive.reporting_manager_id', filters.teamLeaderId);
    }

    if (filters.dateFrom) {
      query = query.gte('sale_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('sale_date', filters.dateTo);
    }

    if (filters.projectIds.length > 0) {
      query = query.in('project_id', filters.projectIds);
    }

    if (filters.isRegistryDone !== 'all') {
      query = query.eq('is_registry_done', filters.isRegistryDone === 'yes');
    }

    if (filters.isAgreementDone !== 'all') {
      query = query.eq('is_agreement_done', filters.isAgreementDone === 'yes');
    }

    // 3. Sorting
    if (sortConfig.foreignTable) {
      // Supabase orderBy on foreign table is limited. 
      // We might need client-side sort for foreign columns if API doesn't support easy dynamic sort
      // But let's try standard column sort first.
      // If sorting by customer name: 
      if (sortConfig.foreignTable === 'customer') {
        // Basic workaround: fetch mostly sorted, or sort client side. 
        // Supabase JS v2 supports foreign table sort but syntax is specific.
        // We'll fallback to client-sort for foreign columns if needed or just apply default date sort.
      }
    } else {
      query = query.order(sortConfig.column, { ascending: sortConfig.direction === 'asc' });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading sales:', error);
    }

    if (data) {
      // Client-side sort for foreign columns if selected
      let processedData = data;
      if (sortConfig.foreignTable) {
        processedData.sort((a: any, b: any) => {
          const valA = sortConfig.foreignTable === 'customer' ? a.customer?.name :
            sortConfig.foreignTable === 'project' ? a.project?.name :
              sortConfig.foreignTable === 'executive' ? a.executive?.full_name : '';
          const valB = sortConfig.foreignTable === 'customer' ? b.customer?.name :
            sortConfig.foreignTable === 'project' ? b.project?.name :
              sortConfig.foreignTable === 'executive' ? b.executive?.full_name : '';

          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }
      setSales(processedData);
    }
    setLoading(false);
  }, [profile, isTeamLeader, isSalesExecutive, filters, sortConfig]);

  useEffect(() => {
    loadSales();
    loadPayments();
  }, [loadSales]);

  const loadPayments = async () => {
    const { data } = await supabase.from('payments').select('amount, payment_date');
    if (data) setPayments(data);
  };

  const handleSort = (column: string, foreignTable: string | null = null) => {
    setSortConfig(current => ({
      column,
      foreignTable,
      direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDelete = async (id: string) => {
    const confirmed = await dialog.confirm('Are you sure you want to delete this sales record? This will also delete all associated payments.', {
      variant: 'danger',
      confirmText: 'Delete Record',
      title: 'Delete Sale'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
      loadSales();
      loadPayments();
      await dialog.alert('Sale record deleted.', { variant: 'success', title: 'Deleted' });
    } catch (error) {
      console.error('Error deleting sale:', error);
      await dialog.alert('Failed to delete sale record.', { variant: 'danger', title: 'Error' });
    }
  };

  // Handle Quick Time Filter (Top Right)
  const handleQuickTimeFilter = (value: string) => {
    setTimeFilter(value);
    const now = new Date();
    let from = '';
    let to = '';

    if (value === 'this_month') {
      from = format(startOfMonth(now), 'yyyy-MM-dd');
      to = format(endOfMonth(now), 'yyyy-MM-dd');
    } else if (value === 'this_year') {
      from = format(startOfYear(now), 'yyyy-MM-dd');
      to = format(endOfMonth(now), 'yyyy-MM-dd'); // or end of year
    } else {
      // All time
      from = '';
      to = '';
    }
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }));
  };

  const clearAllFilters = () => {
    setFilters({
      executiveId: '',
      teamLeaderId: '',
      dateFrom: '',
      dateTo: '',
      projectIds: [],
      isRegistryDone: 'all',
      isAgreementDone: 'all',
    });
    setSearchQuery('');
    setTimeFilter('all');
  };

  // --- Filtering & Metrics Logic ---

  // --- Client Side Filtering just for Text Search on top of Server Data ---
  const filteredData = useMemo(() => {
    // Note: We already filtered by Date, Role, Project, Status on Server. 
    // This is just for the Search Input filtering local results.
    return sales.filter(sale => {
      // 1. Text Search
      const customerName = (sale as any).customer?.name?.toLowerCase() || '';
      const projectName = (sale as any).project?.name?.toLowerCase() || '';
      const queryLower = searchQuery.toLowerCase();

      const searchMatch = !searchQuery ||
        customerName.includes(queryLower) ||
        projectName.includes(queryLower);

      return searchMatch;
    });
  }, [sales, searchQuery]);

  const metrics = useMemo(() => {
    const now = new Date();
    const currentYearStart = startOfYear(now);

    // 1. Total Sales (Active Only)
    const activeData = filteredData.filter(s => s.metadata?.booking_status !== 'cancelled');
    const totalSalesCount = activeData.length;

    // 2. This Month's Sales (Active)
    const thisMonthSalesCount = sales.filter(s =>
      isSameMonth(parseISO(s.sale_date), now) && s.metadata?.booking_status !== 'cancelled'
    ).length;

    // 3. Total Area Sold (Active)
    const totalArea = activeData.reduce((sum, s) => sum + (Number(s.area_sqft) || 0), 0);

    // 4. Total Revenue (Active)
    const totalRevenue = activeData.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0);

    // 5. Total Payment Received (Based on Filter - matching dates of filtered period)
    /* 
       Note: Payments are separate from sales date. 
       Usually "Total Payment Received" in a period means payments made in that period.
       If filter is 'this_year', we sum payments made this year.
    */
    let relevantPayments = payments;
    if (timeFilter === 'this_month') {
      relevantPayments = payments.filter(p => isSameMonth(parseISO(p.payment_date), now));
    } else if (timeFilter === 'this_year') {
      relevantPayments = payments.filter(p => isAfter(parseISO(p.payment_date), currentYearStart));
    }
    // If 'all', we take all.

    const totalReceived = relevantPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 6. Total Payment Received YTD (For specific 2025 card requirement)
    const totalReceivedYTD = payments
      .filter(p => isAfter(parseISO(p.payment_date), currentYearStart) || p.payment_date === format(currentYearStart, 'yyyy-MM-dd'))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 7. Total Payment Received This Month (For Admin/CRM specialized card)
    const totalReceivedThisMonth = payments
      .filter(p => isSameMonth(parseISO(p.payment_date), now))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalSalesCount,
      thisMonthSalesCount,
      totalArea,
      totalRevenue,
      totalReceived,
      totalReceivedYTD,
      totalReceivedThisMonth
    };
  }, [sales, payments, filteredData, timeFilter]);


  const openEditModal = (sale: Sale) => {
    setSelectedSale(sale);
    setIsFormOpen(true);
  };

  const openPaymentModal = (sale: Sale) => {
    setSelectedSale(sale);
    setIsPaymentOpen(true);
  };

  const openDetailModal = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const openCancelModal = (sale: Sale) => {
    setSelectedSale(sale);
    setIsCancelOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedSale(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0A1C37] dark:text-white mb-1">Sales Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Overview of performance and sales activities</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={timeFilter}
            onChange={(e) => handleQuickTimeFilter(e.target.value)}
            options={[
              { label: 'This Month', value: 'this_month' },
              { label: 'This Year', value: 'this_year' },
              { label: 'All Time', value: 'all' },
            ]}
            className="w-40 h-10"
          />
          {canEdit && (
            <Button variant="gradient" onClick={handleCreateNew} className="w-48 h-10 whitespace-nowrap">
              <Plus size={18} className="mr-2" />
              New Sale
            </Button>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      {/* KPI Grid Split: 2 cards then 3 cards */}
      <div className="space-y-3 md:space-y-4">
        {/* Row 1: 2 Cards */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <KPICard
            title="Total Sales"
            value={metrics.totalSalesCount}
            icon={Layers}
            subtitle={timeFilter.replace('_', ' ')}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <KPICard
            title="This Month"
            value={metrics.thisMonthSalesCount}
            icon={Calendar}
            subtitle="New Bookings"
            iconColor="text-indigo-600"
            iconBgColor="bg-indigo-100"
          />
        </div>

        {/* Row 2: 3 or 4 Cards */}
        <div className={`grid gap-2 md:gap-4 ${isAdminOrCRM ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'}`}>
          <KPICard
            title="Total Area"
            value={metrics.totalArea.toLocaleString()}
            icon={PieChart}
            subtitle="Sq. Ft. Sold"
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
          <KPICard
            title="Revenue"
            value={formatCurrency(metrics.totalRevenue, true)} // Force Cr for aggregate
            icon={TrendingUp}
            subtitle="Total Value"
            formatter={(val) => val} // Just pass string
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <KPICard
            title="Received"
            value={formatCurrency(metrics.totalReceivedYTD, true)} // Force Cr for aggregate
            icon={DollarSign}
            subtitle="Collections (YTD)"
            formatter={(val) => val}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
          />
          {isAdminOrCRM && (
            <KPICard
              title="Collection (Month)"
              value={formatCurrency(metrics.totalReceivedThisMonth, true)}
              icon={Wallet}
              subtitle="This Month"
              formatter={(val) => val}
              iconColor="text-teal-600"
              iconBgColor="bg-teal-100"
            />
          )}
        </div>
      </div>

      {/* Search & List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsFilterExpanded(!isFilterExpanded)}>
              <Filter size={20} className="text-[#1673FF]" />
              <CardTitle className="text-[#0A1C37] dark:text-white select-none">Sales Records</CardTitle>
              {isFilterExpanded ? <ChevronUp size={16} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <Input
                placeholder="Search Customer..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Collapsible Filter Panel */}
          {isFilterExpanded && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Row 1 */}
                {(!isSalesExecutive) && (
                  <Select
                    label="Sales Executive"
                    value={filters.executiveId}
                    onChange={(e) => setFilters(prev => ({ ...prev, executiveId: e.target.value }))}
                    options={[{ value: '', label: 'All Executives' }, ...filterOptions.executives]}
                  />
                )}
                {(!isSalesExecutive && !isTeamLeader) && (
                  <Select
                    label="Team Leader"
                    value={filters.teamLeaderId}
                    onChange={(e) => setFilters(prev => ({ ...prev, teamLeaderId: e.target.value }))}
                    options={[{ value: '', label: 'All Team Leads' }, ...filterOptions.teamLeaders]}
                  />
                )}
                <MultiSelect
                  label="Select Projects"
                  options={filterOptions.projects}
                  value={filters.projectIds}
                  onChange={(val) => setFilters(prev => ({ ...prev, projectIds: val }))}
                  placeholder="All Projects"
                />

                {/* Row 2 - Dates & Toggles */}
                <Input type="date" label="From Date" value={filters.dateFrom} onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))} />
                <Input type="date" label="To Date" value={filters.dateTo} onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))} />

                <Select
                  label="Registry Status"
                  value={filters.isRegistryDone}
                  onChange={(e) => setFilters(prev => ({ ...prev, isRegistryDone: e.target.value as any }))}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'yes', label: 'Done' },
                    { value: 'no', label: 'Pending' }
                  ]}
                />
                <Select
                  label="Agreement Status"
                  value={filters.isAgreementDone}
                  onChange={(e) => setFilters(prev => ({ ...prev, isAgreementDone: e.target.value as any }))}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'yes', label: 'Done' },
                    { value: 'no', label: 'Pending' }
                  ]}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-gray-500 hover:text-red-500">
                  <RotateCcw size={14} className="mr-2" /> Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner size="lg" className="min-h-[400px]" />
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 p-4 rounded-full inline-flex mb-4">
                <Search className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No records found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-medium">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => handleSort('sale_date')}>
                      <div className="flex items-center gap-1">Date {sortConfig.column === 'sale_date' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => handleSort('name', 'customer')}>
                      <div className="flex items-center gap-1">Customer {sortConfig.foreignTable === 'customer' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => handleSort('name', 'project')}>
                      <div className="flex items-center gap-1">Project {sortConfig.foreignTable === 'project' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => handleSort('full_name', 'executive')}>
                      <div className="flex items-center gap-1">Executive {sortConfig.foreignTable === 'executive' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                    </th>
                    <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => handleSort('total_revenue')}>
                      <div className="flex items-center justify-end gap-1">Total Revenue {sortConfig.column === 'total_revenue' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                    </th>
                    <th className="px-4 py-3 text-center">Legal Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((sale: any) => (
                    <tr key={sale.id} className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${sale.metadata?.booking_status === 'cancelled' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        <div className={sale.metadata?.booking_status === 'cancelled' ? 'line-through opacity-60' : ''}>
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </div>
                        {sale.metadata?.booking_status === 'cancelled' && <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">Cancelled</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`font-medium text-[#0A1C37] dark:text-white ${sale.metadata?.booking_status === 'cancelled' ? 'line-through opacity-60' : ''}`}>{sale.customer?.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{sale.customer?.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`text-gray-900 dark:text-gray-200 ${sale.metadata?.booking_status === 'cancelled' ? 'line-through opacity-60' : ''}`}>{sale.project?.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Unit: {sale.unit_number || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{sale.executive?.full_name}</td>
                      <td className={`px-4 py-3 text-right font-bold ${sale.metadata?.booking_status === 'cancelled' ? 'text-gray-400 line-through' : 'text-[#2BA67A]'}`}>
                        {formatCurrency(sale.total_revenue)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col gap-1 items-center">
                          {sale.metadata?.booking_status === 'cancelled' ? (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full w-fit flex items-center gap-1">
                              <Ban size={10} /> Cancelled
                            </span>
                          ) : (
                            <>
                              {sale.is_agreement_done ? (
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full w-fit">Agreement</span>
                              ) : null}
                              {sale.is_registry_done ? (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full w-fit">Registry</span>
                              ) : null}
                              {!sale.is_agreement_done && !sale.is_registry_done && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">Pending</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailModal(sale)}
                            title="View Details"
                            className="text-gray-600 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-white/10"
                          >
                            <Eye size={16} />
                          </Button>

                          {canEdit && (
                            <>
                              {sale.metadata?.booking_status !== 'cancelled' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                  onClick={() => openPaymentModal(sale)}
                                  title="Manage Payments"
                                >
                                  <Wallet size={16} />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Form Modal */}
      <SalesFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadSales}
        editingSale={selectedSale}
      />

      {/* Payment Manager Modal */}
      <PaymentManager
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        sale={selectedSale}
      />

      {/* View Details Modal */}
      <SalesDetailsModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        sale={selectedSale}
        onCancel={openCancelModal}
        onEdit={openEditModal}
        onDelete={(s) => handleDelete(s.id)}
        canEdit={canEdit}
      />

      {/* Cancel Sale Modal */}
      <SalesCancellationModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onSuccess={loadSales}
        sale={selectedSale}
      />
    </div>
  );
}
