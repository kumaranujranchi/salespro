import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMutation } from "../../lib/reactive";
import { api } from '../../lib/api-endpoints';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { Layers, Hash, DollarSign, Sparkles, Check, Settings2 } from 'lucide-react';

interface TargetSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function TargetSettingsModal({ isOpen, onClose, onSuccess }: TargetSettingsModalProps) {
    const { tenant, refreshTenant } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<'area' | 'units' | 'revenue' | 'hybrid'>('area');

    const updateTenantMutation = useMutation(api.tenants.update);

    useEffect(() => {
        if (isOpen && tenant) {
            const currentModel = tenant?.settings?.general?.target_model || 'area';
            setSelectedModel(currentModel);
        }
    }, [isOpen, tenant]);

    const handleSave = async () => {
        if (!tenant?._id) return;
        setLoading(true);

        try {
            const updatedSettings = {
                ...tenant.settings,
                general: {
                    ...tenant.settings?.general,
                    target_model: selectedModel
                }
            };

            await updateTenantMutation({
                id: tenant._id as any,
                settings: updatedSettings
            });

            if (refreshTenant) {
                await refreshTenant();
            }

            toast.success(`Organization target model set to ${selectedModel.toUpperCase()} successfully!`);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to update target model:', error);
            toast.error(error.message || 'Failed to update target settings.');
        } finally {
            setLoading(false);
        }
    };

    const models = [
        {
            id: 'area' as const,
            title: 'Area Based (Sq Ft)',
            icon: Layers,
            badge: 'Plotted & Land',
            description: 'Assign and evaluate targets in square feet. Best for land developers, plotted township layouts, and commercial projects.'
        },
        {
            id: 'units' as const,
            title: 'Unit Based (Count)',
            icon: Hash,
            badge: 'Residential & Flats',
            description: 'Assign and evaluate targets by number of units/flats closed. Best for residential apartments, villas, and builder floors.'
        },
        {
            id: 'revenue' as const,
            title: 'Revenue Based (₹ Value)',
            icon: DollarSign,
            badge: 'Brokerages & Luxury',
            description: 'Assign and evaluate targets by total booking revenue in ₹. Best for luxury properties, channel partners, and real estate brokerages.'
        },
        {
            id: 'hybrid' as const,
            title: 'Multi-Metric / Hybrid',
            icon: Sparkles,
            badge: 'Enterprise All-in-One',
            description: 'Assign targets using any combination of Area, Units, and Revenue. Best for diversified real estate firms managing mixed portfolios.'
        }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customize Organization Target Model" size="lg">
            <div className="space-y-5">
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Configure the default measurement metric for sales targets across your company. All team members and target forms will adapt to this preferred standard.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {models.map(m => {
                        const Icon = m.icon;
                        const isSelected = selectedModel === m.id;
                        return (
                            <div
                                key={m.id}
                                onClick={() => setSelectedModel(m.id)}
                                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    isSelected
                                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-500 shadow-sm'
                                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20'
                                }`}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                )}
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300'}`}>
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{m.title}</h4>
                                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                                            {m.badge}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {m.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="button" variant="primary" isLoading={loading} onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                        Save Organization Settings
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
