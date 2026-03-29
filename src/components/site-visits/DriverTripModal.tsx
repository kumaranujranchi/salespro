import { useState, useEffect } from 'react';
import { useDialog } from '../../contexts/DialogContext';
import { useMutation } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalFooter } from '../ui/Modal';
import { Navigation } from 'lucide-react';
import { toast } from 'sonner';

interface DriverTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    visit: any | null;
}

export function DriverTripModal({ isOpen, onClose, onSuccess, visit }: DriverTripModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [odometer, setOdometer] = useState('');

    // Convex Mutations
    const updateSiteVisit = useMutation(api.site_visits.updateSiteVisit);

    useEffect(() => {
        if (isOpen) {
            setOdometer('');
        }
    }, [isOpen]);

    if (!visit) return null;

    const handleAction = async () => {
        if (!odometer || isNaN(Number(odometer)) || Number(odometer) <= 0) {
            toast.error("Please enter a valid odometer reading.");
            return;
        }

        const reading = odometer; // Keeping as string for Convex args validation if needed

        if (visit.status === 'trip_started') {
            if (visit.start_odometer && Number(reading) <= Number(visit.start_odometer)) {
                toast.error(`End reading must be greater than start (${visit.start_odometer}).`);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            if (visit.status === 'approved') {
                await updateSiteVisit({
                    id: visit._id,
                    status: 'trip_started',
                    start_odometer: reading,
                    trip_start_time: new Date().toISOString()
                });
                toast.success("Trip started!");
            } else if (visit.status === 'trip_started') {
                await updateSiteVisit({
                    id: visit._id,
                    status: 'completed',
                    end_odometer: reading,
                    trip_end_time: new Date().toISOString()
                });
                toast.success("Trip completed!");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to update trip");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStart = visit.status === 'approved';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isStart ? "Start Trip" : "Complete Trip"}>
            <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                    <Navigation className="text-blue-600 dark:text-blue-400 mt-1" size={20} />
                    <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-200">{visit.pickup_location}</h4>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">Customer: {visit.customer_name}</p>
                    </div>
                </div>

                {!isStart && (
                    <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-lg flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Start Reading:</span>
                        <span className="font-bold">{visit.start_odometer} km</span>
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
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleAction} isLoading={isSubmitting}>
                        {isStart ? "Begin Trip" : "Finish Trip"}
                    </Button>
                </ModalFooter>
            </div>
        </Modal>
    );
}
