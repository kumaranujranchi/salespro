import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Lock,
  X,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Trash2,
  CheckCircle2,
  XCircle,
  Plus,
  Building2,
  Mail,
  User,
  LifeBuoy
} from 'lucide-react';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription_status: string;
  created_at: string;
  trial_ends_at?: string;
  // Enhanced Fields
  is_active?: boolean;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  plan_tier?: string;
  billing_cycle?: string;
  owner_id?: string;
}

export function PlatformDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [filter, setFilter] = useState('all'); // all, trial, active

  // Add Tenant Modal State
  const [addTenantModalOpen, setAddTenantModalOpen] = useState(false);
  const [addTenantLoading, setAddTenantLoading] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    companyName: '',
    companySlug: '',
    adminName: '',
    email: '',
    password: ''
  });

  // Password Reset State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSlugInput, setDeleteSlugInput] = useState('');

  // Notification State
  const [notification, setNotification] = useState<{ type: 'success' | 'error', title: string, message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'support'>('overview');

  // New State for Support
  const [tickets, setTickets] = useState<any[]>([]);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    fetchTenants();
    fetchTickets();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      // First fetch all tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        setTickets([]);
        return;
      }

      if (!ticketsData || ticketsData.length === 0) {
        setTickets([]);
        return;
      }

      // Now fetch profile and tenant data for each ticket
      const ticketsWithDetails = await Promise.all(
        ticketsData.map(async (ticket) => {
          let profileData = null;
          let tenantData = null;

          // Fetch profile
          if (ticket.created_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .eq('id', ticket.created_by)
              .single();
            profileData = profile;
          }

          // Fetch tenant
          if (ticket.tenant_id) {
            const { data: tenant } = await supabase
              .from('tenants')
              .select('id, name')
              .eq('id', ticket.tenant_id)
              .single();
            tenantData = tenant;
          }

          return {
            ...ticket,
            profiles: profileData,
            tenants: tenantData
          };
        })
      );

      console.log('Fetched tickets with details:', ticketsWithDetails);
      setTickets(ticketsWithDetails || []);
    } catch (error) {
      console.error('Error in fetchTickets:', error);
      setTickets([]);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket || !resolutionNote) return;

    try {
      // 1. Update DB
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'resolved',
          resolution_notes: resolutionNote
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      // 2. Try to Send Email (but don't fail if email fails)
      let emailSent = false;
      let emailError = null;

      try {
        console.log('=== EMAIL SENDING DEBUG START ===');
        console.log('Full selectedTicket object:', JSON.stringify(selectedTicket, null, 2));
        console.log('selectedTicket.profiles:', selectedTicket.profiles);
        console.log('selectedTicket.profiles?.email:', selectedTicket.profiles?.email);
        console.log('selectedTicket.profiles?.full_name:', selectedTicket.profiles?.full_name);
        console.log('selectedTicket.ticket_number:', selectedTicket.ticket_number);
        console.log('=== EMAIL SENDING DEBUG END ===');

        const emailResponse = await fetch('/.netlify/functions/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'TICKET_RESOLVED',
            email: selectedTicket.profiles?.email,
            name: selectedTicket.profiles?.full_name,
            data: {
              ticketNumber: selectedTicket.ticket_number,
              resolution: resolutionNote
            }
          })
        });

        console.log('Email response status:', emailResponse.status);

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error('Email function returned error:', errorData);
          emailError = errorData.error || errorData.details || 'Unknown error';
        } else {
          const successData = await emailResponse.json();
          console.log('Email sent successfully:', successData);
        }

        emailSent = emailResponse.ok;
      } catch (err: any) {
        console.error('Email sending exception:', err);
        emailError = err.message;
        emailSent = false;
      }

      setResolveModalOpen(false);
      setResolutionNote('');
      fetchTickets(); // Refresh list

      // Show appropriate notification based on email status
      if (emailSent) {
        setNotification({
          type: 'success',
          title: 'Ticket Resolved!',
          message: 'The ticket has been marked as resolved and the user has been notified via email.'
        });
      } else {
        setNotification({
          type: 'success',
          title: 'Ticket Resolved!',
          message: `The ticket has been marked as resolved. However, the notification email could not be sent${emailError ? ': ' + emailError : ''}. Please inform the user manually.`
        });
      }
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: 'error',
        title: 'Resolution Failed',
        message: err.message || 'An error occurred while resolving the ticket.'
      });
    }
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!newTenantData.companyName || !newTenantData.email || !newTenantData.password || newTenantData.password.length < 6) {
      alert('Please fill all fields. Password must be at least 6 characters.');
      return;
    }

    try {
      setAddTenantLoading(true);

      // CRITICAL: Create a temporary client to avoid logging out the Admin
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false, // Don't save session to local storage
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );

      // 1. Create the Auth User (as the new user)
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: newTenantData.email,
        password: newTenantData.password,
        options: {
          data: {
            full_name: newTenantData.adminName,
            role: 'super_admin' // The new user is a super_admin of their tenant
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user account.");

      // 2. Register the Tenant (RPC executes as the new user context)
      const { error: rpcError } = await tempSupabase.rpc('register_tenant', {
        company_name: newTenantData.companyName,
        company_slug: newTenantData.companySlug,
        user_full_name: newTenantData.adminName
      });

      if (rpcError) throw rpcError;

      // Success!
      setAddTenantModalOpen(false);
      setNewTenantData({
        companyName: '',
        companySlug: '',
        adminName: '',
        email: '',
        password: ''
      });

      setNotification({
        type: 'success',
        title: 'Client Onboarded',
        message: `${newTenantData.companyName} has been successfully created.`
      });

      // Refresh list
      fetchTenants();

    } catch (error: any) {
      console.error('Error adding tenant:', error);
      setNotification({
        type: 'error',
        title: 'Onboarding Failed',
        message: error.message || 'An error occurred while creating the tenant.'
      });
    } finally {
      setAddTenantLoading(false);
    }
  };

  const handleNewTenantInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTenantData(prev => ({
      ...prev,
      [name]: value,
      // Auto-slug
      companySlug: name === 'companyName' ? value.toLowerCase().replace(/[^a-z0-9]/g, '-') : prev.companySlug
    }));
  };

  const toggleTenantStatus = async (tenant: Tenant) => {
    if (!confirm(`Are you sure you want to ${tenant.is_active === false ? 'ACTIVATE' : 'DEACTIVATE'} this tenant?`)) return;

    try {
      const newStatus = tenant.is_active === false ? true : false;
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: newStatus })
        .eq('id', tenant.id);

      if (error) throw error;

      // Update local state
      setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, is_active: newStatus } : t));
      if (selectedTenant && selectedTenant.id === tenant.id) {
        setSelectedTenant({ ...selectedTenant, is_active: newStatus });
      }
      alert(`Tenant ${newStatus ? 'Activated' : 'Deactivated'} successfully.`);
    } catch (error) {
      console.error('Error updating tenant status:', error);
      alert('Failed to update tenant status. Ensure you have permission.');
    }
  };

  const calculateTrialDaysLeft = (tenant: Tenant) => {
    let endDate: Date;
    if (tenant.trial_ends_at) {
      endDate = new Date(tenant.trial_ends_at);
    } else {
      const start = new Date(tenant.created_at);
      endDate = new Date(start);
      endDate.setDate(start.getDate() + 30);
    }
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const openResetPasswordModal = (tenant: Tenant) => {
    if (!tenant.owner_id) {
      alert('No owner ID found for this tenant. Cannot reset password.');
      return;
    }
    setResetPassword('');
    setResetModalOpen(true);
    // Focus input after a short delay for animation
    setTimeout(() => passwordInputRef.current?.focus(), 100);
  };

  const confirmResetPassword = async () => {
    if (!selectedTenant || !selectedTenant.owner_id) return;

    if (resetPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      setResetLoading(true);
      const { error } = await supabase.rpc('admin_reset_password', {
        target_user_id: selectedTenant.owner_id,
        new_password: resetPassword
      });

      if (error) throw error;

      setResetModalOpen(false);
      setResetPassword('');
      alert('Password reset successfully for the tenant owner.');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password: ' + (error.message || error.error_description || 'Unknown error'));
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteTenant = () => {
    setDeleteSlugInput('');
    setDeleteModalOpen(true);
  };

  const confirmDeleteTenant = async () => {
    if (!selectedTenant) return;

    if (deleteSlugInput !== selectedTenant.slug) {
      setNotification({
        type: 'error',
        title: 'Verification Failed',
        message: 'The slug you entered does not match. Please type the exact company slug.'
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.rpc('admin_delete_tenant', {
        target_tenant_id: selectedTenant.id
      });

      if (error) throw error;

      setDeleteModalOpen(false);
      setSelectedTenant(null);
      fetchTenants();

      // Show Success Modal
      setNotification({
        type: 'success',
        title: 'Tenant Deleted',
        message: 'The tenant and all associated data have been permanently removed.'
      });

    } catch (error: any) {
      console.error('Error deleting tenant:', error);
      setNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.message || error.error_description || 'An unknown error occurred.'
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: tenants.length,
    trial: tenants.filter(t => t.subscription_status === 'trial').length,
    active: tenants.filter(t => t.subscription_status === 'active').length,
    newThisMonth: tenants.filter(t => {
      const d = new Date(t.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length
  };

  const filteredTenants = tenants.filter(t => {
    if (filter === 'all') return true;
    return t.subscription_status === filter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Monitor SaaS growth and tenant health.</p>
        </div>
        <button
          onClick={() => setAddTenantModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-indigo-500/30"
        >
          <Plus className="w-5 h-5" />
          Onboard New Client
        </button>
      </div>

      {/* Add Tenant Modal */}
      {addTenantModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-scaleIn border border-slate-200 dark:border-slate-700">
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Onboard New Client
              </h3>
              <button onClick={() => setAddTenantModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTenant} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="companyName"
                    value={newTenantData.companyName}
                    onChange={handleNewTenantInputChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Acme Corp"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company Slug (URL)</label>
                <input
                  type="text"
                  name="companySlug"
                  value={newTenantData.companySlug}
                  onChange={(e) => setNewTenantData({ ...newTenantData, companySlug: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="adminName"
                      value={newTenantData.adminName}
                      onChange={handleNewTenantInputChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={newTenantData.email}
                      onChange={handleNewTenantInputChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="admin@company.com"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Initial Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text" // Visible for admin convenience
                    name="password"
                    value={newTenantData.password}
                    onChange={handleNewTenantInputChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Set a strong password"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500">Share this password securely with the client.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAddTenantModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addTenantLoading}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                >
                  {addTenantLoading ? 'Creating...' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* ... (Keep existing stats cards) ... */}
        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tenants</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.total}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">New (This Month)</p>
              <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">+{stats.newThisMonth}</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Trials</p>
              <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{stats.trial}</h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Paid / Active</p>
              <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{stats.active}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tenant List */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        {/* Header with Title and Tab Navigation */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Tenants</h2>
          </div>

          <div className="flex items-center justify-between">
            {/* Tab Buttons */}
            <div className="flex gap-6 border-b border-slate-200 dark:border-white/10">
              <button
                onClick={() => setActiveTab('tenants')}
                className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'tenants'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                Manage Tenants
                {activeTab === 'tenants' && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('support')}
                className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'support'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                Support Tickets
                {tickets.some(t => t.status === 'open') && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                    {tickets.filter(t => t.status === 'open').length}
                  </span>
                )}
                {activeTab === 'support' && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Tenant Filters (Only visible on Tenants tab) */}
            {activeTab === 'tenants' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('trial')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'trial' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  Trials
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'active' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  Active
                </button>
              </div>
            )}
          </div>
        </div>

        {activeTab === 'tenants' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      Loading tenants...
                    </td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No tenants found matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${tenant.is_active === false ? 'opacity-60 bg-slate-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mr-3 ${tenant.is_active === false ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'}`}>
                            {tenant.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {tenant.name}
                              {tenant.is_active === false && <span className="ml-2 text-xs text-red-500 font-bold">(SUSPENDED)</span>}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{tenant.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${tenant.subscription_status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            tenant.subscription_status === 'trial' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}
                      `}>
                          {tenant.subscription_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 capitalize">
                        {tenant.plan_tier || 'Starter'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(tenant.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedTenant(tenant)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
        }

        {
          activeTab === 'support' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {tickets.map((ticket) => (
                  <li key={ticket.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="px-2 py-1 text-xs font-bold rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            #{ticket.ticket_number}
                          </span>
                          <h3 className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
                            {ticket.subject}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-bold uppercase ${ticket.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                            {ticket.status}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {ticket.tenants?.name}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{ticket.description}</p>
                        <p className="text-xs text-gray-400">
                          Raised by <strong>{ticket.profiles?.full_name}</strong> on {new Date(ticket.created_at).toLocaleString()}
                        </p>

                        {ticket.resolution_notes && (
                          <div className="mt-3 bg-green-50 dark:bg-green-900/10 p-2 rounded text-sm text-green-800 border border-green-100 dark:border-green-900/30">
                            <strong>Resolution:</strong> {ticket.resolution_notes}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex items-start">
                        {ticket.status === 'open' && (
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setResolveModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded hover:bg-indigo-700"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
                {tickets.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    <LifeBuoy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    No tickets found.
                  </div>
                )}
              </ul>
            </div>
          )
        }

        {/* Resolve Modal */}
        {
          resolveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Resolve Ticket #{selectedTicket?.ticket_number}</h3>
                <textarea
                  className="w-full border rounded p-2 mb-4 dark:bg-gray-700 dark:text-white"
                  rows={4}
                  placeholder="Enter resolution notes..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setResolveModalOpen(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolveTicket}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
                  >
                    Mark Resolved & Send Email
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Tenant Details Modal */}
        {
          selectedTenant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-slideUp">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      {selectedTenant.name}
                      {selectedTenant.is_active === false && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Suspended</span>}
                    </h3>
                    <p className="text-sm text-slate-500">Tenant ID: {selectedTenant.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTenant(null)}
                    className="text-slate-400 hover:text-slate-500 dark:hover:text-white transition-colors"
                    aria-label="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <div className="p-6 space-y-8">
                  {/* Status & Plan Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Subscription</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${selectedTenant.subscription_status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        <span className="font-bold text-slate-900 dark:text-white capitalize">{selectedTenant.subscription_status}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Plan Tier</p>
                      <p className="mt-1 font-bold text-slate-900 dark:text-white capitalize">{selectedTenant.plan_tier || 'Starter'} <span className="text-xs font-normal text-slate-500">({selectedTenant.billing_cycle || 'monthly'})</span></p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Joined On</p>
                      <p className="mt-1 font-bold text-slate-900 dark:text-white">{formatDate(selectedTenant.created_at)}</p>
                    </div>
                  </div>

                  {/* Trial Bar */}
                  {selectedTenant.subscription_status === 'trial' && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Trial Period Progress</p>
                        <span className="text-xs font-mono bg-white dark:bg-black/20 px-2 py-1 rounded text-amber-700 dark:text-amber-300">
                          {(selectedTenant.trial_ends_at && new Date(selectedTenant.trial_ends_at) > new Date()) ?
                            Math.ceil((new Date(selectedTenant.trial_ends_at).getTime() - new Date(selectedTenant.created_at).getTime()) / (1000 * 60 * 60 * 24)) + ' Days Total'
                            : '30 Days Total'
                          }
                        </span>
                      </div>
                      {(() => {
                        const daysLeft = calculateTrialDaysLeft(selectedTenant);
                        // Approximation for progress bar
                        const totalDays = 30;
                        const progress = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));

                        return (
                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className={`${daysLeft < 5 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                                {daysLeft > 0 ? `${daysLeft} days remaining` : 'Trial Expired'}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-amber-200 dark:bg-amber-900/30 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${daysLeft < 5 ? 'bg-red-500' : 'bg-amber-500'}`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Contact & Address Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 border-b border-slate-100 dark:border-white/10 pb-2">Contact Details</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-500">Contact Email</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedTenant.contact_email || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Phone</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedTenant.contact_phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 border-b border-slate-100 dark:border-white/10 pb-2">Billing Address</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-500">Address</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedTenant.address || 'Not provided'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-slate-500">City</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedTenant.city || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">State</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedTenant.state || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/10">
                    <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-4">Danger Zone</h4>
                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedTenant.is_active === false ? 'Activate Tenant Account' : 'Deactivate Tenant Account'}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {selectedTenant.is_active === false
                            ? 'Restore access to this tenant immediately.'
                            : 'Prevent all users in this tenant from logging in.'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleTenantStatus(selectedTenant)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedTenant.is_active === false
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                      >
                        {selectedTenant.is_active === false ? 'ACTIVATE' : 'DEACTIVATE'}
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Reset Owner Password</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Manually set a new password for the tenant's super admin.
                        </p>
                      </div>
                      <button
                        onClick={() => openResetPasswordModal(selectedTenant)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white transition-colors"
                      >
                        <Lock className="w-4 h-4" />
                        RESET PASSWORD
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
                      <div>
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Delete Tenant Data</p>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                          Permanently remove this company and all its data.
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteTenant}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        DELETE TENANT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Custom Password Reset Modal */}
        {
          resetModalOpen && selectedTenant && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scaleIn border border-slate-200 dark:border-slate-700">

                {/* Header with detailed styling */}
                <div className="relative bg-indigo-600 p-6 text-center overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-inner ring-4 ring-white/10">
                      <KeyRound className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Reset Access</h3>
                    <p className="text-indigo-100 text-sm mt-1">Set a new password for {selectedTenant.name}</p>
                  </div>
                  <button
                    onClick={() => setResetModalOpen(false)}
                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg p-3 flex gap-3 mb-6">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                      This modification will immediately invalidate the current password for the Super Admin of <strong>{selectedTenant.name}</strong>. Provide the new password to the user securely.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? "text" : "password"}
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="block w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder="Enter secure password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                      <span>Min. 6 characters</span>
                      {resetPassword.length > 0 && resetPassword.length < 6 && (
                        <span className="text-red-500 font-medium">Too short</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() => setResetModalOpen(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmResetPassword}
                      disabled={resetLoading || resetPassword.length < 6}
                      className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                    >
                      {resetLoading ? (
                        'Updating...'
                      ) : (
                        <>
                          Confirm Reset
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Custom Delete Confirmation Modal */}
        {deleteModalOpen && selectedTenant && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scaleIn border-2 border-red-500/50">

              {/* Header - DANGER Theme */}
              <div className="relative bg-red-600 p-6 text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-inner ring-4 ring-white/10 animate-pulse">
                    <Trash2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">Confirm Deletion</h3>
                  <p className="text-red-100 text-sm mt-1 font-medium">Permanent Data Loss for {selectedTenant.name}</p>
                </div>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg p-4 flex gap-4 mb-6">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-red-800 dark:text-red-200">
                      You are about to destroy this company.
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                      This will delete <strong className="underline">ALL</strong> users, sales, payments, and history associated with <strong>{selectedTenant.name}</strong>. This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Type the company slug <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-900">{selectedTenant.slug}</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteSlugInput}
                    onChange={(e) => setDeleteSlugInput(e.target.value)}
                    className="block w-full px-4 py-3 rounded-lg border-2 border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm placeholder:text-slate-400"
                    placeholder={`Type "${selectedTenant.slug}" here`}
                  />
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteTenant}
                    disabled={deleteSlugInput !== selectedTenant.slug || loading}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      'Deleting...'
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        DELETE FOREVER
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {notification && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-scaleIn border border-slate-200 dark:border-slate-700">
              <div className={`p-6 text-center ${notification.type === 'success' ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}>
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${notification.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {notification.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${notification.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                  {notification.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {notification.message}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-[#1e1e2d] border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setNotification(null)}
                  className={`w-full py-2.5 rounded-lg font-bold text-white transition-all shadow-lg ${notification.type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'}`}
                >
                  Okay, Got it
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
