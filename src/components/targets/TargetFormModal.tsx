import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation } from "../../lib/reactive";
import { api, Id } from '../../lib/api-endpoints';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Target, Layers, Hash, DollarSign, Sparkles } from 'lucide-react';

interface TargetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingTarget?: any | null;
}

function formatIndianCurrencyWords(num: number): string {
    if (isNaN(num) || num <= 0) return '';
    if (num >= 10000000) {
        const cr = num / 10000000;
        return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Crore${cr > 1 ? 's' : ''}`;
    }
    if (num >= 100000) {
        const lakh = num / 100000;
        return `₹${lakh % 1 === 0 ? lakh : lakh.toFixed(2)} Lakh${lakh > 1 ? 's' : ''}`;
    }
    if (num >= 1000) {
        return `₹${(num / 1000).toFixed(0)}k`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
}

export function TargetFormModal({ isOpen, onClose, onSuccess, editingTarget }: TargetFormModalProps) {
    const { profile, tenant } = useAuth();
    const [loading, setLoading] = useState(false);

    const [targetMetric, setTargetMetric] = useState<'area' | 'units' | 'revenue' | 'hybrid'>('area');
    const [saveAsCompanyDefault, setSaveAsCompanyDefault] = useState(false);

    const [formData, setFormData] = useState({
        userId: '' as string | Id<"profiles">,
        month: new Date().toISOString().slice(0, 7),
        sqft: '',
        units: '',
        amount: ''
    });

    const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
    const isAdmin = ['super_admin', 'admin', 'director', 'platform_admin'].includes(normalizedRole);

    // Backend queries
    const staff = useQuery(api.profiles.listActiveStaff, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");

    // Backend mutations
    const createTarget = useMutation(api.targets.createTarget);
    const updateTarget = useMutation(api.targets.updateTarget);
    const updateTenantMutation = useMutation(api.tenants.update);

    useEffect(() => {
        if (isOpen) {
            if (editingTarget) {
                const sqftVal = Number(editingTarget.target_sqft) || 0;
                const unitsVal = Number(editingTarget.target_units) || 0;
                const amountVal = Number(editingTarget.target_amount) || 0;

                const nonZeroCount = (sqftVal > 0 ? 1 : 0) + (unitsVal > 0 ? 1 : 0) + (amountVal > 0 ? 1 : 0);
                if (nonZeroCount > 1) {
                    setTargetMetric('hybrid');
                } else if (amountVal > 0) {
                    setTargetMetric('revenue');
                } else if (unitsVal > 0) {
                    setTargetMetric('units');
                } else {
                    setTargetMetric('area');
                }

                setFormData({
                    userId: editingTarget.user_id,
                    month: editingTarget.start_date ? editingTarget.start_date.slice(0, 7) : new Date().toISOString().slice(0, 7),
                    sqft: sqftVal > 0 ? sqftVal.toString() : '',
                    units: unitsVal > 0 ? unitsVal.toString() : '',
                    amount: amountVal > 0 ? amountVal.toString() : ''
                });
                setSaveAsCompanyDefault(false);
            } else {
                const companyDefault = tenant?.settings?.general?.target_model || 'area';
                setTargetMetric(companyDefault);
                setFormData({
                    userId: '',
                    month: new Date().toISOString().slice(0, 7),
                    sqft: '',
                    units: '',
                    amount: ''
                });
                setSaveAsCompanyDefault(false);
            }
        }
    }, [isOpen, editingTarget, tenant]);

    const showArea = targetMetric === 'area' || targetMetric === 'hybrid';
    const showUnits = targetMetric === 'units' || targetMetric === 'hybrid';
    const showAmount = targetMetric === 'revenue' || targetMetric === 'hybrid';

    const revenueNumber = parseFloat(formData.amount) || 0;
    const revenuePreview = revenueNumber > 0 ? formatIndianCurrencyWords(revenueNumber) : '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const date = parseISO(formData.month + '-01');
            const startDate = startOfMonth(date);
            const endDate = endOfMonth(date);

            const sqftNum = showArea ? (parseFloat(formData.sqft) || 0) : 0;
            const unitsNum = showUnits ? (parseFloat(formData.units) || 0) : 0;
            const amountNum = showAmount ? (parseFloat(formData.amount) || 0) : 0;

            if (sqftNum <= 0 && unitsNum <= 0 && amountNum <= 0) {
                toast.error('Please enter at least one target value greater than 0.');
                setLoading(false);
                return;
            }

            const payload = {
                tenant_id: profile?.tenant_id as Id<"tenants">,
                user_id: formData.userId as Id<"profiles">,
                period_type: 'monthly',
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(endDate, 'yyyy-MM-dd'),
                target_sqft: sqftNum,
                target_amount: amountNum,
                target_units: unitsNum,
                created_by: profile?.id as Id<"profiles">
            };

            if (editingTarget) {
                await updateTarget({
                    id: editingTarget._id || editingTarget.id,
                    target_sqft: payload.target_sqft,
                    target_amount: payload.target_amount,
                    target_units: payload.target_units,
                    start_date: payload.start_date,
                    end_date: payload.end_date
                });
            } else {
                await createTarget(payload);
            }

            // Save organization default target model if user requested
            if (saveAsCompanyDefault && tenant?._id && isAdmin) {
                try {
                    await updateTenantMutation({
                        id: tenant._id as any,
                        settings: {
                            ...tenant.settings,
                            general: {
                                ...tenant.settings?.general,
                                target_model: targetMetric
                            }
                        }
                    });
                } catch (settErr) {
                    console.error('Failed to update tenant default target model:', settErr);
                }
            }

            toast.success(editingTarget ? 'Target updated successfully!' : 'Target assigned successfully!');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save target.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingTarget ? "Edit Monthly Target" : "Assign Monthly Target"} size="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Team Member Selection */}
                <Select
                    label="Team Member *"
                    value={formData.userId}
                    onChange={e => setFormData({ ...formData, userId: e.target.value })}
                    options={staff?.map(s => ({ label: `${s.full_name} (${s.role.replace('_', ' ')})`, value: s._id || s.id })) || []}
                    required
                    disabled={!!editingTarget}
                />

                {/* Target Measurement Metric Switcher */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Target size={14} className="text-emerald-600 dark:text-emerald-400" />
                            Target Measurement Metric *
                        </label>
                        <span className="text-[11px] text-gray-400">Choose how to set this target</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setTargetMetric('area')}
                            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                targetMetric === 'area'
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                            }`}
                        >
                            <Layers size={14} />
                            <span>Area (Sq Ft)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTargetMetric('units')}
                            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                targetMetric === 'units'
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                            }`}
                        >
                            <Hash size={14} />
                            <span>Units (Count)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTargetMetric('revenue')}
                            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                targetMetric === 'revenue'
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                            }`}
                        >
                            <DollarSign size={14} />
                            <span>Revenue (₹)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTargetMetric('hybrid')}
                            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                targetMetric === 'hybrid'
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                            }`}
                        >
                            <Sparkles size={14} />
                            <span>Multi-Metric</span>
                        </button>
                    </div>
                </div>

                {/* Target Inputs Form */}
                <div className="space-y-4 bg-gray-50/70 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-200/80 dark:border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Target Month *"
                            type="month"
                            value={formData.month}
                            onChange={e => setFormData({ ...formData, month: e.target.value })}
                            required
                        />

                        {showArea && (
                            <div>
                                <Input
                                    label="Area Target (Sq Ft) *"
                                    type="number"
                                    min="1"
                                    step="any"
                                    value={formData.sqft}
                                    onChange={e => setFormData({ ...formData, sqft: e.target.value })}
                                    placeholder="e.g. 5000"
                                    required={targetMetric === 'area'}
                                />
                                <span className="text-[11px] text-gray-500 mt-1 block">Total plot or carpet area to book</span>
                            </div>
                        )}

                        {showUnits && (
                            <div>
                                <Input
                                    label="Unit Count Target *"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={formData.units}
                                    onChange={e => setFormData({ ...formData, units: e.target.value })}
                                    placeholder="e.g. 5"
                                    required={targetMetric === 'units'}
                                />
                                <span className="text-[11px] text-gray-500 mt-1 block">Number of units/plots/flats to close</span>
                            </div>
                        )}

                        {showAmount && (
                            <div>
                                <Input
                                    label="Revenue Target (₹) *"
                                    type="number"
                                    min="1"
                                    step="any"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="e.g. 5000000"
                                    required={targetMetric === 'revenue'}
                                />
                                {revenuePreview ? (
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                                        = {revenuePreview} (₹{revenueNumber.toLocaleString('en-IN')})
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-gray-500 mt-1 block">Total booking value in Rupees</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Optional: Save as Company Default */}
                {isAdmin && !editingTarget && (
                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.02] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={saveAsCompanyDefault}
                            onChange={e => setSaveAsCompanyDefault(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600"
                        />
                        <div className="text-xs">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                                Save as company-wide default target model
                            </span>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                                Automatically pre-selects this metric for future targets across your entire organization.
                            </p>
                        </div>
                    </label>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={loading} className="!bg-emerald-600 hover:!bg-emerald-700 !text-white font-semibold shadow-sm">
                        {editingTarget ? "Update Target" : "Save Target"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
