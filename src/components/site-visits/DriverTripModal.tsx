import { useState, useEffect } from 'react';
import { useDialog } from '../../contexts/DialogContext';
import { supabase } from '../../lib/supabase';
import { SiteVisit } from '../../types/database';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalFooter } from '../ui/Modal';
import { Navigation } from 'lucide-react';

interface DriverTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    visit: SiteVisit | null;
}

export function DriverTripModal({ isOpen, onClose, onSuccess, visit }: DriverTripModalProps) {
    const dialog = useDialog();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [odometer, setOdometer] = useState('');

    useEffect(() => {
        if (isOpen) {
            setOdometer('');
        }
    }, [isOpen]);

    if (!visit) return null;

    const handleAction = async () => {
        if (!odometer || isNaN(Number(odometer)) || Number(odometer) <= 0) {
            await dialog.alert('Please enter a valid odometer reading.', { variant: 'danger' });
            return;
        }

        const reading = Number(odometer);

        if (visit.status === 'trip_started') {
            // Validation for End Trip
            if (visit.start_odometer && reading <= visit.start_odometer) {
                await dialog.alert(`End reading must be greater than start reading (${visit.start_odometer}).`, { variant: 'danger' });
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const updateData: any = {};
            let newStatus = '';

            if (visit.status === 'approved') {
                updateData.status = 'trip_started';
                updateData.start_odometer = reading;
                newStatus = 'Trip Started';
            } else if (visit.status === 'trip_started') {
                updateData.status = 'completed';
                updateData.end_odometer = reading;
                newStatus = 'Completed';
            } else {
                return;
            }

            const { error } = await supabase
                .from('site_visits')
                .update(updateData)
                .eq('id', visit.id);

            if (error) throw error;

            // Notify Requester
            await supabase.from('notifications').insert({
                user_id: visit.requested_by,
                title: `Site Visit ${newStatus}`,
                message: `The site visit for ${visit.customer_name} has been marked as ${newStatus}. ${visit.status === 'trip_started' ? `Total distance: ${(reading - (visit.start_odometer || 0)).toFixed(1)} km` : ''}`,
                type: 'info',
                related_entity_type: 'site_visit',
                related_entity_id: visit.id
            });

            await dialog.alert(`Trip status updated to ${newStatus}.`, { variant: 'success' });
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            await dialog.alert('Failed to update trip.', { variant: 'danger' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStart = visit.status === 'approved';
    const isEnd = visit.status === 'trip_started';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isStart ? "Start Trip" : "Complete Trip"}>
            <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                    <Navigation className="text-blue-600 mt-1" size={20} />
                    <div>
                        <h4 className="font-semibold text-blue-900">{visit.pickup_location}</h4>
                        <p className="text-blue-700 text-sm">Customer: {visit.customer_name} ({visit.customer_phone})</p>
                    </div>
                </div>

                {isEnd && (
                    <div className="bg-gray-100 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Start Odometer:</span>
                        <span className="font-bold text-gray-900">{visit.start_odometer} km</span>
                    </div>
                )}

                <Input
                    label={isStart ? "Start Odometer Reading (km)" : "End Odometer Reading (km)"}
                    type="number"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder="00000.0"
                    required
                />

                <ModalFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="primary" onClick={handleAction} isLoading={isSubmitting}>
                        {isStart ? "Start Trip" : "End Trip"}
                    </Button>
                </ModalFooter>
            </div>
        </Modal>
    );
}
