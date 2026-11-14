import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation } from "../../lib/reactive";
import { api, Id } from '../../lib/api-endpoints';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Modal, ModalFooter } from '../ui/Modal';
import { toast } from 'sonner';

interface SiteVisitApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    visit: any | null;
}

type ActionType = 'approve' | 'decline' | 'clarify';

export function SiteVisitApprovalModal({ isOpen, onClose, onSuccess, visit }: SiteVisitApprovalModalProps) {
    const { profile, tenant } = useAuth();
    const [action, setAction] = useState<ActionType>('approve');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [driverId, setDriverId] = useState('');
    const [note, setNote] = useState('');

    const targetTenantId = visit?.tenant_id || profile?.tenant_id || (tenant as any)?._id || (tenant as any)?.id;

    // Backend queries
    const drivers = useQuery(
        api.profiles.listDrivers,
        targetTenantId ? { tenant_id: targetTenantId as Id<"tenants"> } : "skip"
    );

    // Reset or populate fields whenever modal opens or visit changes
    useEffect(() => {
        if (isOpen && visit) {
            setAction('approve');
            setNote('');
            setDriverId(visit.driver_id || '');
        }
    }, [isOpen, visit]);

    // Auto-select driver if only one driver is available and none selected yet
    useEffect(() => {
        if (action === 'approve' && !driverId && Array.isArray(drivers) && drivers.length === 1) {
            const single = drivers[0];
            setDriverId(String(single._id || single.id));
        }
    }, [action, driverId, drivers]);

    // Backend mutations
    const updateSiteVisit = useMutation(api.site_visits.updateSiteVisit);

    const handleSubmit = async () => {
        const visitId = visit?._id || visit?.id;
        const currentUserId = profile?.id || profile?._id;
        if (!visitId || !currentUserId) return;

        if (action === 'approve' && !driverId) {
            toast.error("Please assign a driver.");
            return;
        }
        if ((action === 'decline' || action === 'clarify') && !note.trim()) {
            toast.error("Please provide a reason.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (action === 'approve') {
                await updateSiteVisit({
                    id: visitId,
                    status: 'approved',
                    driver_id: driverId as Id<"profiles">,
                    metadata: { approved_by: currentUserId, approved_at: new Date().toISOString() }
                });
            } else if (action === 'decline') {
                await updateSiteVisit({
                    id: visitId,
                    status: 'declined',
                    rejection_reason: note
                });
            } else if (action === 'clarify') {
                await updateSiteVisit({
                    id: visitId,
                    status: 'pending_clarification',
                    clarification_note: note
                });
            }

            toast.success(`Request ${action}d successfully.`);
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to process request");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!visit) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Review Site Visit Request">
            <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg space-y-2 text-sm border border-gray-100 dark:border-white/10">
                    <div className="flex justify-between"><span className="text-gray-500">Customer:</span><span className="font-medium">{visit.customer_name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Location:</span><span className="font-medium">{visit.pickup_location}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Scheduled:</span><span className="font-medium">{visit.visit_date} at {visit.visit_time}</span></div>
                </div>

                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-lg">
                    {(['approve', 'decline', 'clarify'] as const).map((mode) => (
                        <button key={mode} onClick={() => setAction(mode)} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${action === mode ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{mode.toUpperCase()}</button>
                    ))}
                </div>

                <div className="space-y-4">
                    {action === 'approve' && (
                        <div className="space-y-1.5">
                            <Select 
                                label="Assign Driver" 
                                value={driverId} 
                                onChange={(e) => setDriverId(e.target.value)} 
                                required 
                                options={drivers?.map((d: any) => ({ 
                                    value: String(d._id || d.id), 
                                    label: d.phone ? `${d.full_name} (${d.phone})` : d.full_name 
                                })) || []} 
                                helperText={
                                    (!drivers || drivers.length === 0) 
                                        ? "No drivers found for this workspace. Please add a driver in User Management." 
                                        : undefined
                                }
                            />
                            {(!drivers || drivers.length === 0) && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
                                    ⚠️ No driver profiles detected. Go to <strong>User Management</strong> &rarr; <strong>Add User</strong> and select the <strong>Driver</strong> role.
                                </p>
                            )}
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium">{action === 'approve' ? 'Internal Notes' : 'Reason / Note *'}</label>
                        <textarea className="w-full p-2 border rounded-lg min-h-[100px] text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Enter ${action} details...`} />
                    </div>
                </div>

                <ModalFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant={action === 'decline' ? 'danger' : 'primary'} onClick={handleSubmit} isLoading={isSubmitting}>Confirm {action}</Button>
                </ModalFooter>
            </div>
        </Modal>
    );
}
