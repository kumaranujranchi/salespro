import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMutation } from "../../lib/reactive";
import { api, Id } from '../../lib/api-endpoints';
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
    const { profile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [odometer, setOdometer] = useState('');

    // Backend mutations
    const updateSiteVisit = useMutation(api.site_visits.updateSiteVisit);

    useEffect(() => {
        if (isOpen) {
            setOdometer('');
        }
    }, [isOpen]);

    if (!visit) return null;

    const handleAction = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        if (!odometer || isNaN(Number(odometer)) || Number(odometer) <= 0) {
            toast.error("Please enter a valid odometer reading.");
            return;
        }

        const reading = odometer;

        if (visit.status === 'trip_started') {
            if (visit.start_odometer && Number(reading) <= Number(visit.start_odometer)) {
                toast.error(`End reading must be greater than start (${visit.start_odometer} km).`);
                return;
            }
        }

        const visitId = visit.id || visit._id;
        if (!visitId) {
            toast.error("Unable to identify visit ID.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (visit.status === 'approved') {
                await updateSiteVisit({
                    id: visitId,
                    status: 'trip_started',
                    start_odometer: String(reading),
                    trip_start_time: new Date().toISOString()
                });
                toast.success("Trip started successfully!");
            } else if (visit.status === 'trip_started') {
                const dist = Math.max(0, Number(reading) - Number(visit.start_odometer || 0));
                await updateSiteVisit({
                    id: visitId,
                    status: 'completed',
                    end_odometer: String(reading),
                    trip_end_time: new Date().toISOString(),
                    completed_by_profile_id: profile?.id || profile?._id,
                });
                toast.success(`Trip completed! Distance recorded: ${dist.toFixed(1)} km`);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Failed to update trip:", err);
            toast.error(err.message || "Failed to update trip");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStart = visit.status === 'approved';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isStart ? "Start Trip" : "Complete Trip"}>
            <form onSubmit={handleAction} className="space-y-6">
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
                        <span className="font-bold text-slate-800 dark:text-white">{visit.start_odometer} km</span>
                    </div>
                )}

                <Input
                    label={isStart ? "Start Odometer Reading (km)" : "End Odometer Reading (km)"}
                    type="number"
                    step="0.1"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder="00000.0"
                    required
                    autoFocus
                />

                <ModalFooter>
                    <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="primary" 
                        isLoading={isSubmitting}
                        className="!text-white font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md"
                    >
                        {isStart ? "Begin Trip" : "Finish Trip"}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
