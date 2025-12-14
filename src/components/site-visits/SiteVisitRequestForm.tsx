import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { supabase } from '../../lib/supabase';
import { SiteVisit, Project } from '../../types/database';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal, ModalFooter } from '../ui/Modal';
import { ChevronDown, ChevronUp, AlertCircle, MessageSquare, Info } from 'lucide-react';

interface SiteVisitRequestFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingVisit?: SiteVisit | null;
}

export function SiteVisitRequestForm({ isOpen, onClose, onSuccess, editingVisit }: SiteVisitRequestFormProps) {
    const { user } = useAuth();
    const dialog = useDialog();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // UI State
    const [showNotes, setShowNotes] = useState(false);
    const [isClarificationMode, setIsClarificationMode] = useState(false);

    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        pickupLocation: '',
        projectId: '',
        visitDate: '',
        visitTime: '',
        notes: '', // Initial/Existing notes
        clarificationResponse: '' // Response to admin
    });

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (editingVisit) {
            setIsClarificationMode(editingVisit.status === 'pending_clarification');
            setFormData({
                customerName: editingVisit.customer_name,
                customerPhone: editingVisit.customer_phone,
                pickupLocation: editingVisit.pickup_location || '',
                projectId: editingVisit.project_ids && editingVisit.project_ids.length > 0 ? editingVisit.project_ids[0] : '',
                visitDate: editingVisit.visit_date,
                visitTime: editingVisit.visit_time,
                notes: editingVisit.notes || '',
                clarificationResponse: ''
            });

            // If there are existing notes, we might want to show them? 
            // Or only show logic based on user interaction.
            if (editingVisit.notes) setShowNotes(true);

        } else {
            resetForm();
            setIsClarificationMode(false);
            setShowNotes(false);
        }
    }, [editingVisit, isOpen]);

    const resetForm = () => {
        setFormData({
            customerName: '',
            customerPhone: '',
            pickupLocation: '',
            projectId: '',
            visitDate: '',
            visitTime: '',
            notes: '',
            clarificationResponse: ''
        });
    };

    const loadProjects = async () => {
        const { data } = await supabase.from('projects').select('*').eq('is_active', true);
        if (data) setProjects(data);
    };

    const countWords = (str: string) => {
        return str.trim().split(/\s+/).filter(Boolean).length;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Validation
        if (isClarificationMode) {
            const wordCount = countWords(formData.clarificationResponse);
            if (wordCount === 0) {
                await dialog.alert('Please provide a clarification response.', { variant: 'danger' });
                return;
            }
            if (wordCount > 500) {
                await dialog.alert('Clarification response exceeds 500 words.', { variant: 'danger' });
                return;
            }
        } else {
            const wordCount = countWords(formData.notes);
            if (wordCount > 300) {
                await dialog.alert('Notes exceed 300 words.', { variant: 'danger' });
                return;
            }
        }

        setIsSubmitting(true);

        try {
            // preparing notes
            let finalNotes = formData.notes;

            if (isClarificationMode && formData.clarificationResponse) {
                const timestamp = new Date().toLocaleString();
                const responseEntry = `\n\n[${timestamp}] Clarification Response:\n${formData.clarificationResponse}`;
                finalNotes = (finalNotes || '') + responseEntry;
            }

            const visitData = {
                customer_name: formData.customerName,
                customer_phone: formData.customerPhone,
                pickup_location: formData.pickupLocation,
                project_ids: formData.projectId ? [formData.projectId] : [],
                visit_date: formData.visitDate,
                visit_time: formData.visitTime,
                notes: finalNotes,
                status: isClarificationMode ? 'pending' : (editingVisit?.status || 'pending')
            };

            if (!editingVisit) {
                Object.assign(visitData, { requested_by: user.id, status: 'pending' });
            }

            const { error } = editingVisit
                ? await supabase.from('site_visits').update(visitData).eq('id', editingVisit.id)
                : await supabase.from('site_visits').insert(visitData);

            if (error) throw error;

            await dialog.alert(
                editingVisit ? 'Request updated successfully!' : 'Request submitted successfully!',
                { variant: 'success', title: 'Success' }
            );

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving site visit:', error);
            await dialog.alert(error.message || 'Failed to save request', { variant: 'danger', title: 'Error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate word counts for display
    const noteWordCount = countWords(formData.notes);
    const clarificationWordCount = countWords(formData.clarificationResponse);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingVisit ? "Edit Site Visit Request" : "Schedule Site Visit"}
        >
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Clarification Alert Section */}
                {isClarificationMode && editingVisit?.clarification_note && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 animate-fadeIn">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-medium text-amber-900">Clarification Requested by Admin</h4>
                                <p className="text-sm text-amber-800 mt-1">{editingVisit.clarification_note}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Customer Name"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        required
                    />
                    <Input
                        label="Customer Phone"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        required
                    />
                </div>

                <Input
                    label="Pickup Location"
                    value={formData.pickupLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, pickupLocation: e.target.value }))}
                    required
                    placeholder="e.g. City Center Metro Station"
                />

                <Select
                    label="Project to Visit"
                    value={formData.projectId}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                    required
                    options={projects.map(p => ({ value: p.id, label: p.name }))}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        type="date"
                        label="Date"
                        value={formData.visitDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                        required
                        min={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                        type="time"
                        label="Time"
                        value={formData.visitTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, visitTime: e.target.value }))}
                        required
                    />
                </div>

                {/* Clarification Response Field */}
                {isClarificationMode ? (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 flex justify-between">
                            <span>Response to Admin *</span>
                            <span className={`text-xs ${clarificationWordCount > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                                {clarificationWordCount}/500 words
                            </span>
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] min-h-[120px] text-sm"
                            value={formData.clarificationResponse}
                            onChange={(e) => setFormData(prev => ({ ...prev, clarificationResponse: e.target.value }))}
                            placeholder="Please provide the requested information here..."
                            required
                        />
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Info size={12} />
                            Your response will be appended to the visit notes.
                        </p>
                    </div>
                ) : (
                    /* Initial Policy Notes (Collapsible) */
                    <div className="space-y-2 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowNotes(!showNotes)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#1673FF] transition-colors w-full"
                        >
                            <MessageSquare size={16} />
                            Additional Policy Notes / Comments
                            {showNotes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {showNotes && (
                            <div className="animate-fadeIn space-y-1">
                                <div className="flex justify-end">
                                    <span className={`text-xs ${noteWordCount > 300 ? 'text-red-500' : 'text-gray-400'}`}>
                                        {noteWordCount}/300 words
                                    </span>
                                </div>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] min-h-[100px] text-sm"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Enter any special requests, deviations from policy, or extra details here..."
                                />
                            </div>
                        )}
                    </div>
                )}

                <ModalFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                    >
                        {editingVisit ? "Update Request" : "Submit Request"}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
