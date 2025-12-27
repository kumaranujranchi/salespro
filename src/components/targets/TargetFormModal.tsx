import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Profile, Target } from '../../types/database';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface TargetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingTarget?: Target | null;
}

export function TargetFormModal({ isOpen, onClose, onSuccess, editingTarget }: TargetFormModalProps) {
    const { tenant } = useAuth();
    const dialog = useDialog();
    const [executives, setExecutives] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        userId: '',
        month: new Date().toISOString().slice(0, 7), // 2023-11
        sqft: '',
        units: '',
        amount: ''
    });

    // Determine active target model (default to 'area' for backward compatibility)
    const targetModel = tenant?.settings?.general?.target_model || 'area';
    const showArea = targetModel === 'area' || targetModel === 'hybrid';
    const showUnits = targetModel === 'units' || targetModel === 'hybrid';
    const showAmount = targetModel === 'revenue' || targetModel === 'hybrid';

    useEffect(() => {
        if (isOpen) {
            loadExecutives();
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

    const loadExecutives = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['sales_executive', 'team_leader'])
            .eq('is_active', true);
        if (data) setExecutives(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Calculate Start/End dates
            const date = new Date(formData.month + '-01');
            const startDate = startOfMonth(date);
            const endDate = endOfMonth(date);

            const payload = {
                user_id: formData.userId,
                period_type: 'monthly',
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(endDate, 'yyyy-MM-dd'),
                target_sqft: showArea ? (parseFloat(formData.sqft) || 0) : 0,
                target_amount: showAmount ? (parseFloat(formData.amount) || 0) : 0,
                target_units: showUnits ? (parseFloat(formData.units) || 0) : 0
            };

            const { error } = editingTarget
                ? await supabase.from('sales_targets').update(payload).eq('id', editingTarget.id)
                : await supabase.from('sales_targets').insert(payload);

            if (error) {
                if (error.code === '23505') throw new Error('A target for this user and month already exists.');
                throw error;
            }

            await dialog.alert(editingTarget ? 'Target updated!' : 'Target assigned successfully!', { variant: 'success' });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            await dialog.alert(err.message || 'Failed to save target.', { variant: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingTarget ? "Edit Target" : "Assign Monthly Target"}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                    label="Sales Executive / Leader"
                    value={formData.userId}
                    onChange={e => setFormData({ ...formData, userId: e.target.value })}
                    options={executives.map(ex => ({ label: `${ex.full_name} (${ex.role.replace('_', ' ')})`, value: ex.id }))}
                    required
                    disabled={!!editingTarget}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Select Month"
                        type="month"
                        value={formData.month}
                        onChange={e => setFormData({ ...formData, month: e.target.value })}
                        required
                    />
                    
                    {showArea && (
                        <Input
                            label="Target Area (Sq Ft)"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.sqft}
                            onChange={e => setFormData({ ...formData, sqft: e.target.value })}
                            required={showArea}
                        />
                    )}

                    {showUnits && (
                        <Input
                            label="Target Units"
                            type="number"
                            min="0"
                            step="1"
                            value={formData.units}
                            onChange={e => setFormData({ ...formData, units: e.target.value })}
                            required={showUnits}
                        />
                    )}

                    {showAmount && (
                        <Input
                            label="Target Revenue (Amount)"
                            type="number"
                            min="0"
                            step="1"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            required={showAmount}
                        />
                    )}
                </div>

                <p className="text-xs text-gray-500">
                    * Targets are strictly monthly.
                </p>

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} className="mr-2">Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={loading}>Save Target</Button>
                </div>
            </form>
        </Modal>
    );
}
