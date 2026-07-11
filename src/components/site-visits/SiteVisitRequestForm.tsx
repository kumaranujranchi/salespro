import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalFooter } from '../ui/Modal';
import { AlertCircle, MessageSquare, Search, X, User } from 'lucide-react';
import { toast } from 'sonner';

interface SiteVisitRequestFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingVisit?: any | null;
}

export function SiteVisitRequestForm({ isOpen, onClose, onSuccess, editingVisit }: SiteVisitRequestFormProps) {
    const { profile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // UI State
    const [showNotes, setShowNotes] = useState(false);
    const [isClarificationMode, setIsClarificationMode] = useState(false);

    // Lead search state
    const [leadSearch, setLeadSearch] = useState('');
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [showLeadDropdown, setShowLeadDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        pickupLocation: '',
        visitDate: '',
        visitTime: '',
        notes: '',
        clarificationResponse: ''
    });

    // Fetch leads for search — uses the lightweight non-paginated searchLeads query
    const searchResults = useQuery(
        api.leads.searchLeads,
        profile?.tenant_id && leadSearch.length >= 2 ? {
            tenant_id: profile.tenant_id as Id<"tenants">,
            searchQuery: leadSearch,
            profileId: profile.id as Id<"profiles">,
        } : "skip"
    );

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
                visitDate: editingVisit.visit_date,
                visitTime: editingVisit.visit_time,
                notes: editingVisit.notes || '',
                clarificationResponse: ''
            });
            if (editingVisit.notes) setShowNotes(true);
            // If editing has a linked lead, show it
            if (editingVisit.lead) {
                setSelectedLead(editingVisit.lead);
            }
        } else {
            resetForm();
            setIsClarificationMode(false);
            setShowNotes(false);
        }
    }, [editingVisit, isOpen]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowLeadDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const resetForm = () => {
        setFormData({
            customerName: '',
            customerPhone: '',
            pickupLocation: '',
            visitDate: '',
            visitTime: '',
            notes: '',
            clarificationResponse: ''
        });
        setSelectedLead(null);
        setLeadSearch('');
    };

    const handleSelectLead = (lead: any) => {
        setSelectedLead(lead);
        setLeadSearch('');
        setShowLeadDropdown(false);
        setFormData(prev => ({
            ...prev,
            customerName: lead.customer_name,
            customerPhone: lead.mobile || '',
        }));
    };

    const handleClearLead = () => {
        setSelectedLead(null);
        setFormData(prev => ({ ...prev, customerName: '', customerPhone: '' }));
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
                    lead_id: selectedLead?._id ?? undefined,
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

    // searchResults is already filtered by the backend
    const filteredLeads = searchResults || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingVisit ? "Edit Request" : "Schedule Site Visit"}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {isClarificationMode && editingVisit?.clarification_note && (
                    <div className="bg-amber-50 p-3 rounded-lg flex gap-2">
                        <AlertCircle className="text-amber-600 shrink-0" size={18} />
                        <p className="text-sm text-amber-900">{editingVisit.clarification_note}</p>
                    </div>
                )}

                {/* Lead Selection */}
                {!editingVisit && (
                    <div className="space-y-2" ref={searchRef}>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Link to Lead <span className="text-xs font-normal text-gray-400">(optional — auto-fills customer details)</span>
                        </label>

                        {selectedLead ? (
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center shrink-0">
                                    <User size={16} className="text-emerald-600 dark:text-emerald-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{selectedLead.customer_name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedLead.mobile} · {selectedLead.lead_status}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearLead}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={leadSearch}
                                        onChange={e => { setLeadSearch(e.target.value); setShowLeadDropdown(true); }}
                                        onFocus={() => leadSearch.length >= 2 && setShowLeadDropdown(true)}
                                        placeholder="Search by customer name or phone..."
                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                                    />
                                </div>

                                {showLeadDropdown && leadSearch.length >= 2 && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a2a1e] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                                        {filteredLeads.length > 0 ? filteredLeads.map((lead: any) => (
                                            <button
                                                key={lead._id}
                                                type="button"
                                                onClick={() => handleSelectLead(lead)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-left"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                                                    <User size={14} className="text-gray-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{lead.customer_name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{lead.mobile} · <span className="capitalize">{lead.lead_status}</span></p>
                                                </div>
                                            </button>
                                        )) : (
                                            <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                                No leads found for "{leadSearch}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Customer Name *"
                        value={formData.customerName}
                        onChange={e => setFormData(p => ({ ...p, customerName: e.target.value }))}
                        required
                        readOnly={!!selectedLead}
                        className={selectedLead ? 'bg-gray-50 dark:bg-white/5 cursor-not-allowed' : ''}
                    />
                    <Input
                        label="Phone"
                        value={formData.customerPhone}
                        onChange={e => setFormData(p => ({ ...p, customerPhone: e.target.value }))}
                        readOnly={!!selectedLead}
                        className={selectedLead ? 'bg-gray-50 dark:bg-white/5 cursor-not-allowed' : ''}
                    />
                </div>

                <Input label="Pickup Location *" value={formData.pickupLocation} onChange={e => setFormData(p => ({ ...p, pickupLocation: e.target.value }))} required />

                <div className="grid grid-cols-2 gap-4">
                    <Input type="date" label="Date *" value={formData.visitDate} onChange={e => setFormData(p => ({ ...p, visitDate: e.target.value }))} required />
                    <Input type="time" label="Time *" value={formData.visitTime} onChange={e => setFormData(p => ({ ...p, visitTime: e.target.value }))} required />
                </div>

                {isClarificationMode ? (
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Response to Admin</label>
                        <textarea className="w-full p-2 border rounded-lg min-h-[100px] dark:bg-white/5 dark:border-white/10 dark:text-white" value={formData.clarificationResponse} onChange={e => setFormData(p => ({ ...p, clarificationResponse: e.target.value }))} required />
                    </div>
                ) : (
                    <div className="space-y-1">
                        <button type="button" onClick={() => setShowNotes(!showNotes)} className="text-sm font-medium flex items-center gap-1 text-blue-600">
                            <MessageSquare size={16}/> {showNotes ? "Hide Notes" : "Add Notes"}
                        </button>
                        {showNotes && <textarea className="w-full p-2 border rounded-lg min-h-[80px] dark:bg-white/5 dark:border-white/10 dark:text-white" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />}
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
