import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';

interface BulkProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadIds: string[];
  onSuccess: () => void;
}

export function BulkProjectModal({ isOpen, onClose, leadIds, onSuccess }: BulkProjectModalProps) {
  const { profile } = useAuth();
  const dialog = useDialog();

  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);

  // Convex Queries
  const projects = useQuery(api.projects.listRunningProjects, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");

  // Convex Mutations
  const bulkUpdateLeadProject = useMutation(api.leads.bulkUpdateLeadProject);

  const handleAssign = async () => {
    if (!selectedProject) {
      await dialog.alert('Please select a project', { variant: 'danger' });
      return;
    }

    setLoading(true);
    try {
      await bulkUpdateLeadProject({
        ids: leadIds.map(id => id as Id<"leads">),
        project_id: selectedProject as Id<"projects">,
        updated_by: profile?.id as Id<"profiles">
      });

      await dialog.alert(`Successfully assigned project for ${leadIds.length} leads!`, { variant: 'success' });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Project assignment error", error);
      await dialog.alert('Failed to assign project', { variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Project to ${leadIds.length} Leads`} size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            <option value="">-- Select Project --</option>
            {projects?.map((proj) => (
              <option key={proj._id} value={proj._id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAssign} disabled={loading || !selectedProject}>
            {loading ? 'Assigning...' : 'Assign Project'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
