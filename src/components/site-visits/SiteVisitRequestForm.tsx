import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalFooter } from '../ui/Modal';
import { ChevronDown, ChevronUp, AlertCircle, MessageSquare, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SiteVisitRequestFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingVisit?: any | null;
}

export function SiteVisitRequestForm({ isOpen, onClose, onSuccess, editingVisit }: SiteVisitRequestFormProps) {
    const { profile } = useAuth();
    const dialog = useDialog();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // UI State
    const [showNotes, setShowNotes] = useState(false);
    const [isClarificationMode, setIsClarificationMode] = useState(false);

    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        pickupLocation: '',
        projectIds: [] as string[],
        visitDate: '',
        visitTime: '',
        notes: '',
        clarificationResponse: ''
    });

    // Convex Queries
    const projects = useQuery(api.projects.listAllProjects, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");

    // Convex Mutations
    const createSiteVisit = useMutation(api.site_visits.createSiteVisit);
    const updateSiteVisit = useMutation(api.site_visits.updateSiteVisit);

    useEffect(() => {
        if (editingVisit) {
            setIsClarificationMode(editingVisit.status === 'pending_clarification');
            setFormData({
                customerName: editingVisit.customer_name,
                customerPhone: editingVisit.mobile || '',
                pickupLocation: editingVisit.pickup_location || '',
                projectIds: editingVisit.project_ids || [],
                visitDate: editingVisit.visit_date,
                visitTime: editingVisit.visit_time,
                notes: editingVisit.notes || '',
                clarificationResponse: ''
            });
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
            projectIds: [],
            visitDate: '',
            visitTime: '',
            notes: '',
            clarificationResponse: ''
        });
    };

    const countWords = (str: string) => str.trim().split(/\s+/).filter(Boolean).length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.id) return;

        if (isClarificationMode && countWords(formData.clarificationResponse) === 0) {
            toast.error("Please provide a clarification response.");
            return;
        }

        setIsSubmitting(true);
        try {
            let finalNotes = formData.notes;
            if (isClarificationMode && formData.clarificationResponse) {
                const timestamp = new Date().toLocaleString();
                finalNotes = (finalNotes || '') + `\n\n[${timestamp}] Clarification Response:\n${formData.clarificationResponse}`;
            }

            if (editingVisit) {
                await updateSiteVisit({
                    id: editingVisit._id,
                    status: isClarificationMode ? 'pending' : undefined,
                    metadata: { notes: finalNotes }
                });
            } else {
                await createSiteVisit({
                    tenant_id: profile.tenant_id as Id<"tenants">,
                    requested_by: profile.id as Id<"profiles">,
                    customer_name: formData.customerName,
                    mobile: formData.customerPhone,
                    visit_date: formData.visitDate,
                    visit_time: formData.visitTime,
                    pickup_location: formData.pickupLocation,
                    notes: finalNotes,
                    status: 'pending'
                });
            }

            toast.success(editingVisit ? 'Request updated!' : 'Request submitted!');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to save request");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingVisit ? "Edit Request" : "Schedule Site Visit"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {isClarificationMode && editingVisit?.clarification_note && (
                    <div className="bg-amber-50 p-3 rounded-lg flex gap-2">
                        <AlertCircle className="text-amber-600 shrink-0" size={18} />
                        <p className="text-sm text-amber-900">{editingVisit.clarification_note}</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Customer Name" value={formData.customerName} onChange={e => setFormData(p => ({ ...p, customerName: e.target.value }))} required />
                    <Input label="Phone" value={formData.customerPhone} onChange={e => setFormData(p => ({ ...p, customerPhone: e.target.value }))} />
                </div>
                <Input label="Pickup Location" value={formData.pickupLocation} onChange={e => setFormData(p => ({ ...p, pickupLocation: e.target.value }))} required />
                <div className="grid grid-cols-2 gap-4">
                    <Input type="date" label="Date" value={formData.visitDate} onChange={e => setFormData(p => ({ ...p, visitDate: e.target.value }))} required />
                    <Input type="time" label="Time" value={formData.visitTime} onChange={e => setFormData(p => ({ ...p, visitTime: e.target.value }))} required />
                </div>
                {isClarificationMode ? (
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Response to Admin</label>
                        <textarea className="w-full p-2 border rounded-lg min-h-[100px]" value={formData.clarificationResponse} onChange={e => setFormData(p => ({ ...p, clarificationResponse: e.target.value }))} required />
                    </div>
                ) : (
                    <div className="space-y-1">
                         <button type="button" onClick={() => setShowNotes(!showNotes)} className="text-sm font-medium flex items-center gap-1 text-blue-600">
                             <MessageSquare size={16}/> {showNotes ? "Hide Notes" : "Add Notes"}
                         </button>
                         {showNotes && <textarea className="w-full p-2 border rounded-lg min-h-[80px]" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />}
                    </div>
                )}
                <ModalFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>{editingVisit ? "Update" : "Submit"}</Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
