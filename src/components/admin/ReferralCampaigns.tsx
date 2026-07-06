import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalFooter } from '../ui/Modal';
import { Toast, ToastType } from '../ui/Toast';
import { Plus, Copy, ToggleLeft, ToggleRight, Mail, Pencil, BarChart2, Calendar, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function ReferralCampaigns() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id as Id<"tenants">;

  // Convex Queries
  const campaigns = useQuery(api.referrals.listCampaigns, tenantId ? { tenant_id: tenantId } : "skip");
  
  // Convex Mutations
  const createCampaign = useMutation(api.referrals.createCampaign);
  const updateCampaignMutation = useMutation(api.referrals.updateCampaign);
  const toggleStatusMutation = useMutation(api.referrals.toggleCampaignStatus);
  const deleteCampaignMutation = useMutation(api.referrals.deleteCampaign);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<Id<"referral_campaigns"> | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    referrerEmail: '',
    referrerCommission: 20,
    refereeDiscount: 10
  });

  // Stats Modal State
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  // Since we can't easily fetch stats in a hook and pass it around inside a map
  // we'll use a manual fetch with ctx.db.get if we had a sub-query, but in Convex 
  // it's better to use another query hook with a skip condition for the selected campaign.
  const campaignStats = useQuery(api.referrals.getCampaignStats, 
    selectedCampaign ? { campaign_id: selectedCampaign._id } : "skip"
  );

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const handleEdit = (campaign: any) => {
      setEditingId(campaign._id);
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
        tenant_id: tenantId,
        code: formData.code.toUpperCase(),
        name: formData.name,
        referrer_email: formData.referrerEmail || undefined,
        referrer_commission_percent: formData.referrerCommission,
        referee_discount_percent: formData.refereeDiscount,
        is_active: true,
        created_by: (profile as any)?._id
      };

      if (editingId) {
        await updateCampaignMutation({
          id: editingId,
          ...payload
        });
      } else {
        await createCampaign(payload);
      }

      setShowAddModal(false);
      showToast(editingId ? 'Campaign updated successfully!' : 'Campaign created successfully!', 'success');
      
    } catch (error: any) {
      showToast('Error saving campaign: ' + error.message, 'error');
    }
  };

  const toggleStatus = async (id: Id<"referral_campaigns">, currentStatus: boolean) => {
    try {
      await toggleStatusMutation({ id, is_active: !currentStatus });
      showToast(currentStatus ? 'Campaign deactivated' : 'Campaign activated', 'info');
    } catch (error: any) {
      showToast('Failed to update status', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Referral code copied!', 'success');
  };

  const handleDelete = async (campaign: any) => {
    if (!window.confirm(`Are you sure you want to delete the campaign "${campaign.name}"? This will delete ALL associated referrals and commissions.`)) {
      return;
    }

    try {
      await deleteCampaignMutation({ id: campaign._id });
      showToast('Campaign and associated data deleted successfully', 'success');
    } catch (error: any) {
      showToast('Error deleting campaign: ' + error.message, 'error');
    }
  };

  if (campaigns === undefined) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-end">
        <Button onClick={openCreateModal} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Create New Campaign
        </Button>
      </div>

      {campaigns.length === 0 && (
             <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700">
               <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No campaigns found</h3>
               <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new referral campaign.</p>
             </div>
      )}

      {/* Campaign Cards/Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <div key={campaign._id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 border border-gray-200 dark:border-gray-700">
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
                  <button onClick={() => toggleStatus(campaign._id, campaign.is_active)} className="focus:outline-none">
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
                   <button onClick={() => { setSelectedCampaign(campaign); setDataModalOpen(true); }} className="text-emerald-600 hover:text-emerald-900">
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
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editingId ? "Edit Campaign" : "Create New Referral"}>
        <div className="space-y-4">
          <Input
            label="Referrer Name / Campaign Name"
            placeholder="e.g. Rahul Sharma (YouTuber) or Summer Sale"
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
            placeholder="e.g. rahul@example.com"
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
         {campaignStats === undefined ? (
             <div className="py-12 text-center text-gray-500">Loading stats...</div>
         ) : (
             <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800 text-center">
                         <h4 className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Total Signups</h4>
                         <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{campaignStats.totalSignups}</p>
                     </div>
                     <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 text-center">
                         <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Total Earnings</h4>
                         <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(campaignStats.totalEarnings)}</p>
                     </div>
                 </div>

                 <div>
                     <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                         <Calendar className="w-4 h-4" /> Transaction History
                     </h4>
                     {campaignStats.ledger.length === 0 ? (
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
                                     {campaignStats.ledger.map((item: any, idx: number) => (
                                         <tr key={idx}>
                                             <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                 {new Date(item._creationTime).toLocaleDateString()}
                                             </td>
                                             <td className="px-4 py-2 text-sm font-medium text-right text-gray-900 dark:text-white whitespace-nowrap">
                                                 {formatCurrency(item.amount)}
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
