import { useState, useEffect, Fragment } from 'react';
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { useToast } from '../contexts/ToastContext';
import { LeadWithRelations, LeadStatus, FollowupType, CustomerResponse, CallStatus } from '../types/database';
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
  UserPlus, RefreshCw, Trash2, Building, Eye, Edit, Copy,
  Calendar, Clock, Lock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';

export function LeadsPage() {
  const { profile, tenant } = useAuth();
  const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
  const isFreePlan = tenant?.plan_tier === 'free';
  const dialog = useDialog();
  const toast = useToast();

  // Convex Mutations
  const deleteLeadMutation = useMutation(api.leads.deleteLead);
  const bulkDeleteLeadsMutation = useMutation(api.leads.bulkDeleteLeads);
  const addFollowupMutation = useMutation(api.followups.addFollowup);
  const updateLeadMutation = useMutation(api.leads.updateLead);

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
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [quickFollowupData, setQuickFollowupData] = useState({
    followup_type: 'Call' as FollowupType,
    followup_date: new Date().toISOString().slice(0, 16),
    discussion_summary: '',
    customer_response: '' as CustomerResponse | '',
    call_status: 'Connected' as CallStatus,
    new_status: 'New' as LeadStatus,
    schedule_followup: false,
    next_followup_date: '',
    lost_reason: ''
  });

  // Query for the expanded lead's timeline
  const expandedFollowups = useQuery(api.followups.listByLead, 
    expandedLeadId ? { leadId: expandedLeadId as Id<"leads"> } : "skip"
  );

  const [isCRMActive, setIsCRMActive] = useState(true);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [executiveFilter, setExecutiveFilter] = useState<string>('all');
  const [showOnlyMyLeads, setShowOnlyMyLeads] = useState(
    normalizedRole === 'sales_executive'
  );

  // Dashboard Stats using optimized query
  const statsData = useQuery(api.leads.getDashboardStats, 
    profile?.tenant_id ? { 
      tenant_id: profile.tenant_id as Id<"tenants">,
      executive_id: showOnlyMyLeads ? profile.id as Id<"profiles"> : undefined,
      callerProfileId: profile.id as Id<"profiles">
    } : "skip"
  );

  // Fetch Leads using Paginated Query
  const { results: leads, status, loadMore } = usePaginatedQuery(
    api.leads.listLeadsByTenant,
    profile?.tenant_id ? { 
      tenant_id: profile.tenant_id as Id<"tenants">,
      showOnlyMyLeads,
      profileId: profile.id as Id<"profiles">,
      statusFilter,
      executiveFilter,
      searchQuery: searchTerm
    } : "skip",
    { initialNumItems: 50 }
  );

  const loading = status === "LoadingFirstPage";

  // Permissions
  const canCreateLead = ['super_admin', 'admin', 'team_leader', 'sales_executive'].includes(normalizedRole);
  const canViewAllLeads = ['super_admin', 'admin', 'team_leader', 'director'].includes(normalizedRole);

  // No manual pagination needed anymore
  useEffect(() => {
    // Scroll to top or reset internal state if needed
  }, [searchTerm, statusFilter, scoreFilter, executiveFilter, showOnlyMyLeads]);

  useEffect(() => {
    if (expandedLeadId) {
      const activeLead = leads?.find(l => l.id === expandedLeadId);
      if (activeLead) {
        setQuickFollowupData({
          followup_type: 'Call',
          followup_date: new Date().toISOString().slice(0, 16),
          discussion_summary: '',
          customer_response: '',
          call_status: 'Connected',
          new_status: activeLead.lead_status as LeadStatus,
          schedule_followup: false,
          next_followup_date: '',
          lost_reason: ''
        });
      }
    }
  }, [expandedLeadId, leads]);

  const handleQuickFollowupSubmit = async (e: React.FormEvent, lead: LeadWithRelations) => {
    e.preventDefault();
    if (!profile) return;

    if (quickFollowupData.discussion_summary.trim().length < 5) {
      toast.error('Remark must be at least 5 characters');
      return;
    }

    if (quickFollowupData.schedule_followup && !quickFollowupData.next_followup_date) {
      toast.error('Next follow-up date is required when scheduling');
      return;
    }

    // Require Project for Conversion
    if (quickFollowupData.new_status === 'Converted' && !lead.project_id) {
      toast.error('Cannot convert to sale without a selected Project. Edit lead details to assign a project first.');
      return;
    }

    setSubmitLoading(true);
    try {
      const previousStatus = lead.lead_status;

      await addFollowupMutation({
        tenant_id: profile.tenant_id as Id<"tenants">,
        lead_id: lead.id as Id<"leads">,
        followup_type: quickFollowupData.followup_type,
        followup_date: new Date(quickFollowupData.followup_date).toISOString(),
        discussion_summary: quickFollowupData.discussion_summary,
        customer_response: quickFollowupData.customer_response || undefined,
        call_status: quickFollowupData.followup_type === 'Call' ? quickFollowupData.call_status : undefined,
        previous_status: previousStatus,
        new_status: quickFollowupData.new_status,
        next_followup_date: quickFollowupData.schedule_followup && quickFollowupData.next_followup_date 
          ? new Date(quickFollowupData.next_followup_date).toISOString() 
          : undefined,
        created_by: profile.id as Id<"profiles">,
        metadata: {},
      });

      // Update lead status
      await updateLeadMutation({
        id: lead.id as Id<"leads">,
        lead_status: quickFollowupData.new_status,
      });

      toast.success('Follow-up and status updated successfully');
      
      // Reset remark text but keep status
      setQuickFollowupData(prev => ({
        ...prev,
        discussion_summary: '',
        schedule_followup: false,
        next_followup_date: ''
      }));
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to save update');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderTimeline = (lead: LeadWithRelations, followupsList: any[]) => {
    const events = [
      {
        id: 'creation',
        type: 'Creation',
        date: lead._creationTime || new Date(lead.lead_date).getTime(),
        title: 'Lead Created',
        description: `Source: ${lead.lead_source}`,
        creator_name: 'System',
        previous_status: undefined,
        new_status: undefined,
        call_status: undefined,
        customer_response: undefined,
        next_followup_date: undefined,
      },
      ...followupsList.map(f => ({
        id: f._id,
        type: f.followup_type,
        date: new Date(f.followup_date).getTime(),
        title: `${f.followup_type} Update`,
        description: f.discussion_summary,
        creator_name: f.creator?.full_name || 'Unknown Agent',
        previous_status: f.previous_status,
        new_status: f.new_status,
        call_status: f.call_status,
        customer_response: f.customer_response,
        next_followup_date: f.next_followup_date,
      }))
    ];

    events.sort((a, b) => b.date - a.date);

    return (
      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 mt-2">
        {events.map((event) => {
          const isCreation = event.type === 'Creation';
          return (
            <div key={event.id} className="relative pl-6 pb-4 border-l border-gray-200 dark:border-gray-700 last:border-0">
              <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${isCreation ? 'bg-green-500' : 'bg-blue-600'}`} />
              
              <div className="text-xs text-gray-500 flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {event.title}
                </span>
                <span className="text-[10px]">
                  {new Date(event.date).toLocaleString()}
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-800/40 p-2.5 rounded border border-gray-100 dark:border-slate-800">
                {event.previous_status && event.new_status && (
                  <div className="mb-1">
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      {event.previous_status} → {event.new_status}
                    </Badge>
                  </div>
                )}
                
                <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {event.description}
                </p>

                {event.call_status && (
                  <div className="mt-1 text-[10px] text-gray-500">
                    Call Status: <span className="font-medium">{event.call_status}</span>
                  </div>
                )}

                {event.customer_response && (
                  <div className="mt-1 text-[10px] text-gray-500">
                    Response: <span className="font-medium">{event.customer_response}</span>
                  </div>
                )}

                {event.next_followup_date && (
                  <div className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Calendar size={10} /> Next Follow-up: {new Date(event.next_followup_date).toLocaleString()}
                  </div>
                )}
                
                <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-slate-800/80 text-[10px] text-gray-400 flex justify-between">
                  <span>By: {event.creator_name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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

  const handleReopenLead = async (leadId: string) => {
    const confirmed = await dialog.confirm(
      'Are you sure you want to reopen this lead? Its status will be reset to New.',
      {
        title: 'Reopen Lead',
        variant: 'success'
      }
    );

    if (!confirmed) return;

    try {
      await updateLeadMutation({
        id: leadId as Id<"leads">,
        lead_status: 'New',
      });
      toast.success('Lead reopened successfully');
    } catch (error: any) {
      console.error('Reopen error', error);
      toast.error(error.message || 'Failed to reopen lead');
    }
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
      setSelectedLeadIds(leads.map(l => l.id));
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

  // Statistics from Server
  const stats = statsData || {
    totalLeads: 0,
    newLeads: 0,
    qualified: 0,
    siteVisitDone: 0,
    converted: 0,
    lost: 0,
    inProgress: 0,
    adsLeads: 0,
    walkInLeads: 0,
    referenceLeads: 0,
    channelPartnerLeads: 0
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
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">New Leads</div>
            <div className="text-2xl font-bold text-blue-600">{stats.newLeads}</div>
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
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">In Progress</div>
            <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Converted</div>
            <div className="text-2xl font-bold text-purple-600">{stats.converted}</div>
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
              <option value="active">Active Leads</option>
              <option value="all">All Leads (incl. Lost)</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="In Progress">In Progress</option>
              <option value="Qualified">Qualified</option>
              <option value="Lost">Lost</option>
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

            {/* Executive Filter */}
            {canViewAllLeads && (
              <select
                value={executiveFilter}
                onChange={(e) => setExecutiveFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value="all">All Executives</option>
                {/* We would ideally fetch executives here, but for now we'll just have the state */}
              </select>
            )}

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
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 shadow-xl rounded-full px-6 py-3 flex items-center gap-3 md:gap-4 z-40 animate-in slide-in-from-bottom-5 w-max max-w-[95vw] overflow-x-auto custom-scrollbar">
          <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
            {selectedLeadIds.length} Selected
          </span>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 shrink-0"></div>
          {['admin', 'super_admin', 'director', 'team_leader'].includes(profile?.role || '') && (
            <Button size="sm" variant="primary" onClick={() => setIsAssignModalOpen(true)} className="whitespace-nowrap text-xs shrink-0">
              <UserPlus size={14} className="mr-1.5" />
              Assign Executive
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setIsProjectModalOpen(true)} className="whitespace-nowrap text-xs shrink-0">
            <Building size={14} className="mr-1.5" />
            Assign Project
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsStatusModalOpen(true)} className="whitespace-nowrap text-xs shrink-0">
            <RefreshCw size={14} className="mr-1.5" />
            Change Status
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 whitespace-nowrap text-xs shrink-0" onClick={() => setSelectedLeadIds([])}>
            Cancel
          </Button>
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <Button 
              size="sm" 
              variant={isFreePlan ? "outline" : "danger"} 
              onClick={isFreePlan ? () => toast.info("Lead deletion is a Pro feature. Please upgrade your plan.") : handleBulkDelete}
              className={`whitespace-nowrap text-xs shrink-0 ${
                isFreePlan ? "text-gray-400 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700" : ""
              }`}
            >
              {isFreePlan ? <Lock size={14} className="mr-1.5" /> : <Trash2 size={14} className="mr-1.5" />}
              {isFreePlan ? "Delete (Pro Feature)" : "Delete"}
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
              <CardTitle>All Leads</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1673FF] border-t-transparent"></div>
            </div>
          ) : leads.length === 0 ? (
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
                          checked={leads.length > 0 && leads.every(l => selectedLeadIds.includes(l.id))}
                          onChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Follow-ups</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <Fragment key={lead.id}>
                        <TableRow
                          className={`group cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${lead.lead_status === 'Lost' || lead.lead_status === 'Disqualified' ? 'bg-red-50 dark:bg-red-950/25 border-l-4 border-l-red-500' : lead.overdue_followup ? 'bg-red-50/50 dark:bg-red-900/10' : ''} ${expandedLeadId === lead.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
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
                            {lead.latest_followup_date && (
                              <div className="text-[10px] text-gray-500 mt-1">
                                Latest: {new Date(lead.latest_followup_date).toLocaleDateString()}
                              </div>
                            )}
                            {lead.next_followup_date && (
                              <div className="text-[10px] text-gray-500 mt-1">
                                Next: {new Date(lead.next_followup_date).toLocaleDateString()}
                              </div>
                            )}
                          </TableCell>

                          {/* Actions (Menu) */}
                          <TableCell className="w-[120px]">
                            <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                              {((['admin', 'super_admin', 'director', 'team_leader'].includes(normalizedRole)) || lead.sales_executive_id === profile?.id) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id);
                                  }}
                                  className={`px-2 py-1 text-xs font-semibold border dark:border-slate-700 ${lead.lead_status === 'Lost' || lead.lead_status === 'Disqualified' ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200'}`}
                                >
                                  {lead.lead_status === 'Lost' || lead.lead_status === 'Disqualified' ? 'View / Reopen' : 'Update'}
                                </Button>
                              )}
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
                                   ...((lead.lead_status === 'Lost' || lead.lead_status === 'Disqualified') ? [{
                                     label: 'Reopen',
                                     icon: RefreshCw,
                                     onClick: () => handleReopenLead(lead.id)
                                   }] : []),
                                  ...(profile?.role === 'admin' || profile?.role === 'super_admin' ? [{
                                    label: isFreePlan ? 'Delete (Pro Feature)' : 'Delete',
                                    icon: isFreePlan ? Lock : Trash2,
                                    variant: isFreePlan ? 'neutral' as const : 'danger' as const,
                                    onClick: isFreePlan 
                                      ? () => toast.info('Lead deletion is a Pro feature. Please upgrade your plan.')
                                      : () => handleDeleteLead(lead.id)
                                  }] : [])
                                ]}
                              />
                            </div>
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
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Left Column: About Lead & Quick Update */}
                                  <div className="space-y-4">
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

                                    {/* Quick Update Section */}
                                    {((['admin', 'super_admin', 'director', 'team_leader'].includes(normalizedRole)) || lead.sales_executive_id === profile?.id) && (
                                      lead.lead_status === 'Lost' || lead.lead_status === 'Disqualified' ? (
                                        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900/50 text-center space-y-3">
                                          <div className="text-red-600 dark:text-red-400 font-semibold text-sm">
                                            This lead is currently ${lead.lead_status}.
                                          </div>
                                          <p className="text-xs text-gray-600 dark:text-gray-400">
                                            To make updates or log follow-ups, you must reopen the lead first.
                                          </p>
                                          <Button
                                            type="button"
                                            variant="success"
                                            size="sm"
                                            onClick={() => handleReopenLead(lead.id)}
                                            className="w-full mt-2"
                                          >
                                            Reopen Lead
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                        <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                                          <Plus size={16} className="text-blue-500" />
                                          Quick Follow-up Update
                                        </h4>
                                        <form onSubmit={(e) => handleQuickFollowupSubmit(e, lead)} className="space-y-3">
                                          <div className="grid grid-cols-2 gap-3">
                                            <div>
                                              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                              <select
                                                value={quickFollowupData.new_status}
                                                onChange={(e) => setQuickFollowupData(prev => ({ ...prev, new_status: e.target.value as LeadStatus }))}
                                                className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                              >
                                                <option value="New">New</option>
                                                <option value="Contacted">Contacted</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                                                <option value="Site Visit Done">Site Visit Done</option>
                                                <option value="Qualified">Qualified</option>
                                                <option value="Disqualified">Disqualified</option>
                                                <option value="Lost">Lost</option>
                                                <option value="Converted">Converted</option>
                                              </select>
                                            </div>
                                            
                                            <div>
                                              <label className="block text-xs font-medium text-gray-500 mb-1">Interaction Type</label>
                                              <select
                                                value={quickFollowupData.followup_type}
                                                onChange={(e) => setQuickFollowupData(prev => ({ ...prev, followup_type: e.target.value as FollowupType }))}
                                                className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                              >
                                                <option value="Call">Call</option>
                                                <option value="WhatsApp">WhatsApp</option>
                                                <option value="Visit">Visit</option>
                                                <option value="Email">Email</option>
                                              </select>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-3">
                                            <div>
                                              <label className="block text-xs font-medium text-gray-500 mb-1">Interaction Date & Time</label>
                                              <input
                                                type="datetime-local"
                                                value={quickFollowupData.followup_date}
                                                onChange={(e) => setQuickFollowupData(prev => ({ ...prev, followup_date: e.target.value }))}
                                                className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                                required
                                              />
                                            </div>

                                            {quickFollowupData.followup_type === 'Call' ? (
                                              <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Call Status</label>
                                                <select
                                                  value={quickFollowupData.call_status}
                                                  onChange={(e) => setQuickFollowupData(prev => ({ ...prev, call_status: e.target.value as CallStatus }))}
                                                  className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                                >
                                                  <option value="Connected">Connected</option>
                                                  <option value="Ringing">Ringing</option>
                                                  <option value="Disconnected">Disconnected</option>
                                                  <option value="Busy">Busy</option>
                                                  <option value="Not Responding">Not Responding</option>
                                                  <option value="Asked to call later">Asked to call later</option>
                                                </select>
                                              </div>
                                            ) : (
                                              <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Customer Response</label>
                                                <select
                                                  value={quickFollowupData.customer_response}
                                                  onChange={(e) => setQuickFollowupData(prev => ({ ...prev, customer_response: e.target.value as CustomerResponse }))}
                                                  className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                                >
                                                  <option value="">Select Response</option>
                                                  <option value="Positive">Positive</option>
                                                  <option value="Neutral">Neutral</option>
                                                  <option value="Negative">Negative</option>
                                                </select>
                                              </div>
                                            )}
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Remarks / Note</label>
                                            <textarea
                                              value={quickFollowupData.discussion_summary}
                                              onChange={(e) => setQuickFollowupData(prev => ({ ...prev, discussion_summary: e.target.value }))}
                                              placeholder="Type discussion summary (min 5 chars)..."
                                              rows={2}
                                              className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                              required
                                            />
                                          </div>

                                          {!['Converted', 'Disqualified', 'Lost'].includes(quickFollowupData.new_status) && (
                                            <div className="space-y-2">
                                              <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={quickFollowupData.schedule_followup}
                                                  onChange={(e) => setQuickFollowupData(prev => ({ ...prev, schedule_followup: e.target.checked }))}
                                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                Schedule Next Follow-up
                                              </label>
                                              
                                              {quickFollowupData.schedule_followup && (
                                                <div>
                                                  <label className="block text-xs font-medium text-gray-500 mb-1">Next Follow-up Date & Time</label>
                                                  <input
                                                    type="datetime-local"
                                                    value={quickFollowupData.next_followup_date}
                                                    onChange={(e) => setQuickFollowupData(prev => ({ ...prev, next_followup_date: e.target.value }))}
                                                    className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                                    required
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          <div className="flex justify-end pt-1">
                                            <Button
                                              type="submit"
                                              variant="primary"
                                              size="sm"
                                              isLoading={submitLoading}
                                              className="w-full"
                                            >
                                              Save Update
                                            </Button>
                                          </div>
                                        </form>
                                      </div>
                                    )
                                  )}
                                  </div>

                                  {/* Right Column: Timeline */}
                                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
                                    <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                                      <Clock size={16} className="text-blue-500" />
                                      Timeline
                                    </h4>
                                    {expandedFollowups === undefined ? (
                                      <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                                      </div>
                                    ) : (
                                      renderTimeline(lead, expandedFollowups)
                                    )}
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

              {/* Load More */}
              {status === "CanLoadMore" && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => loadMore(50)}
                    className="w-full md:w-auto"
                  >
                    Load More Leads
                  </Button>
                </div>
              )}
              {status === "LoadingMore" && (
                <div className="flex justify-center mt-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#1673FF] border-t-transparent"></div>
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
      {selectedLead && (
        <LeadDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleDetailClose}
          lead={selectedLead}
        />
      )}
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
