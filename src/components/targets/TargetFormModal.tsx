import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface TargetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingTarget?: any | null;
}

export function TargetFormModal({ isOpen, onClose, onSuccess, editingTarget }: TargetFormModalProps) {
    const { profile, tenant } = useAuth();
    const dialog = useDialog();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        userId: '' as string | Id<"profiles">,
        month: new Date().toISOString().slice(0, 7),
        sqft: '',
        units: '',
        amount: ''
    });

    const targetModel = tenant?.settings?.general?.target_model || 'area';
    const showArea = targetModel === 'area' || targetModel === 'hybrid';
    const showUnits = targetModel === 'units' || targetModel === 'hybrid';
    const showAmount = targetModel === 'revenue' || targetModel === 'hybrid';

    // Convex Queries
    const staff = useQuery(api.profiles.listActiveStaff, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");

    // Convex Mutations
    const createTarget = useMutation(api.targets.createTarget);
    const updateTarget = useMutation(api.targets.updateTarget);

    useEffect(() => {
        if (isOpen) {
            if (editingTarget) {
                setFormData({
                    userId: editingTarget.user_id,
                    month: editingTarget.start_date.slice(0, 7),
                    sqft: (editingTarget.target_sqft || 0).toString(),
                    units: (editingTarget.target_units || 0).toString(),
                    amount: (editingTarget.target_amount || 0).toString()
                });
            } else {
                setFormData({
                    userId: '',
                    month: new Date().toISOString().slice(0, 7),
                    sqft: '',
                    units: '',
                    amount: ''
                });
            }
        }
    }, [isOpen, editingTarget]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!process.env.VITE_CONVEX_URL) return; // Basic guard
        setLoading(true);

        try {
            const date = parseISO(formData.month + '-01');
            const startDate = startOfMonth(date);
            const endDate = endOfMonth(date);

            const payload = {
                tenant_id: profile?.tenant_id as Id<"tenants">,
                user_id: formData.userId as Id<"profiles">,
                period_type: 'monthly',
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(endDate, 'yyyy-MM-dd'),
                target_sqft: showArea ? (parseFloat(formData.sqft) || 0) : 0,
                target_amount: showAmount ? (parseFloat(formData.amount) || 0) : 0,
                target_units: showUnits ? (parseFloat(formData.units) || 0) : 0,
                created_by: profile?.id as Id<"profiles">
            };

            if (editingTarget) {
                await updateTarget({
                    id: editingTarget._id,
                    target_sqft: payload.target_sqft,
                    target_amount: payload.target_amount,
                    target_units: payload.target_units,
                    start_date: payload.start_date,
                    end_date: payload.end_date
                });
            } else {
                await createTarget(payload);
            }

            toast.success(editingTarget ? 'Target updated!' : 'Target assigned!');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save target.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingTarget ? "Edit Target" : "Assign Monthly Target"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                    label="Team Member"
                    value={formData.userId}
                    onChange={e => setFormData({ ...formData, userId: e.target.value })}
                    options={staff?.map(s => ({ label: `${s.full_name} (${s.role.replace('_', ' ')})`, value: s._id })) || []}
                    required
                    disabled={!!editingTarget}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Month" type="month" value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} required />
                    {showArea && <Input label="Area (Sq Ft)" type="number" value={formData.sqft} onChange={e => setFormData({ ...formData, sqft: e.target.value })} required />}
                    {showUnits && <Input label="Units" type="number" value={formData.units} onChange={e => setFormData({ ...formData, units: e.target.value })} required />}
                    {showAmount && <Input label="Revenue" type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />}
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} className="mr-2">Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={loading}>Save Target</Button>
                </div>
            </form>
        </Modal>
    );
}
