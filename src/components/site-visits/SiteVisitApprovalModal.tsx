import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { supabase } from '../../lib/supabase';
import { SiteVisit, Profile } from '../../types/database';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Modal, ModalFooter } from '../ui/Modal';

interface SiteVisitApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    visit: SiteVisit | null;
}

type ActionType = 'approve' | 'decline' | 'clarify';

export function SiteVisitApprovalModal({ isOpen, onClose, onSuccess, visit }: SiteVisitApprovalModalProps) {
    const { user } = useAuth();
    const dialog = useDialog();
    const [drivers, setDrivers] = useState<Profile[]>([]);
    const [action, setAction] = useState<ActionType>('approve');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [driverId, setDriverId] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadDrivers();
            setAction('approve');
            setDriverId('');
            setNote('');
        }
    }, [isOpen]);

    const loadDrivers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'driver')
            .eq('is_active', true);
        if (data) setDrivers(data);
    };

    const handleSubmit = async () => {
        if (!visit || !user) return;

        // Validation
        if (action === 'approve' && !driverId) {
            await dialog.alert('Please assign a driver to approve.', { variant: 'danger' });
            return;
        }
        if ((action === 'decline' || action === 'clarify') && !note.trim()) {
            await dialog.alert('Please provide a reason/note.', { variant: 'danger' });
            return;
        }

        setIsSubmitting(true);
        try {
            let updateData: any = {
                approved_by: user.id,
                approved_at: new Date().toISOString(),
            };

            if (action === 'approve') {
                updateData.status = 'approved';
                updateData.driver_id = driverId;
                if (note) {
                    updateData.notes = (visit.notes ? visit.notes + '\n\n' : '') + `[Approved]: ${note}`;
                }
            } else if (action === 'decline') {
                updateData.status = 'declined';
                updateData.rejection_reason = note;
            } else if (action === 'clarify') {
                updateData.status = 'pending_clarification';
                updateData.clarification_note = note;
            }

            const { error } = await supabase
                .from('site_visits')
                .update(updateData)
                .eq('id', visit.id);

            if (error) throw error;

            // Create Notification for the Requester
            await supabase.from('notifications').insert({
                user_id: visit.requested_by,
                title: `Site Visit ${action === 'approve' ? 'Approved' : action === 'decline' ? 'Declined' : 'Needs Clarification'}`,
                message: `Your request for ${visit.customer_name} has been ${action === 'clarify' ? 'returned for clarification' : action === 'approve' ? 'approved' : 'declined'}. ${note ? `Note: ${note}` : ''}`,
                type: action === 'approve' ? 'success' : action === 'decline' ? 'error' : 'warning',
                related_entity_type: 'site_visit',
                related_entity_id: visit.id
            });

            // Notify Driver if approved
            if (action === 'approve') {
                await supabase.from('notifications').insert({
                    user_id: driverId,
                    title: 'New Site Visit Assigned',
                    message: `You have been assigned a site visit for ${visit.customer_name} on ${new Date(visit.visit_date).toLocaleDateString()}.`,
                    type: 'info',
                    related_entity_type: 'site_visit',
                    related_entity_id: visit.id
                });
            }

            await dialog.alert(`Request processed successfully.`, { variant: 'success', title: 'Success' });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error processing request:', err);
            await dialog.alert('Failed to process request.', { variant: 'danger' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!visit) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Review Site Visit Request">
            <div className="space-y-6">
                {/* Request Details */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm border border-gray-100">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Customer:</span>
                        <span className="font-medium text-[#0A1C37]">{visit.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium text-[#0A1C37]">{visit.customer_phone}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="font-medium text-[#0A1C37]">{visit.pickup_location}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Date/Time:</span>
                        <span className="font-medium text-[#0A1C37]">{new Date(visit.visit_date).toLocaleDateString()} at {visit.visit_time}</span>
                    </div>
                </div>

                {/* Action Tabs */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    {(['approve', 'decline', 'clarify'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setAction(mode)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${action === mode
                                ? 'bg-white text-[#0A1C37] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Action Specific Fields */}
                <div className="space-y-4">
                    {action === 'approve' && (
                        <Select
                            label="Assign Driver"
                            value={driverId}
                            onChange={(e) => setDriverId(e.target.value)}
                            required
                            options={drivers.map(d => ({ value: d.id, label: d.full_name }))}
                        />
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-[#0A1C37]">
                            {action === 'approve' ? 'Notes (Optional)' : action === 'decline' ? 'Reason for Rejection *' : 'Clarification Needed *'}
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] min-h-[100px]"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={`Enter ${action} details...`}
                        />
                    </div>
                </div>

                <ModalFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button
                        variant={action === 'decline' ? 'danger' : 'primary'}
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                    >
                        Confirm {action.charAt(0).toUpperCase() + action.slice(1)}
                    </Button>
                </ModalFooter>
            </div>
        </Modal>
    );
}
