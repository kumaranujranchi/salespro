import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
} from 'lucide-react';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// ... (interfaces)
// ... (previous imports)

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Overview</h1>
        <p className="text-slate-500 dark:text-slate-400">Monitor SaaS growth and tenant health.</p>
      </div>

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
        {/* ... (Keep existing list header) ... */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Tenants</h2>
           <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-surface-highlight p-1 rounded-lg">
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white dark:bg-surface-dark shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('trial')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'trial' ? 'bg-white dark:bg-surface-dark shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
              >
                Trials
              </button>
              <button 
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'active' ? 'bg-white dark:bg-surface-dark shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
              >
                Active
              </button>
            </div>
          </div>
        </div>

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
      </div>

      {/* Tenant Details Modal */}
      {selectedTenant && (
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
                     className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                       selectedTenant.is_active === false 
                       ? 'bg-green-600 hover:bg-green-700 text-white' 
                       : 'bg-red-600 hover:bg-red-700 text-white'
                     }`}
                   >
                      {selectedTenant.is_active === false ? 'ACTIVATE' : 'DEACTIVATE'}
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
