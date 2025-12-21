import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
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
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (data) setProjects(data);
  };

  const handleAssign = async () => {
    if (!selectedProject) {
      await dialog.alert('Please select a project', { variant: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          project_id: selectedProject,
          updated_by: profile?.id
        })
        .in('id', leadIds);

      if (error) throw error;

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
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
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
