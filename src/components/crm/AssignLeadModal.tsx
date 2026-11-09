import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from "../../lib/reactive";
import { api, Id } from '../../lib/api-endpoints';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { UserAvatar } from '../ui/UserAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { Users, UserCheck } from 'lucide-react';

interface AssignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadIds: string[];
  onSuccess: () => void;
}

export function AssignLeadModal({ isOpen, onClose, leadIds, onSuccess }: AssignLeadModalProps) {
  const { profile, tenant } = useAuth();
  const dialog = useDialog();

  const [selectedExecutive, setSelectedExecutive] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear selection whenever modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedExecutive('');
    }
  }, [isOpen]);

  const currentTenantId = tenant?._id || tenant?.id || profile?.tenant_id;

  // Backend queries
  const staff = useQuery(
    api.profiles.listActiveStaff,
    currentTenantId ? { tenant_id: currentTenantId as Id<"tenants"> } : "skip"
  );

  const executives = useQuery(
    api.profiles.listExecutives,
    currentTenantId ? { tenant_id: currentTenantId as Id<"tenants"> } : "skip"
  );

  // Executive lead stats — lead counts by status per executive
  const executiveStats = useQuery(
    api.leads.getExecutiveLeadStats,
    currentTenantId ? { tenant_id: currentTenantId as Id<"tenants"> } : "skip"
  );

  // Deduplicate and filter available sales executives with bulletproof fallback
  const availableExecutives = useMemo(() => {
    const rawStaff = Array.isArray(staff) ? staff : [];
    const rawExecs = Array.isArray(executives) ? executives : [];

    const map = new Map<string, any>();
    // 1. Add executives
    rawExecs.forEach((e: any) => {
      const id = String(e._id || e.id || '');
      if (id) map.set(id, e);
    });
    // 2. Add active staff
    rawStaff.forEach((s: any) => {
      const id = String(s._id || s.id || '');
      if (id && !map.has(id)) map.set(id, s);
    });

    const all = Array.from(map.values());
    if (all.length === 0) return [];

    const isSalesRole = (role?: string, roleName?: string) => {
      const combined = `${role || ''} ${roleName || ''}`.toLowerCase().replace(/[\s_-]+/g, '');
      return (
        combined.includes('sales') ||
        combined.includes('executive') ||
        combined.includes('manager') ||
        combined.includes('leader') ||
        combined.includes('agent') ||
        combined.includes('advisor') ||
        combined.includes('caller') ||
        combined.includes('telecaller')
      );
    };

    const salesOnly = all.filter((u: any) => isSalesRole(u.role, u.role_name));
    // If any sales staff exist, return them. Otherwise fallback to all staff so dropdown is NEVER empty!
    return salesOnly.length > 0 ? salesOnly : all;
  }, [staff, executives]);

  // Build stats lookup map
  const statsMap = useMemo(() => {
    const map = new Map<string, any>();
    (executiveStats || []).forEach((s: any) => {
      if (s.id) map.set(String(s.id), s);
      if (s._id) map.set(String(s._id), s);
    });
    return map;
  }, [executiveStats]);

  // Merge available executives with stats for cards display
  const executiveCards = useMemo(() => {
    if (executiveStats && executiveStats.length > 0) {
      return [...executiveStats].sort((a, b) => a.total - b.total);
    }
    return (availableExecutives || []).map((exec: any) => {
      const id = String(exec._id || exec.id);
      const stat = statsMap.get(id);
      return {
        id,
        _id: id,
        name: exec.full_name || 'Executive',
        role: exec.role_name || exec.role || 'Sales Executive',
        avatar: exec.image_url || null,
        total: stat?.total || 0,
        new: stat?.new || 0,
        contacted: stat?.contacted || 0,
        inProgress: stat?.inProgress || 0,
        qualified: stat?.qualified || 0,
        converted: stat?.converted || 0,
        lost: stat?.lost || 0,
      };
    });
  }, [executiveStats, availableExecutives, statsMap]);

  // Backend mutations
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

      await dialog.alert(`Successfully assigned ${leadIds.length} lead${leadIds.length > 1 ? 's' : ''}!`, { variant: 'success' });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Assignment error", error);
      await dialog.alert('Failed to assign leads', { variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const selectedExecObj = availableExecutives.find(
    (e: any) => String(e._id || e.id) === selectedExecutive
  );
  const selectedStat = selectedExecutive ? statsMap.get(selectedExecutive) : null;
  const selectedName = selectedStat?.name || selectedExecObj?.full_name || 'Selected Executive';
  const selectedTotal = selectedStat?.total ?? 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign ${leadIds.length} Lead${leadIds.length > 1 ? 's' : ''} to Executive`} size="md">
      <div className="space-y-4">

        {/* ── Sales Executive Cards — Current Lead Distribution ── */}
        {executiveCards && executiveCards.length > 0 && (
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
              {executiveCards.map((exec) => {
                const initials = (exec.name || 'EX')
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                const execId = String(exec.id || exec._id);
                const isSelected = selectedExecutive === execId;

                return (
                  <div
                    key={execId}
                    onClick={() => setSelectedExecutive(isSelected ? '' : execId)}
                    className={`cursor-pointer rounded-xl border p-2.5 transition-all duration-150 select-none ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/25 shadow ring-1 ring-blue-400'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar src={exec.avatar} name={exec.name} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">
                          {exec.name}
                        </div>
                        <div className="text-[9px] text-gray-400 leading-tight truncate">
                          {exec.role ? exec.role.replace(/_/g, ' ') : 'Sales Executive'}
                        </div>
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
                      <div className="mt-1.5 text-center text-[9px] text-blue-500 font-semibold flex items-center justify-center gap-1">
                        <UserCheck size={11} /> Selected
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Dropdown ── */}
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
            {availableExecutives.map((exec: any) => {
              const execId = String(exec._id || exec.id);
              const stat = statsMap.get(execId);
              const leadCount = stat ? `${stat.total} lead${stat.total !== 1 ? 's' : ''}` : '0 leads';
              const roleLabel = exec.role_name || exec.role;
              const formattedRole = roleLabel ? ` (${roleLabel.replace(/_/g, ' ')})` : '';
              return (
                <option key={execId} value={execId}>
                  {exec.full_name}{formattedRole} — {leadCount}
                </option>
              );
            })}
          </select>
        </div>

        {/* ── Selected executive preview message ── */}
        {selectedExecutive && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
            <span className="font-semibold">{selectedName}</span> will be assigned{' '}
            <span className="font-bold">{leadIds.length}</span> new lead{leadIds.length > 1 ? 's' : ''}.
            {' '}Currently assigned <span className="font-bold">{selectedTotal} leads</span>.
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
