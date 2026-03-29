import { useState } from 'react';
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SalesCancellationModalProps {
    sale: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function SalesCancellationModal({ sale, isOpen, onClose, onSuccess }: SalesCancellationModalProps) {
    const { profile } = useAuth();
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const updateSale = useMutation(api.sales.updateSale);

    const handleCancel = async () => {
        if (!reason || reason.trim().length < 10) {
            toast.error('Please provide a detailed reason (minimum 10 characters).');
            return;
        }

        setLoading(true);
        try {
            await updateSale({
                id: sale._id as Id<"sales">,
                status: 'cancelled',
                metadata: {
                    ...sale.metadata,
                    cancellation_reason: reason,
                    cancelled_at: new Date().toISOString(),
                    cancelled_by: profile?.id
                }
            });

            toast.success("Sale cancelled successfully");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to cancel sale.');
        } finally {
            setLoading(false);
        }
    };

    if (!sale) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cancel Sale" size="md">
            <div className="p-6 space-y-4">
                <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3 border border-red-200">
                    <AlertTriangle className="text-red-600 shrink-0" size={20} />
                    <div>
                        <h4 className="font-bold text-red-800 text-sm">Warning: Irreversible Action</h4>
                        <p className="text-red-700 text-xs mt-1">
                            This will mark the sale as cancelled and remove it from active revenue metrics.
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                    <p><span className="text-gray-500">Customer:</span> {sale.customer?.name}</p>
                    <p><span className="text-gray-500">Project:</span> {sale.project?.name} - {sale.unit_number}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Reason for Cancellation *</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        rows={4}
                        placeholder="Explain why this sale is being cancelled..."
                    />
                </div>
            </div>
            <ModalFooter>
                <Button variant="outline" onClick={onClose}>Back</Button>
                <Button variant="primary" className="bg-red-600 hover:bg-red-700" onClick={handleCancel} isLoading={loading}>Confirm Cancellation</Button>
            </ModalFooter>
        </Modal>
    );
}
