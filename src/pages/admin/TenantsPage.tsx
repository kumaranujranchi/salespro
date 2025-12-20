import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import {
  Building2,
  Mail,
  Phone,
  Plus,
  User,
  X,
  Lock,
  Trash2,
  AlertTriangle,
  Receipt,
  ChevronDown,
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Zap,
  Award,
  XCircle
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
  next_billing_date?: string;
  owner_id?: string;
  settings?: {
    features: {
      crm: boolean;
      inventory: boolean;
      reports: boolean;
      site_visits: boolean;
      incentives: boolean;
    };
    appearance: {
      primary_color: string;
      logo_url: string | null;
    };
    incentive_plan: {
      type: string;
      rules: Record<string, any>;
    };
  };
}

export function TenantsPage() {
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
    phone: '',
    password: '',
    referralCode: ''
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Billing History State
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (selectedTenant) {
      fetchBillingHistory(selectedTenant.id);
    } else {
      setBillingHistory([]);
    }
  }, [selectedTenant]);

  const fetchBillingHistory = async (tenantId: string) => {
    try {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBillingHistory(data || []);
    } catch (err) {
      console.error('Error fetching billing history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
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

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!newTenantData.companyName || !newTenantData.email || !newTenantData.phone || !newTenantData.password || newTenantData.password.length < 6) {
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
        user_full_name: newTenantData.adminName,
        contact_email: newTenantData.email,
        contact_phone: newTenantData.phone
      });

      if (rpcError) throw rpcError;

      // FIX: Force 30-day trial period (Override DB default of 14 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { error: trialUpdateError } = await supabase
        .from('tenants')
        .update({ trial_ends_at: thirtyDaysFromNow.toISOString() })
        .eq('slug', newTenantData.companySlug);

      if (trialUpdateError) console.error("Failed to extend trial period:", trialUpdateError);

      // Handle Referral Code (Optional)
      if (newTenantData.referralCode && authData.user) {
        try {
           const { data: campaign } = await supabase
             .from('referral_campaigns')
             .select('id')
             .eq('code', newTenantData.referralCode) // Case sensitive? Or user typed?
             .single();
           
           if (campaign) {
             await supabase.from('user_referrals').insert({
               campaign_id: campaign.id,
               referred_user_id: authData.user.id,
               status: 'signed_up'
             });
           }
        } catch (refError) {
           console.error("Error processing referral:", refError);
           // Don't fail the onboarding just for referral error
        }
      }

      // Success!
      setAddTenantModalOpen(false);
      setNewTenantData({
        companyName: '',
        companySlug: '',
        adminName: '',
        email: '',
        phone: '',
        password: '',
        referralCode: ''
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

  const handleSendReminder = async (tenant: Tenant) => {
    if (!tenant.contact_email) {
      alert('This tenant has no contact email.');
      return;
    }

    if (!confirm(`Send subscription reminder to ${tenant.contact_email}?`)) return;

    try {
      // Calculate expiry date and days remaining
      let expiryDateStr = '';
      let daysRemaining = 0;

      if (tenant.subscription_status === 'trial' && tenant.trial_ends_at) {
        expiryDateStr = tenant.trial_ends_at;
      } else if (tenant.next_billing_date) {
        expiryDateStr = tenant.next_billing_date;
      } else {
        // Fallback or generic logic if no date found
        const d = new Date();
        d.setDate(d.getDate() + 30);
        expiryDateStr = d.toISOString();
      }

      const endDate = new Date(expiryDateStr);
      const now = new Date();
      daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const formattedDate = new Date(expiryDateStr).toLocaleDateString();

      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SUBSCRIPTION_REMINDER',
          email: tenant.contact_email,
          name: tenant.name,
          data: {
            daysRemaining,
            expiryDate: formattedDate,
            planName: (tenant.plan_tier || 'Starter') + ' Plan'
          }
        })
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          title: 'Reminder Sent',
          message: `Subscription reminder sent to ${tenant.contact_email}`
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      setNotification({
        type: 'error',
        title: 'Sending Failed',
        message: 'Could not send the reminder email.'
      });
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
          className="flex w-full md:w-auto items-center justify-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-green-500/30"
        >
          <Plus className="w-5 h-5" />
          Onboard New Client
        </button>
      </div>

      {/* Add Tenant Modal */}
      {addTenantModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-scaleIn border border-slate-200 dark:border-slate-700">
            <div className="bg-[#10B981] p-6 flex justify-between items-center text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Onboard New Client
              </h3>
              <button onClick={() => setAddTenantModalOpen(false)} className="hover:bg-black/10 p-1 rounded-full text-white/80 hover:text-white">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={newTenantData.phone}
                      onChange={handleNewTenantInputChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="+91 98765 43210"
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Referral Code (Optional)</label>
                <div className="relative">
                  <Receipt className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="referralCode"
                    value={newTenantData.referralCode}
                    onChange={handleNewTenantInputChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#10B981]"
                    placeholder="Enter code if applicable"
                  />
                </div>
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
                  className="flex-1 px-4 py-2.5 bg-[#10B981] text-white font-bold rounded-lg hover:bg-[#059669] transition-colors shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                >
                  {addTenantLoading ? 'Creating...' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards Removed */}


      {/* Tenant List */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        {/* Header with Title and Tab Navigation */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Tenants</h2>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tenant Filters */}
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
          </div>
        </div>

        {/* List Content */}
        <div>
            {/* Mobile View - Collapsible Cards */}
            <div className="md:hidden space-y-4 p-4">
              {filteredTenants.map((tenant) => (
                <div key={tenant.id} className="bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(expandedId === tenant.id ? null : tenant.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${tenant.is_active === false ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'}`}>
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{tenant.name}</h3>
                        <p className="text-xs text-slate-500 capitalize">{tenant.plan_tier || 'Starter'} Plan</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === tenant.id ? 'rotate-180' : ''}`} />
                  </div>

                  {expandedId === tenant.id && (
                    <div className="px-4 pb-4 pt-0 space-y-3 animate-fadeIn">
                      <div className="pt-3 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-slate-500">Status</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full font-bold capitalize ${tenant.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {tenant.subscription_status}
                          </span>
                        </div>
                        <div>
                          <p className="text-slate-500">Joined</p>
                          <p className="mt-1 font-medium text-slate-900 dark:text-white">{formatDate(tenant.created_at)}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Mail className="w-3.5 h-3.5" /> {tenant.contact_email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Phone className="w-3.5 h-3.5" /> {tenant.contact_phone || 'N/A'}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTenant(tenant);
                        }}
                        className="w-full mt-2 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Manage Tenant
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Details</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trial Expiry</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Billing</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        Loading tenants...
                      </td>
                    </tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
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
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                              <Mail className="h-3 w-3" />
                              {tenant.contact_email || 'No email'}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                              <Phone className="h-3 w-3" />
                              {tenant.contact_phone || 'No phone'}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {(() => {
                            const daysLeft = calculateTrialDaysLeft(tenant);
                            const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
                            const isExpired = daysLeft <= 0;
                            return tenant.trial_ends_at ? (
                              <div className="flex flex-col">
                                <span className={`${isExpired ? 'text-red-600 font-bold' : isExpiringSoon ? 'text-amber-600 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {formatDate(tenant.trial_ends_at)}
                                </span>
                                {isExpired && <span className="text-xs text-red-500">Trial Ended</span>}
                                {isExpiringSoon && !isExpired && <span className="text-xs text-amber-500">{daysLeft} days left</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 capitalize">
                          {tenant.billing_cycle || 'Monthly'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(tenant.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleSendReminder(tenant)}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 mr-4"
                            title="Send Expiry Reminder"
                          >
                            <Bell className="w-5 h-5" />
                          </button>
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
        </div>

        {/* Modal Section Controller */}
        <div className="modals-container">
          {/* Tenant Details Modal */}
          {selectedTenant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-slideUp border border-slate-200 dark:border-white/10">
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
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
                  {/* Status & Plan Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Subscription</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${selectedTenant.subscription_status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        <span className="font-bold text-slate-900 dark:text-white capitalize">{selectedTenant.subscription_status}</span>
                      </div>
                      <button
                        onClick={() => handleSendReminder(selectedTenant)}
                        style={{ marginTop: '0.75rem' }}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors border border-indigo-200 dark:border-indigo-500/30 rounded px-2 py-1 bg-indigo-50 dark:bg-indigo-900/10"
                      >
                        <Bell className="w-3 h-3" />
                        Send Reminder
                      </button>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Plan Tier</p>
                      <p className="mt-1 font-bold text-slate-900 dark:text-white capitalize">{selectedTenant.plan_tier || 'Starter'} <span className="text-xs font-normal text-slate-500">({selectedTenant.billing_cycle || 'monthly'})</span></p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Contact Details</p>
                      <div className="mt-1 space-y-2">
                        <div className="flex items-start gap-2 text-sm text-slate-900 dark:text-white group">
                          <Mail className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span className="break-all font-medium" title={selectedTenant.contact_email}>
                            {selectedTenant.contact_email || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">
                            {selectedTenant.contact_phone || 'N/A'}
                          </span>
                        </div>
                      </div>
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

                  {/* Payment History Section */}
                  <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-500" />
                      Payment History
                    </h4>

                    {historyLoading ? (
                      <div className="text-center py-4 text-slate-500 text-sm">Loading payments...</div>
                    ) : billingHistory.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                              <th className="px-4 py-2">Date</th>
                              <th className="px-4 py-2">Description</th>
                              <th className="px-4 py-2">Amount</th>
                              <th className="px-4 py-2">Payment ID</th>
                              <th className="px-4 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {billingHistory.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{formatDate(item.created_at)}</td>
                                <td className="px-4 py-2 text-slate-900 dark:text-white font-medium">{item.description}</td>
                                <td className="px-4 py-2 text-slate-900 dark:text-white font-bold">₹{item.amount}</td>
                                <td className="px-4 py-2 text-xs font-mono text-slate-500">{item.payment_id}</td>
                                <td className="px-4 py-2">
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 capitalize">
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5 text-center text-slate-500 text-sm">
                        No payment history found for this tenant.
                      </div>
                    )}
                  </div>

                  {/* Feature Controls Section */}
                  <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-500" />
                      Feature Controls
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {['crm', 'inventory', 'reports', 'site_visits', 'incentives'].map((feature) => (
                        <div key={feature} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10">
                          <span className="text-sm font-medium text-slate-700 dark:text-gray-300 capitalize">{feature.replace('_', ' ')}</span>
                          <button
                            onClick={async () => {
                              const currentSettings = selectedTenant.settings || {
                                features: { crm: true, inventory: true, reports: true, site_visits: true, incentives: true },
                                appearance: { primary_color: '#1673FF', logo_url: null },
                                incentive_plan: { type: 'fixed', rules: {} }
                              };
                              const newFeatures = { ...currentSettings.features, [feature]: !currentSettings.features[feature as keyof typeof currentSettings.features] };
                              const newSettings = { ...currentSettings, features: newFeatures };

                              const { error } = await supabase
                                .from('tenants')
                                .update({ settings: newSettings })
                                .eq('id', selectedTenant.id);

                              if (!error) {
                                setSelectedTenant({ ...selectedTenant, settings: newSettings });
                                setTenants(prev => prev.map(t => t.id === selectedTenant.id ? { ...t, settings: newSettings } : t));
                              }
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${selectedTenant.settings?.features?.[feature as keyof typeof selectedTenant.settings.features] !== false ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${selectedTenant.settings?.features?.[feature as keyof typeof selectedTenant.settings.features] !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Customization: Incentive Plan */}
                  <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Incentive Plan Configuration
                    </h4>
                    <div className="p-4 bg-amber-50/50 dark:bg-amber-900/5 rounded-lg border border-amber-100 dark:border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-amber-900 dark:text-amber-200">Current Plan Type</span>
                        <select
                          value={selectedTenant.settings?.incentive_plan?.type || 'fixed'}
                          onChange={async (e) => {
                            const currentSettings = selectedTenant.settings || {
                              features: { crm: true, inventory: true, reports: true, site_visits: true, incentives: true },
                              appearance: { primary_color: '#1673FF', logo_url: null },
                              incentive_plan: { type: 'fixed', rules: {} }
                            };
                            const newSettings = { ...currentSettings, incentive_plan: { ...currentSettings.incentive_plan, type: e.target.value } };
                            const { error } = await supabase.from('tenants').update({ settings: newSettings }).eq('id', selectedTenant.id);
                            if (!error) {
                              setSelectedTenant({ ...selectedTenant, settings: newSettings });
                            }
                          }}
                          className="text-sm px-2 py-1 bg-white dark:bg-slate-800 border rounded-md"
                        >
                          <option value="fixed">Standard (Fixed Installments)</option>
                          <option value="slab">Slab-Based (Revenue Tiers)</option>
                          <option value="custom">Custom (JSON Rules)</option>
                        </select>
                      </div>
                      <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
                        {selectedTenant.settings?.incentive_plan?.type === 'custom'
                          ? 'This client uses a fully custom incentive engine. Edit rules directly in the database for now.'
                          : 'Standard incentive logic applied. Plan type affects how payouts are calculated for this tenant.'}
                      </p>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/10 pb-4">
                    <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-4">Danger Zone</h4>
                    <div className="space-y-4">
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

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">
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

                      <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
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
            </div>
          )}

          {/* Custom Password Reset Modal */}
          {resetModalOpen && selectedTenant && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scaleIn border border-slate-200 dark:border-slate-700">
                <div className="relative bg-indigo-600 p-6 text-center overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">Tenant Management</h1>
                      <p className="text-white/80">Manage companies, subscriptions, and platform access.</p>
                    </div>
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
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() => setResetModalOpen(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmResetPassword}
                      disabled={resetLoading || resetPassword.length < 6}
                      className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                    >
                      {resetLoading ? 'Updating...' : 'Confirm Reset'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Delete Confirmation Modal */}
          {deleteModalOpen && selectedTenant && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scaleIn border-2 border-red-500/50">
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
                      <p className="text-sm font-bold text-red-800 dark:text-red-200">Warning: Action irreversible.</p>
                      <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                        Deletes all data associated with <strong>{selectedTenant.name}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Type company slug <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-900">{selectedTenant.slug}</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteSlugInput}
                      onChange={(e) => setDeleteSlugInput(e.target.value)}
                      className="block w-full px-4 py-3 rounded-lg border-2 border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                      placeholder={`Type "${selectedTenant.slug}" here`}
                    />
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() => setDeleteModalOpen(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteTenant}
                      disabled={deleteSlugInput !== selectedTenant.slug || loading}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg shadow-red-500/30 disabled:opacity-50"
                    >
                      {loading ? 'Deleting...' : 'DELETE FOREVER'}
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
    </div>
  );
}
