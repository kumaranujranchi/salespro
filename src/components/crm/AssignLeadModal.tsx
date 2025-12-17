import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';

interface AssignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadIds: string[];
  onSuccess: () => void;
}

export function AssignLeadModal({ isOpen, onClose, leadIds, onSuccess }: AssignLeadModalProps) {
  const { profile } = useAuth();
  const dialog = useDialog();
  const [executives, setExecutives] = useState<any[]>([]);
  const [selectedExecutive, setSelectedExecutive] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadExecutives();
    }
  }, [isOpen]);

  const loadExecutives = async () => {
    if (!profile) return;

    // Fetch users with role sales_executive or team_leader
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('tenant_id', profile.tenant_id)
      .in('role', ['sales_executive', 'team_leader', 'admin'])
      .order('full_name');

    if (data) setExecutives(data);
  };

  const handleAssign = async () => {
    if (!selectedExecutive) {
      await dialog.alert('Please select a sales executive', { variant: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          sales_executive_id: selectedExecutive,
          updated_by: profile?.id
        })
        .in('id', leadIds);

      if (error) throw error;

      await dialog.alert(`Successfully assigned ${leadIds.length} leads!`, { variant: 'success' });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Assignment error", error);
      await dialog.alert('Failed to assign leads', { variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign ${leadIds.length} Leads`} size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Sales Executive
          </label>
          <select
            value={selectedExecutive}
            onChange={(e) => setSelectedExecutive(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            <option value="">-- Select Executive --</option>
            {executives.map((exec) => (
              <option key={exec.id} value={exec.id}>
                {exec.full_name} ({exec.email})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAssign} disabled={loading || !selectedExecutive}>
            {loading ? 'Assigning...' : 'Assign Leads'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
