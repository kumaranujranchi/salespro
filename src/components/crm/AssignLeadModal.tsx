import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
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

  const [selectedExecutive, setSelectedExecutive] = useState('');
  const [loading, setLoading] = useState(false);

  // Convex Queries
  const executives = useQuery(api.profiles.listActiveStaff, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");

  // Convex Mutations
  const bulkAssignLeads = useMutation(api.leads.bulkAssignLeads);

  const handleAssign = async () => {
    if (!selectedExecutive) {
      await dialog.alert('Please select a sales executive', { variant: 'danger' });
      return;
    }

    setLoading(true);
    try {
      await bulkAssignLeads({
        ids: leadIds.map(id => id as Id<"leads">),
        sales_executive_id: selectedExecutive as Id<"profiles">,
        updated_by: profile?.id as Id<"profiles">
      });

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
            {executives?.map((exec) => (
              <option key={exec._id} value={exec._id}>
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
