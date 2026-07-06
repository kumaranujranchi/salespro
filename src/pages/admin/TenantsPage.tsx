import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { useToast } from '../../contexts/ToastContext';
import { useDialog } from '../../contexts/DialogContext';
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
  Eye,
  EyeOff,
  KeyRound,
  Zap,
  Award
} from 'lucide-react';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};


export function TenantsPage() {
  const tenantsData = useQuery(api.tenants.list);
  const registerTenantMutation = useMutation(api.tenants.register);
  const updateTenantMutation = useMutation(api.tenants.update);
  const removeTenantMutation = useMutation(api.tenants.remove);
  const resetPasswordMutation = useMutation(api.tenants.resetUserPassword);
  const sendEmailAction = useAction(api.emails.sendEmail);

  const toast = useToast();
  const dialog = useDialog();
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [incentiveRuleStr, setIncentiveRuleStr] = useState('');
  const [filter, setFilter] = useState('all');

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

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSlugInput, setDeleteSlugInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Billing History via Convex Query
  const billingHistory = useQuery(api.tenants.listBillingHistory, 
    selectedTenant?._id ? { tenant_id: selectedTenant._id } : "skip" as any
  );

  useEffect(() => {
    if (selectedTenant && selectedTenant.settings?.incentive_plan?.rules) {
      setIncentiveRuleStr(JSON.stringify(selectedTenant.settings.incentive_plan.rules, null, 2));
    } else {
      setIncentiveRuleStr('{}');
    }
  }, [selectedTenant]);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantData.companyName || !newTenantData.email || !newTenantData.password) {
      toast.error('Please fill required fields.');
      return;
    }

    try {
      setAddTenantLoading(true);
      await registerTenantMutation({
        company_name: newTenantData.companyName,
        company_slug: newTenantData.companySlug,
        user_full_name: newTenantData.adminName,
        contact_email: newTenantData.email,
        contact_phone: newTenantData.phone,
        referral_code: newTenantData.referralCode,
        userId: newTenantData.email, // Simulation
      });

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
      toast.success(`${newTenantData.companyName} onboarded.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to onboard tenant.');
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

  const toggleTenantStatus = async (tenant: any) => {
    const isSuspended = tenant.is_active === false;
    const confirmed = await dialog.confirm(`Are you sure you want to ${isSuspended ? 'ACTIVATE' : 'DEACTIVATE'} this tenant?`, {
      variant: isSuspended ? 'default' : 'danger'
    });
    if (!confirmed) return;

    try {
      const newStatus = tenant.is_active === false;
      await updateTenantMutation({
        id: tenant._id,
        is_active: newStatus
      });
      toast.success(`Tenant ${newStatus ? 'Activated' : 'Deactivated'} successfully.`);
    } catch (error) {
      toast.error('Failed to update tenant status.');
    }
  };

  const handleSendReminder = async (tenant: any) => {
    if (!tenant.contact_email) {
      toast.error('No contact email.');
      return;
    }
    const confirmed = await dialog.confirm(`Send reminder to ${tenant.contact_email}?`);
    if (!confirmed) return;

    try {
      await sendEmailAction({
        type: 'SUBSCRIPTION_REMINDER',
        email: tenant.contact_email,
        name: tenant.name,
        data: {
          daysRemaining: calculateTrialDaysLeft(tenant),
          planName: tenant.plan_tier || 'RealSalePro',
          expiryDate: tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString() : 'N/A'
        }
      });
      toast.success('Reminder sent.');
    } catch (error) {
      toast.error('Failed to send email.');
    }
  };

  const calculateTrialDaysLeft = (tenant: any) => {
    let endDate: Date;
    if (tenant.trial_ends_at) {
      endDate = new Date(tenant.trial_ends_at);
    } else {
      const start = new Date(tenant._creationTime);
      endDate = new Date(start);
      endDate.setDate(start.getDate() + 30);
    }
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const openResetPasswordModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setResetPassword('');
    setResetModalOpen(true);
    setTimeout(() => passwordInputRef.current?.focus(), 100);
  };

  const confirmResetPassword = async () => {
    if (!selectedTenant) return;
    if (resetPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      setResetLoading(true);
      await resetPasswordMutation({
        userId: selectedTenant.owner_id || selectedTenant.contact_email,
        newPassword: resetPassword
      });
      setResetModalOpen(false);
      setResetPassword('');
      toast.success('Password reset command sent.');
    } catch (error: any) {
      toast.error('Failed to reset password.');
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
      toast.error('Slug mismatch.');
      return;
    }

    try {
      setAddTenantLoading(true);
      await removeTenantMutation({ id: selectedTenant._id });
      setDeleteModalOpen(false);
      setSelectedTenant(null);
      toast.success('Tenant removed.');
    } catch (error: any) {
      toast.error('Failed to delete tenant.');
    } finally {
      setAddTenantLoading(false);
    }
  };

  const filteredTenants = (tenantsData || []).filter((t: any) => {
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
              {filteredTenants.map((tenant: any) => (
                <div key={tenant._id} className="bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(expandedId === tenant._id ? null : tenant._id)}
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
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === tenant._id ? 'rotate-180' : ''}`} />
                  </div>

                  {expandedId === tenant._id && (
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
                          <p className="mt-1 font-medium text-slate-900 dark:text-white">{formatDate(new Date(tenant._creationTime).toISOString())}</p>
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
                  {tenantsData === undefined ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        Loading tenants...
                      </td>
                    </tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        No tenants found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((tenant: any) => (
                      <tr key={tenant._id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${tenant.is_active === false ? 'opacity-60 bg-slate-50' : ''}`}>
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
                          {formatDate(new Date(tenant._creationTime).toISOString())}
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
        </div>

        {/* Manage Tenant Detail Overlay */}
        {selectedTenant && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#1e1e2d] w-full max-w-2xl h-full flex flex-col shadow-2xl animate-slideIn">
              <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xl">
                    {selectedTenant.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedTenant.name}</h2>
                    <p className="text-indigo-100 text-sm opacity-80">{selectedTenant.slug}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTenant(null)} 
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Feature Controls */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Feature Access Control
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {['crm', 'inventory', 'reports', 'site_visits', 'incentives'].map((feature) => {
                      const isEnabled = selectedTenant.settings?.features?.[feature] !== false;
                      return (
                        <div key={feature} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{feature.replace('_', ' ')}</p>
                          </div>
                          <button
                            onClick={async () => {
                              const newFeatures = { 
                                ...(selectedTenant.settings?.features || {}), 
                                [feature]: !isEnabled 
                              };
                              const newSettings = { ...selectedTenant.settings, features: newFeatures };
                              try {
                                await updateTenantMutation({
                                  id: selectedTenant._id,
                                  settings: newSettings
                                });
                                toast.success(`${feature} ${!isEnabled ? 'enabled' : 'disabled'}`);
                              } catch (e) {
                                toast.error('Failed to update features');
                              }
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Billing History Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-indigo-500" />
                    Payment History
                  </h3>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 dark:bg-white/5">
                        <tr>
                          <th className="px-4 py-3 text-slate-500">Date</th>
                          <th className="px-4 py-3 text-slate-500">Amount</th>
                          <th className="px-4 py-3 text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                        {billingHistory === undefined ? (
                          <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr>
                        ) : billingHistory.length === 0 ? (
                          <tr><td colSpan={3} className="p-4 text-center opacity-50">No payments found</td></tr>
                        ) : (
                          billingHistory.map((history: any) => (
                            <tr key={history._id}>
                              <td className="px-4 py-3">{formatDate(history.date)}</td>
                              <td className="px-4 py-3 font-bold">₹{history.amount.toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase">Success</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Incentive Configuration Section */}
                <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-white/10 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Incentive Configuration
                    </h3>
                    <select
                      value={selectedTenant.settings?.incentive_plan?.type || 'manual'}
                      onChange={async (e) => {
                        const newType = e.target.value;
                        const newSettings = {
                          ...(selectedTenant.settings || {}),
                          incentive_plan: {
                            ...(selectedTenant.settings?.incentive_plan || {}),
                            type: newType
                          }
                        };
                        try {
                          await updateTenantMutation({
                            id: selectedTenant._id,
                            settings: newSettings
                          });
                          toast.success(`Incentive mode changed to ${newType}`);
                        } catch (e) {
                          toast.error('Failed to update incentive mode');
                        }
                      }}
                      className="text-xs px-2 py-1 bg-white dark:bg-slate-800 border rounded-md"
                    >
                      <option value="manual">Manual Entry</option>
                      <option value="custom">Automated Rules</option>
                    </select>
                  </div>

                  {selectedTenant.settings?.incentive_plan?.type === 'custom' && (
                    <div className="space-y-4 animate-fadeIn">
                       <textarea
                         value={incentiveRuleStr}
                         onChange={(e) => setIncentiveRuleStr(e.target.value)}
                         rows={8}
                         className="w-full font-mono text-xs p-3 bg-white dark:bg-black/40 border border-amber-200 dark:border-white/10 rounded-lg outline-none"
                         placeholder='{ "tiers": [...] }'
                       />
                       <div className="flex justify-end gap-2">
                         <button
                           onClick={async () => {
                             try {
                               const rules = JSON.parse(incentiveRuleStr);
                               const newSettings = {
                                 ...(selectedTenant.settings || {}),
                                 incentive_plan: {
                                   ...(selectedTenant.settings?.incentive_plan || {}),
                                   rules
                                 }
                               };
                               await updateTenantMutation({
                                 id: selectedTenant._id,
                                 settings: newSettings
                               });
                               toast.success('Incentive rules updated');
                             } catch (e) {
                               toast.error('Invalid JSON format');
                             }
                           }}
                           className="px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-md hover:bg-amber-700"
                         >
                           Save Rules
                         </button>
                       </div>
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="pt-8 border-t border-slate-200 dark:border-white/10 space-y-4">
                  <h4 className="text-sm font-bold text-red-600 flex items-center gap-2 uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    Danger Zone
                  </h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Account Status</p>
                        <p className="text-xs text-slate-500">{selectedTenant.is_active !== false ? 'Currently Active' : 'Suspended'}</p>
                      </div>
                      <button
                        onClick={() => toggleTenantStatus(selectedTenant)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold ${selectedTenant.is_active !== false ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
                      >
                        {selectedTenant.is_active !== false ? 'SUSPEND' : 'ACTIVATE'}
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Admin Credentials</p>
                        <p className="text-xs text-slate-500">Reset password for platform owner</p>
                      </div>
                      <button
                        onClick={() => openResetPasswordModal(selectedTenant)}
                        className="px-4 py-2 bg-slate-200 dark:bg-white/10 rounded-lg text-xs font-bold"
                      >
                        RESET PASSWORD
                      </button>
                    </div>

                    <div className="p-4 bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Irreversible Action</p>
                        <p className="text-xs text-red-600">Delete all tenant data</p>
                      </div>
                      <button
                        onClick={handleDeleteTenant}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                      >
                        DELETE TENANT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {resetModalOpen && selectedTenant && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-indigo-600 p-6 text-white text-center">
                <Lock className="w-12 h-12 mx-auto mb-2 opacity-80" />
                <h3 className="text-xl font-bold">Reset Admin Password</h3>
                <p className="text-indigo-100 text-sm">Action for {selectedTenant.name}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border dark:border-slate-600 dark:bg-slate-800"
                    placeholder="New Secure Password"
                    minLength={6}
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-3.5 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setResetModalOpen(false)} className="flex-1 py-2.5 font-bold rounded-lg bg-slate-100 dark:bg-slate-800">Cancel</button>
                  <button 
                    onClick={confirmResetPassword}
                    disabled={resetLoading || resetPassword.length < 6}
                    className="flex-1 py-2.5 font-bold rounded-lg bg-indigo-600 text-white disabled:opacity-50"
                  >
                    {resetLoading ? 'Resetting...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteModalOpen && selectedTenant && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl w-full max-w-md border-2 border-red-500/50 overflow-hidden">
              <div className="bg-red-600 p-6 text-white text-center">
                <Trash2 className="w-12 h-12 mx-auto mb-2 opacity-80" />
                <h3 className="text-xl font-bold">CRITICAL: Delete Tenant</h3>
                <p className="text-red-100 text-sm italic">This action cannot be undone.</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Type <strong className="text-slate-900 dark:text-white">{selectedTenant.slug}</strong> to confirm deletion:
                </p>
                <input
                  type="text"
                  value={deleteSlugInput}
                  onChange={(e) => setDeleteSlugInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-red-100 dark:bg-slate-800 dark:border-red-900/30"
                  placeholder="Enter slug"
                />
                <div className="flex gap-3">
                  <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-2.5 font-bold rounded-lg bg-slate-100 dark:bg-slate-800">Cancel</button>
                  <button 
                    onClick={confirmDeleteTenant}
                    disabled={deleteSlugInput !== selectedTenant.slug || addTenantLoading}
                    className="flex-1 py-2.5 font-bold rounded-lg bg-red-600 text-white disabled:opacity-50"
                  >
                    {addTenantLoading ? 'Deleting...' : 'DELETE FOREVER'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
