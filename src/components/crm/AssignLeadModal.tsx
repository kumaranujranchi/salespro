import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { Users } from 'lucide-react';

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
  const executives = useQuery(
    api.profiles.listActiveStaff,
    profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip"
  );

  // Executive lead stats — only Sales Executives
  const executiveStats = useQuery(
    api.leads.getExecutiveLeadStats,
    profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip"
  );

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

  // Build stats lookup map
  const statsMap = new Map(
    (executiveStats || []).map(s => [s.id.toString(), s])
  );

  const selectedStat = selectedExecutive ? statsMap.get(selectedExecutive) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign ${leadIds.length} Lead${leadIds.length > 1 ? 's' : ''} to Executive`} size="md">
      <div className="space-y-4">

        {/* ── Sales Executive Cards — Current Lead Distribution ── */}
        {executiveStats && executiveStats.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users size={13} className="text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Sales Executive — Current Load
              </span>
            </div>

            <div
              className="grid gap-2 max-h-56 overflow-y-auto pr-1"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
            >
              {[...executiveStats]
                .sort((a, b) => a.total - b.total)
                .map((exec) => {
                  const initials = exec.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const isSelected = selectedExecutive === exec.id.toString();

                  return (
                    <div
                      key={exec.id.toString()}
                      onClick={() => setSelectedExecutive(isSelected ? '' : exec.id.toString())}
                      className={`cursor-pointer rounded-xl border p-2.5 transition-all duration-150 select-none ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/25 shadow ring-1 ring-blue-400'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Avatar + name */}
                      <div className="flex items-center gap-2 mb-2">
                        {exec.avatar ? (
                          <img src={exec.avatar} alt={exec.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">
                            {exec.name}
                          </div>
                          <div className="text-[9px] text-gray-400 leading-tight">Sales Executive</div>
                        </div>
                      </div>

                      {/* Total leads count */}
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">Leads</span>
                        <span className={`text-base font-bold leading-none ${isSelected ? 'text-blue-600' : 'text-gray-800 dark:text-white'}`}>
                          {exec.total}
                        </span>
                      </div>

                      {/* Mini status color bar */}
                      {exec.total > 0 ? (
                        <div className="w-full flex h-1 rounded-full overflow-hidden gap-px">
                          {exec.new > 0 && <div className="bg-blue-400" title={`New: ${exec.new}`} style={{ width: `${(exec.new / exec.total) * 100}%` }} />}
                          {exec.contacted > 0 && <div className="bg-yellow-400" title={`Contacted: ${exec.contacted}`} style={{ width: `${(exec.contacted / exec.total) * 100}%` }} />}
                          {exec.inProgress > 0 && <div className="bg-orange-400" title={`In Progress: ${exec.inProgress}`} style={{ width: `${(exec.inProgress / exec.total) * 100}%` }} />}
                          {exec.qualified > 0 && <div className="bg-green-400" title={`Qualified: ${exec.qualified}`} style={{ width: `${(exec.qualified / exec.total) * 100}%` }} />}
                          {exec.converted > 0 && <div className="bg-purple-500" title={`Converted: ${exec.converted}`} style={{ width: `${(exec.converted / exec.total) * 100}%` }} />}
                          {exec.lost > 0 && <div className="bg-red-400" title={`Lost: ${exec.lost}`} style={{ width: `${(exec.lost / exec.total) * 100}%` }} />}
                        </div>
                      ) : (
                        <div className="w-full h-1 rounded-full bg-gray-100 dark:bg-slate-700" />
                      )}

                      {isSelected && (
                        <div className="mt-1.5 text-center text-[9px] text-blue-500 font-semibold">✓ Selected</div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Dropdown (also filtered to sales_executive only) ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Sales Executive
          </label>
          <select
            value={selectedExecutive}
            onChange={(e) => setSelectedExecutive(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
          >
            <option value="">-- Select Executive --</option>
            {executives
              ?.filter(exec => exec.role === 'sales_executive')
              .map((exec) => {
                const stat = statsMap.get(exec._id.toString());
                return (
                  <option key={exec._id} value={exec._id}>
                    {exec.full_name} — {stat ? `${stat.total} leads` : '0 leads'}
                  </option>
                );
              })}
          </select>
        </div>

        {/* ── Selected executive preview message ── */}
        {selectedStat && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
            <span className="font-semibold">{selectedStat.name}</span> ko{' '}
            <span className="font-bold">{leadIds.length}</span> naya lead{leadIds.length > 1 ? 's' : ''} assign hoga.
            {' '}Currently unke paas <span className="font-bold">{selectedStat.total} leads</span> hain.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
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
