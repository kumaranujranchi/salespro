import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalFooter } from '../ui/Modal';
import { Toast, ToastType } from '../ui/Toast';
import { Plus, Copy, ToggleLeft, ToggleRight, Mail, Pencil, BarChart2, Calendar, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface Campaign {
  id: string;
  code: string;
  name: string;
  referrer_email?: string;
  referrer_commission_percent: number;
  referee_discount_percent: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export function ReferralCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    referrerEmail: '',
    referrerCommission: 20,
    refereeDiscount: 10
  });

  // Stats Modal State
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<{
    totalSignups: number;
    totalEarnings: number;
    ledger: any[];
    loading: boolean;
  }>({
    totalSignups: 0,
    totalEarnings: 0,
    ledger: [],
    loading: false
  });

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('referral_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setCampaigns(data);
    }
    setLoading(false);
  };

  const handleEdit = (campaign: Campaign) => {
      setEditingId(campaign.id);
      setFormData({
          code: campaign.code,
          name: campaign.name,
          referrerEmail: campaign.referrer_email || '',
          referrerCommission: campaign.referrer_commission_percent,
          refereeDiscount: campaign.referee_discount_percent
      });
      setShowAddModal(true);
  };

  const openCreateModal = () => {
      setEditingId(null);
      setFormData({ code: '', name: '', referrerEmail: '', referrerCommission: 20, refereeDiscount: 10 });
      setShowAddModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        referrer_email: formData.referrerEmail || null,
        referrer_commission_percent: formData.referrerCommission,
        referee_discount_percent: formData.refereeDiscount,
        is_active: true
      };

      let error;
      if (editingId) {
          // Update
          const { error: updateError } = await supabase
            .from('referral_campaigns')
            .update(payload)
            .eq('id', editingId);
          error = updateError;
      } else {
          // Create
          const { error: insertError } = await supabase
            .from('referral_campaigns')
            .insert(payload);
          error = insertError;
      }

      if (error) throw error;

      setShowAddModal(false);
      fetchCampaigns();
      
      showToast(editingId ? 'Campaign updated successfully!' : 'Campaign created successfully!', 'success');
      
    } catch (error: any) {
      showToast('Error saving campaign: ' + error.message, 'error');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('referral_campaigns').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
        fetchCampaigns();
        showToast(currentStatus ? 'Campaign deactivated' : 'Campaign activated', 'info');
    } else {
        showToast('Failed to update status', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Referral code copied!', 'success');
  };

  const handleViewStats = async (campaign: Campaign) => {
      setSelectedCampaign(campaign);
      setDataModalOpen(true);
      setStats({ totalSignups: 0, totalEarnings: 0, ledger: [], loading: true });

      // Fetch Stats
      try {
          // 1. Get User Referrals (Signups)
          const { data: referrals, error: refError } = await supabase
            .from('user_referrals')
            .select('id, created_at')
            .eq('campaign_id', campaign.id);
          
          if (refError) throw refError;

          const referralIds = referrals?.map(r => r.id) || [];
          
          // 2. Get Commissions (Transactions)
          let ledgerData: any[] = [];
          
          if (referralIds.length > 0) {
             const { data: comms, error: commError } = await supabase
                .from('commissions')
                .select('*')
                .in('referral_id', referralIds)
                .order('created_at', { ascending: false });
             
             if (commError) throw commError;
             ledgerData = comms || [];
          }

          const totalEarnings = ledgerData.reduce((sum, item) => sum + Number(item.amount), 0);

          setStats({
              totalSignups: referrals?.length || 0,
              totalEarnings,
              ledger: ledgerData,
              loading: false
          });

      } catch (err: any) {
          console.error(err);
          showToast('Failed to fetch stats', 'error');
          setStats(prev => ({ ...prev, loading: false }));
      }
  };

  const handleDelete = async (campaign: Campaign) => {
    if (!window.confirm(`Are you sure you want to delete the campaign "${campaign.name}"? This will delete ALL associated referrals, commissions, and the affiliate account.`)) {
      return;
    }

    try {
      // 1. Get Referrals to find Tenants
      const { data: referrals } = await supabase
        .from('user_referrals')
        .select('id, referred_tenant_id')
        .eq('campaign_id', campaign.id);

      const tenantIds = referrals?.map(r => r.referred_tenant_id).filter(Boolean) || [];
      const referralIds = referrals?.map(r => r.id) || [];

      // 2. Delete Commissions
      if (referralIds.length > 0) {
        await supabase.from('commissions').delete().in('referral_id', referralIds);
      }

      // 3. Delete Referrals (Explicit delete if not covered by tenant cascade, just in case)
      await supabase.from('user_referrals').delete().eq('campaign_id', campaign.id);

      // 4. Delete Tenants (This cascades to referrals if constraint exists, but we did step 3 to be safe)
      if (tenantIds.length > 0) {
        await supabase.from('tenants').delete().in('id', tenantIds);
      }

      // 5. Delete Campaign
      const { error: campaignError } = await supabase.from('referral_campaigns').delete().eq('id', campaign.id);
      if (campaignError) throw campaignError;

      // 6. Delete Affiliate Profile (if campaign created by an affiliate)
      if (campaign.created_by) {
         // Fetch profile role first using created_by (which is the user_id)
         const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', campaign.created_by)
            .maybeSingle();
         
         if (profile && profile.role === 'affiliate') {
             // Safe to delete this test affiliate profile
             await supabase.from('profiles').delete().eq('id', campaign.created_by);
         }
      }

      showToast('Campaign and associated test data deleted successfully', 'success');


    } catch (error: any) {
      showToast('Error deleting campaign: ' + error.message, 'error');
    }
    // Re-fetch
    fetchCampaigns();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-end">
        <Button onClick={openCreateModal} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Create New Campaign
        </Button>
      </div>

      {campaigns.length === 0 && !loading && (
             <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700">
               <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No campaigns found</h3>
               <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new referral campaign.</p>
             </div>
      )}

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-4">
        {loading ? (
             <div className="text-center py-4">Loading...</div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {campaign.name}
                   </h3>
                   {campaign.referrer_email && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3" />
                        {campaign.referrer_email}
                      </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => toggleStatus(campaign.id, campaign.is_active)} className="focus:outline-none">
                      {campaign.is_active ? (
                        <ToggleRight className="w-8 h-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-2 rounded mb-3">
                 <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">{campaign.code}</span>
                 <div className="flex gap-3">
                     <button onClick={() => copyToClipboard(campaign.code)} className="text-indigo-600 hover:text-indigo-900">
                          <Copy className="w-4 h-4" />
                     </button>
                     <button onClick={() => handleEdit(campaign)} className="text-blue-600 hover:text-blue-900">
                          <Pencil className="w-4 h-4" />
                     </button>
                     <button onClick={() => handleViewStats(campaign)} className="text-emerald-600 hover:text-emerald-900">
                          <BarChart2 className="w-4 h-4" />
                     </button>
                     <button onClick={() => handleDelete(campaign)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                     </button>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                 <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase">Commission</span>
                    <span className="font-medium">{campaign.referrer_commission_percent}%</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase">Discount</span>
                    <span className="font-medium">{campaign.referee_discount_percent}%</span>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Referrer / Campaign</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Commission</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : campaigns.length === 0 ? (
               <tr></tr> 
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div>{campaign.name}</div>
                    {campaign.referrer_email && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {campaign.referrer_email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded inline-block mt-2">{campaign.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{campaign.referrer_commission_percent}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{campaign.referee_discount_percent}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <button onClick={() => toggleStatus(campaign.id, campaign.is_active)} className="focus:outline-none">
                      {campaign.is_active ? (
                        <ToggleRight className="w-8 h-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                        <button onClick={() => copyToClipboard(campaign.code)} className="text-indigo-600 hover:text-indigo-900" title="Copy Code">
                        <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(campaign)} className="text-blue-600 hover:text-blue-900" title="Edit Campaign">
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleViewStats(campaign)} className="text-emerald-600 hover:text-emerald-900" title="View Stats">
                            <BarChart2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(campaign)} className="text-red-600 hover:text-red-900" title="Delete Campaign">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editingId ? "Edit Campaign" : "Create New Referral"}>
        <div className="space-y-4">
          <Input
            label="Referrer Name / Campaign Name"
            placeholder="e.g. John Doe (YouTuber) or Summer Sale"
            value={formData.name}
            onChange={(e) => {
              const newName = e.target.value;
              setFormData(prev => ({ ...prev, name: newName }));
              
              if (!editingId && !formData.code) { // Only auto-generate if new and code empty
                  const cleanName = newName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6);
                  const randomSuffix = cleanName ? Math.floor(1000 + Math.random() * 9000) : '';
                  const generatedCode = cleanName ? `${cleanName}${randomSuffix}` : '';
                  setFormData(prev => ({ ...prev, code: generatedCode }));
              }
            }}
            required
            helperText="Identify who this code belongs to."
          />
          <Input
            label="Referrer Email (Optional)"
            placeholder="e.g. john@example.com"
            type="email"
            value={formData.referrerEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, referrerEmail: e.target.value }))}
            helperText="We will send referral notifications to this email."
          />
          <Input
            label="Referral Code"
            placeholder="e.g. SAVE20"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            required
            helperText="This is the code users will enter."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Referrer Commission (%)"
              type="number"
              value={formData.referrerCommission.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, referrerCommission: parseFloat(e.target.value) }))}
              required
            />
            <Input
              label="Referee Discount (%)"
              type="number"
              value={formData.refereeDiscount.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, refereeDiscount: parseFloat(e.target.value) }))}
              required
            />
          </div>
        </div>
        <ModalFooter>
          <Button onClick={() => setShowAddModal(false)} className="bg-gray-200 text-gray-800">Cancel</Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {editingId ? "Update Campaign" : "Create Campaign"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Stats Modal */}
      <Modal isOpen={dataModalOpen} onClose={() => setDataModalOpen(false)} title={`Campaign Stats: ${selectedCampaign?.name} (${selectedCampaign?.code})`}>
         {stats.loading ? (
             <div className="py-12 text-center text-gray-500">Loading stats...</div>
         ) : (
             <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800 text-center">
                         <h4 className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Total Signups</h4>
                         <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalSignups}</p>
                     </div>
                     <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 text-center">
                         <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Total Earnings</h4>
                         <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(stats.totalEarnings)}</p>
                     </div>
                 </div>

                 <div>
                     <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                         <Calendar className="w-4 h-4" /> Transaction History
                     </h4>
                     {stats.ledger.length === 0 ? (
                         <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-500">No transactions yet</div>
                     ) : (
                         <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                 <thead className="bg-gray-50 dark:bg-gray-800">
                                     <tr>
                                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                         <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                                         <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Status</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                     {stats.ledger.map((item, idx) => (
                                         <tr key={idx}>
                                             <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                 {new Date(item.created_at).toLocaleDateString()}
                                             </td>
                                             <td className="px-4 py-2 text-sm font-medium text-right text-gray-900 dark:text-white whitespace-nowrap">
                                                 {formatCurrency(Number(item.amount))}
                                             </td>
                                             <td className="px-4 py-2 text-center whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    item.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {item.status}
                                                </span>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     )}
                 </div>
             </div>
         )}
         <ModalFooter>
             <Button onClick={() => setDataModalOpen(false)} className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300">Close</Button>
         </ModalFooter>
      </Modal>

      {/* Toast Notification */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
}
