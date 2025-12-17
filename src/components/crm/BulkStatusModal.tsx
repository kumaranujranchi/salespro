import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { LeadStatus } from '../../types/database';

interface BulkStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadIds: string[];
  onSuccess: () => void;
}

export function BulkStatusModal({ isOpen, onClose, leadIds, onSuccess }: BulkStatusModalProps) {
  const { profile } = useAuth();
  const dialog = useDialog();
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [loading, setLoading] = useState(false);

  const statuses: LeadStatus[] = [
    'New', 'Contacted', 'Qualified', 'In Progress',
    'Site Visit Scheduled', 'Site Visit Done',
    'Lost', 'Disqualified', 'Converted'
  ];

  const handleUpdate = async () => {
    if (!status) {
      await dialog.alert('Please select a status', { variant: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          lead_status: status,
          updated_by: profile?.id
        })
        .in('id', leadIds);

      if (error) throw error;

      await dialog.alert(`Successfully updated status for ${leadIds.length} leads!`, { variant: 'success' });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Status update error", error);
      await dialog.alert('Failed to update status', { variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Status for ${leadIds.length} Leads`} size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select New Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            <option value="">-- Select Status --</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate} disabled={loading || !status}>
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
