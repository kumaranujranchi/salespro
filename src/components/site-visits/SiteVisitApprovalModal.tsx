import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
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
    const { profile } = useAuth();
    const [action, setAction] = useState<ActionType>('approve');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [driverId, setDriverId] = useState('');
    const [note, setNote] = useState('');

    // Convex Queries
    const drivers = useQuery(api.profiles.listDrivers, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");

    // Convex Mutations
    const updateSiteVisit = useMutation(api.site_visits.updateSiteVisit);

    const handleSubmit = async () => {
        if (!visit || !profile?.id) return;

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
                    id: visit._id,
                    status: 'approved',
                    driver_id: driverId as Id<"profiles">,
                    metadata: { approved_by: profile.id, approved_at: new Date().toISOString() }
                });
            } else if (action === 'decline') {
                await updateSiteVisit({
                    id: visit._id,
                    status: 'declined',
                    rejection_reason: note
                });
            } else if (action === 'clarify') {
                await updateSiteVisit({
                    id: visit._id,
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
                        <Select label="Assign Driver" value={driverId} onChange={(e) => setDriverId(e.target.value)} required options={drivers?.map(d => ({ value: d._id, label: d.full_name })) || []} />
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
