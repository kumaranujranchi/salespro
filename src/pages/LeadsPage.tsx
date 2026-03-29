import { useState, useEffect, Fragment } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { useToast } from '../contexts/ToastContext';
import { LeadWithRelations } from '../types/database';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ToggleSwitchWithDescription } from '../components/ui/ToggleSwitch';
import { LeadFormModal } from '../components/crm/LeadFormModal';
import { LeadDetailModal } from '../components/crm/LeadDetailModal';
import { BulkUploadModal } from '../components/crm/BulkUploadModal';
import { AssignLeadModal } from '../components/crm/AssignLeadModal';
import { BulkStatusModal } from '../components/crm/BulkStatusModal';
import { BulkProjectModal } from '../components/crm/BulkProjectModal';
import { ActionMenu } from '../components/ui/ActionMenu';
import {
  Users, Plus, Phone, Mail, MapPin,
  TrendingUp, TrendingDown, Minus, Search, Download, Upload,
  UserPlus, RefreshCw, Trash2, Building, ChevronDown, ChevronLeft, ChevronRight, Eye, Edit, Copy
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AnimatePresence, motion } from 'framer-motion';

export function LeadsPage() {
  const { profile } = useAuth();
  const dialog = useDialog();
  const toast = useToast();

  // Convex Mutations
  const deleteLeadMutation = useMutation(api.leads.deleteLead);
  const bulkDeleteLeadsMutation = useMutation(api.leads.bulkDeleteLeads);

  // State Management
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadWithRelations | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  const [isCRMActive, setIsCRMActive] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [executiveFilter, setExecutiveFilter] = useState<string>('all');
  const [teamLeaderFilter, setTeamLeaderFilter] = useState<string>('all');
  const [showOnlyMyLeads, setShowOnlyMyLeads] = useState(
    profile?.role === 'sales_executive'
  );

  // Fetch Leads using Convex
  const leadsData = useQuery(api.leads.listLeadsByTenant, 
    profile?.tenant_id ? { 
      tenant_id: profile.tenant_id as Id<"tenants">,
      showOnlyMyLeads,
      profileId: profile.id as Id<"profiles">
    } : "skip"
  );

  const leads = (leadsData || []) as LeadWithRelations[];
  const loading = leadsData === undefined;

  // Permissions
  const canCreateLead = ['super_admin', 'admin', 'team_leader', 'sales_executive'].includes(profile?.role || '');
  const canViewAllLeads = ['super_admin', 'admin', 'team_leader', 'director'].includes(profile?.role || '');

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, scoreFilter, executiveFilter, teamLeaderFilter, showOnlyMyLeads]);

  const handleCreateLead = () => {
    setSelectedLead(null);
    setIsFormModalOpen(true);
  };

  const handleEditLead = (lead: LeadWithRelations) => {
    setSelectedLead(lead);
    setIsFormModalOpen(true);
  };

  const handleViewDetails = (lead: LeadWithRelations) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const dataToExport = leads.map(lead => ({
      'Lead ID': lead.lead_id,
      'Date': new Date(lead.lead_date).toLocaleDateString(),
      'Customer Name': lead.customer_name,
      'Mobile': lead.mobile,
      'Email': lead.email || '',
      'City': lead.city || '',
      'Project': lead.project?.name || '',
      'Budget': lead.budget_range || '',
      'Purpose': lead.purpose || '',
      'Status': lead.lead_status,
      'Score': lead.lead_score,
      'Executive': lead.sales_executive?.full_name || '',
      'Follow-ups': lead.followup_count
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, `Leads_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleFormClose = () => {
    setIsFormModalOpen(false);
    setSelectedLead(null);
  };

  const handleDetailClose = () => {
    setIsDetailModalOpen(false);
    setSelectedLead(null);
  };

  const handleBulkImport = () => {
    setIsBulkModalOpen(true);
  };

  const handleBulkSuccess = () => {
    setSelectedLeadIds([]);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleDeleteLead = async (leadId: string) => {
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return;

    const confirmed = await dialog.confirm(
      'Are you sure you want to delete this lead? This action cannot be undone.',
      {
        title: 'Delete Lead',
        variant: 'danger'
      }
    );

    if (!confirmed) return;

    try {
      await deleteLeadMutation({ id: leadId as Id<"leads"> });
      toast.success('Lead deleted successfully');
    } catch (error) {
      console.error('Delete error', error);
      toast.error('Failed to delete lead');
    }
  };

  const handleBulkDelete = async () => {
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return;

    const confirmed = await dialog.confirm(
      `Are you sure you want to delete ${selectedLeadIds.length} leads? This action cannot be undone.`,
      {
        title: 'Delete Query',
        variant: 'danger'
      }
    );

    if (!confirmed) return;

    try {
      await bulkDeleteLeadsMutation({ ids: selectedLeadIds as Id<"leads">[] });
      handleBulkSuccess();
      toast.success('Leads deleted successfully');
    } catch (error) {
      console.error('Bulk delete error', error);
      toast.error('Failed to delete leads');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(paginatedLeads.map(l => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const getScoreBadge = (score: string) => {
    const variants = {
      Hot: { variant: 'danger' as const, icon: TrendingUp, color: 'text-red-600' },
      Warm: { variant: 'warning' as const, icon: Minus, color: 'text-yellow-600' },
      Cold: { variant: 'secondary' as const, icon: TrendingDown, color: 'text-gray-600' }
    };
    const config = variants[score as keyof typeof variants] || variants.Warm;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon size={14} className={config.color} />
        {score}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      New: 'primary',
      Contacted: 'secondary',
      'In Progress': 'info',
      Qualified: 'success',
      Disqualified: 'danger',
      Closed: 'secondary'
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  const filteredLeads = leads.filter(lead => {
    // 1. Executive Filter
    if (executiveFilter !== 'all' && lead.sales_executive?.id !== executiveFilter) return false;

    // 2. Team Leader Filter (Check if lead's executive reports to selected TL)
    if (teamLeaderFilter !== 'all' && lead.sales_executive?.reporting_manager_id !== teamLeaderFilter) return false;

    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      lead.customer_name.toLowerCase().includes(search) ||
      lead.mobile.includes(search) ||
      lead.email?.toLowerCase().includes(search) ||
      lead.lead_id.toLowerCase().includes(search)
    );
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.lead_status === 'New').length,
    qualified: leads.filter(l => l.lead_status === 'Qualified').length,
    hot: leads.filter(l => l.lead_score === 'Hot').length,
    overdue: leads.filter(l => l.overdue_followup).length
  };

  if (!isCRMActive) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2">
              CRM - Lead Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
              Manage customer relationships and track leads
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                CRM Module is Disabled
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Enable the CRM module to start managing leads and customer relationships
              </p>
              <ToggleSwitchWithDescription
                id="crm-toggle"
                checked={isCRMActive}
                onChange={setIsCRMActive}
                label="Enable CRM Module"
                description="Turn on to access lead management features"
                variant="success"
                size="lg"
                className="justify-center"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2">
            CRM - Lead Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Manage customer relationships and track leads
          </p>
        </div>

        <div className="flex items-center gap-4">

          {canCreateLead && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportCSV} className="hidden md:flex">
                <Download size={18} className="mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={handleBulkImport} className="hidden md:flex">
                <Upload size={18} className="mr-2" />
                Import
              </Button>
              <Button variant="primary" onClick={handleCreateLead} className="hidden md:flex">
                <Plus size={18} className="mr-2" />
                Create Lead
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Leads</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">New Leads</div>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Qualified</div>
            <div className="text-2xl font-bold text-green-600">{stats.qualified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hot Leads</div>
            <div className="text-2xl font-bold text-red-600">{stats.hot}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Overdue</div>
            <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="In Progress">In Progress</option>
              <option value="Qualified">Qualified</option>
              <option value="Disqualified">Disqualified</option>
              <option value="Closed">Closed</option>
            </select>

            {/* Score Filter */}
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="all">All Scores</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>

            {/* My Leads Toggle */}
            {canViewAllLeads && (
              <div className="flex items-center">
                <Button
                  variant={showOnlyMyLeads ? 'primary' : 'outline'}
                  onClick={() => setShowOnlyMyLeads(!showOnlyMyLeads)}
                  className="w-full"
                  size="sm"
                >
                  {showOnlyMyLeads ? 'My Leads' : 'All Leads'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 shadow-xl rounded-full px-6 py-3 flex items-center gap-4 z-40 animate-in slide-in-from-bottom-5">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {selectedLeadIds.length} Selected
          </span>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
          {['admin', 'super_admin', 'director', 'team_leader'].includes(profile?.role || '') && (
            <Button size="sm" variant="primary" onClick={() => setIsAssignModalOpen(true)}>
              <UserPlus size={16} className="mr-2" />
              Assign Executive
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setIsProjectModalOpen(true)}>
            <Building size={16} className="mr-2" />
            Assign Project
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsStatusModalOpen(true)}>
            <RefreshCw size={16} className="mr-2" />
            Change Status
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => setSelectedLeadIds([])}>
            Cancel
          </Button>
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          )}
        </div>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={20} />
              <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1673FF] border-t-transparent"></div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No leads found. Create your first lead to get started.
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 dark:border-gray-600"
                          checked={paginatedLeads.length > 0 && paginatedLeads.every(l => selectedLeadIds.includes(l.id))}
                          onChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Follow-ups</TableHead>
                      <TableHead className="w-[50px]"><span /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLeads.map((lead) => (
                      <Fragment key={lead.id}>
                        <TableRow
                          className={`group cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${lead.overdue_followup ? 'bg-red-50 dark:bg-red-900/10' : ''} ${expandedLeadId === lead.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                          onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                        >
                          <TableCell className="w-[40px]" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 dark:border-gray-600"
                              checked={selectedLeadIds.includes(lead.id)}
                              onChange={() => handleSelectLead(lead.id)}
                            />
                          </TableCell>
                          
                          {/* Customer */}
                          <TableCell>
                            <div className="font-medium">{lead.customer_name}</div>
                            {lead.city && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={12} />
                                {lead.city}
                              </div>
                            )}
                          </TableCell>

                          {/* Contact */}
                          <TableCell>
                            <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1 group">
                                <a href={`tel:${lead.mobile}`} className="text-xs flex items-center gap-1 text-blue-600 hover:underline font-medium">
                                  <Phone size={12} />
                                  {lead.mobile}
                                </a>
                                <button
                                  onClick={() => handleCopy(lead.mobile)}
                                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                  title="Copy Mobile"
                                >
                                  <Copy size={13} />
                                </button>
                              </div>
                              {lead.email && (
                                <a href={`mailto:${lead.email}`} className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                                  <Mail size={12} />
                                  {lead.email}
                                </a>
                              )}
                            </div>
                          </TableCell>

                          {/* Project */}
                          <TableCell>
                            <div className="text-sm">
                              {lead.project?.name || 'Not Assigned'}
                            </div>
                          </TableCell>

                          {/* Executive */}
                          <TableCell>
                            <div className="text-sm">
                              {lead.sales_executive?.full_name || 'Unassigned'}
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell>{getStatusBadge(lead.lead_status)}</TableCell>

                          {/* Follow-ups */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {lead.overdue_followup ? (
                                <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                                  {lead.followup_count} Overdue
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {lead.followup_count} Follow-ups
                                </Badge>
                              )}
                            </div>
                            {lead.latest_followup?.next_followup_date && (
                              <div className="text-[10px] text-gray-500 mt-1">
                                Next: {new Date(lead.latest_followup.next_followup_date).toLocaleDateString()}
                              </div>
                            )}
                          </TableCell>

                          {/* Actions (Menu) */}
                          <TableCell className="w-[50px]">
                            <ActionMenu
                              actions={[
                                {
                                  label: 'Edit',
                                  icon: Edit,
                                  onClick: () => handleEditLead(lead)
                                },
                                {
                                  label: 'View Details',
                                  icon: Eye,
                                  onClick: () => handleViewDetails(lead)
                                },
                                ...(profile?.role === 'admin' || profile?.role === 'super_admin' ? [{
                                  label: 'Delete',
                                  icon: Trash2,
                                  variant: 'danger' as const,
                                  onClick: () => handleDeleteLead(lead.id)
                                }] : [])
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded Content */}
                        {expandedLeadId === lead.id && (
                          <TableRow className="bg-gray-50 dark:bg-slate-900/50">
                            <TableCell colSpan={8} className="p-0 border-t border-gray-100 dark:border-gray-700">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 grid grid-cols-2 gap-6">
                                  {/* About Lead Section */}
                                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                    <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                                      <Users size={16} className="text-blue-500" />
                                      About Lead
                                    </h4>
                                    <div className="text-sm space-y-3">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <p className="text-xs text-gray-500">Lead ID</p>
                                          <p className="font-mono text-blue-600">{lead.lead_id}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Created</p>
                                          <p>{new Date(lead.lead_date).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Source</p>
                                          <p>{lead.lead_source || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Score</p>
                                          <p>{lead.lead_score}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Budget</p>
                                          <p>{lead.budget_range || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Purpose</p>
                                          <p>{lead.purpose || '-'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <div className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <LeadFormModal
        isOpen={isFormModalOpen}
        onClose={handleFormClose}
        lead={selectedLead}
      />
      <LeadDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleDetailClose}
        lead={selectedLead}
      />
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={handleBulkSuccess}
      />
      <AssignLeadModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        leadIds={selectedLeadIds}
        onSuccess={handleBulkSuccess}
      />
      <BulkStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        leadIds={selectedLeadIds}
        onSuccess={handleBulkSuccess}
      />
      <BulkProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        leadIds={selectedLeadIds}
        onSuccess={handleBulkSuccess}
      />
    </div>
  );
}
