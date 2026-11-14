import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation } from "../../lib/reactive";
import { api, Id } from '../../lib/api-endpoints';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalFooter } from '../ui/Modal';
import { AlertCircle, MessageSquare, Search, X, User, CheckCircle2, ShieldCheck, Car } from 'lucide-react';
import { toast } from 'sonner';

interface SiteVisitRequestFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingVisit?: any | null;
}

export function SiteVisitRequestForm({ isOpen, onClose, onSuccess, editingVisit }: SiteVisitRequestFormProps) {
    const { profile, tenant } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // UI State
    const [showNotes, setShowNotes] = useState(false);
    const [isClarificationMode, setIsClarificationMode] = useState(false);

    // Lead search & selection state (Strict CRM Lead Linking)
    const [leadSearch, setLeadSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
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

    const targetTenantId = profile?.tenant_id || (tenant as any)?._id || (tenant as any)?.id;

    // 300ms Debounce to prevent unnecessary database load while typing
    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => {
            setDebouncedSearch(leadSearch.trim());
            setIsSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [leadSearch]);

    // Fetch leads for search — uses lightweight query with limit: 20
    const searchResults = useQuery(
        api.leads.searchLeads,
        targetTenantId && isOpen ? {
            tenant_id: targetTenantId as Id<"tenants">,
            searchQuery: debouncedSearch,
            limit: 20,
        } : "skip"
    );

    const isGlobalConfigured = tenant?.settings?.site_visits?.global_visibility !== false;

    // Fetch existing booked visits on selected date to preview fleet and driver availability
    const bookedVisitsOnDate = useQuery(
        api.site_visits.listSiteVisits,
        targetTenantId && formData.visitDate && isGlobalConfigured && isOpen ? {
            tenant_id: targetTenantId as Id<"tenants">,
            visit_date: formData.visitDate,
            filterStatus: 'all',
            scope: 'all'
        } : "skip"
    );

    // Backend mutations
    const createSiteVisit = useMutation(api.site_visits.createSiteVisit);
    const updateSiteVisit = useMutation(api.site_visits.updateSiteVisit);

    useEffect(() => {
        if (editingVisit) {
            setIsClarificationMode(editingVisit.status === 'pending_clarification');
            setFormData({
                customerName: editingVisit.customer_name || '',
                customerPhone: editingVisit.mobile || '',
                pickupLocation: editingVisit.pickup_location || '',
                visitDate: editingVisit.visit_date || '',
                visitTime: editingVisit.visit_time || '',
                notes: editingVisit.notes || '',
                clarificationResponse: ''
            });
            if (editingVisit.notes) setShowNotes(true);
            if (editingVisit.lead) {
                setSelectedLead(editingVisit.lead);
            } else if (editingVisit.customer_name) {
                setSelectedLead({
                    _id: editingVisit.lead_id,
                    customer_name: editingVisit.customer_name,
                    mobile: editingVisit.mobile,
                    lead_status: 'linked'
                });
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
        setShowLeadDropdown(false);
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
        setLeadSearch('');
        setShowLeadDropdown(true);
        setFormData(prev => ({ ...prev, customerName: '', customerPhone: '' }));
    };

    const countWords = (str: string) => str.trim().split(/\s+/).filter(Boolean).length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentUserId = profile?.id || profile?._id;
        if (!currentUserId || !targetTenantId) {
            toast.error("User or tenant session expired. Please refresh.");
            return;
        }

        // Strict Enforcement: Only existing CRM leads can be scheduled
        if (!selectedLead && !editingVisit) {
            toast.error("Please search and select an existing customer from your CRM leads.");
            return;
        }

        if (!formData.customerName.trim()) {
            toast.error("Please select a valid customer.");
            return;
        }

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

            const leadId = selectedLead?._id || selectedLead?.id || editingVisit?.lead_id || undefined;

            if (editingVisit) {
                await updateSiteVisit({
                    id: editingVisit._id || editingVisit.id,
                    status: isClarificationMode ? 'pending' : undefined,
                    lead_id: leadId,
                    customer_name: formData.customerName,
                    mobile: formData.customerPhone,
                    visit_date: formData.visitDate,
                    visit_time: formData.visitTime,
                    pickup_location: formData.pickupLocation,
                    metadata: { notes: finalNotes }
                });
            } else {
                await createSiteVisit({
                    tenant_id: targetTenantId as Id<"tenants">,
                    requested_by: currentUserId as Id<"profiles">,
                    lead_id: leadId as Id<"leads">,
                    customer_name: formData.customerName,
                    mobile: formData.customerPhone,
                    visit_date: formData.visitDate,
                    visit_time: formData.visitTime,
                    pickup_location: formData.pickupLocation,
                    notes: finalNotes,
                    status: 'pending'
                });
            }

            toast.success(editingVisit ? 'Request updated successfully!' : 'Site visit request submitted!');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to save request");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredLeads = searchResults || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingVisit ? "Edit Site Visit Request" : "Schedule Site Visit"}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {isClarificationMode && editingVisit?.clarification_note && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 rounded-lg flex gap-2">
                        <AlertCircle className="text-amber-600 shrink-0" size={18} />
                        <p className="text-sm text-amber-900 dark:text-amber-200">{editingVisit.clarification_note}</p>
                    </div>
                )}

                {/* 1. Customer Selection from CRM Leads (Strict auto-complete search) */}
                <div className="space-y-1.5" ref={searchRef}>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-gray-200">
                        Customer (Select from CRM Leads) <span className="text-red-500">*</span>
                    </label>

                    {selectedLead ? (
                        <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-500/50 rounded-xl transition-all shadow-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-700">
                                    <User size={18} className="text-emerald-700 dark:text-emerald-300" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                            {selectedLead.customer_name}
                                        </span>
                                        {selectedLead.lead_status && (
                                            <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                                                {selectedLead.lead_status}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        📱 {selectedLead.mobile || 'No Phone'} {selectedLead.city ? `· 📍 ${selectedLead.city}` : ''}
                                    </p>
                                </div>
                            </div>

                            {!editingVisit && (
                                <button
                                    type="button"
                                    onClick={handleClearLead}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-red-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-slate-200 dark:border-white/10"
                                    title="Choose a different customer"
                                >
                                    <X size={14} />
                                    <span>Change</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="relative">
                                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={leadSearch}
                                    onChange={e => {
                                        setLeadSearch(e.target.value);
                                        setShowLeadDropdown(true);
                                    }}
                                    onFocus={() => setShowLeadDropdown(true)}
                                    placeholder="Type customer name or mobile number..."
                                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                                    autoFocus
                                />
                                {leadSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setLeadSearch('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Suggestions */}
                            {showLeadDropdown && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                                        <span>{leadSearch ? `Matches for "${leadSearch}"` : "Recent CRM Leads"}</span>
                                        <span>{filteredLeads.length} leads</span>
                                    </div>

                                    {isSearching ? (
                                        <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                                            <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                            Searching CRM leads...
                                        </div>
                                    ) : filteredLeads.length > 0 ? (
                                        filteredLeads.map((lead: any) => (
                                            <button
                                                key={lead._id || lead.id}
                                                type="button"
                                                onClick={() => handleSelectLead(lead)}
                                                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 transition-colors text-left group"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-xs shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 group-hover:text-emerald-700">
                                                        {lead.customer_name?.charAt(0)?.toUpperCase() || 'L'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                                            {lead.customer_name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            📱 {lead.mobile || 'No Phone'} {lead.city ? `· 📍 ${lead.city}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                {lead.lead_status && (
                                                    <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 capitalize">
                                                        {lead.lead_status}
                                                    </span>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {leadSearch ? `No CRM lead matches "${leadSearch}"` : "No leads found in your CRM"}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Only registered leads can have a site visit scheduled. Please add the lead in CRM first.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Customer Phone (Locked & CRM Verified) */}
                    <div className="pt-2">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Customer Phone / Mobile
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.customerPhone}
                                readOnly
                                placeholder="Auto-filled from selected CRM lead"
                                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-mono cursor-not-allowed"
                            />
                            {formData.customerPhone && (
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                    <ShieldCheck size={12} />
                                    CRM Verified
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Pickup Location */}
                <Input
                    label="Pickup Location *"
                    value={formData.pickupLocation}
                    onChange={e => setFormData(p => ({ ...p, pickupLocation: e.target.value }))}
                    placeholder="Enter pickup address / landmark..."
                    required
                />

                {/* 3. Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        type="date"
                        label="Date *"
                        value={formData.visitDate}
                        onChange={e => setFormData(p => ({ ...p, visitDate: e.target.value }))}
                        required
                    />
                    <Input
                        type="time"
                        label="Time *"
                        value={formData.visitTime}
                        onChange={e => setFormData(p => ({ ...p, visitTime: e.target.value }))}
                        required
                    />
                </div>

                {/* Real-time Fleet & Driver Schedule Preview for selected date */}
                {formData.visitDate && isGlobalConfigured && (
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-1.5">
                                <Car size={15} className="text-emerald-600" />
                                Existing Driver & Car Bookings for {formData.visitDate}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                                {bookedVisitsOnDate ? `${(bookedVisitsOnDate as any[]).filter(v => v.status === 'approved' || v.status === 'trip_started').length} booked` : 'Checking...'}
                            </span>
                        </div>

                        {bookedVisitsOnDate && (bookedVisitsOnDate as any[]).filter(v => v.status === 'approved' || v.status === 'trip_started').length > 0 ? (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {(bookedVisitsOnDate as any[]).filter(v => v.status === 'approved' || v.status === 'trip_started').map((v: any) => (
                                    <div key={v._id || v.id} className="flex items-center justify-between text-xs p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/10 shadow-2xs">
                                        <div className="min-w-0 pr-2">
                                            <span className="font-semibold text-slate-900 dark:text-white">⏰ {v.visit_time || 'Time TBD'}</span>
                                            <span className="text-slate-600 dark:text-slate-300 ml-2 font-medium">🚗 {v.driver?.full_name ? `${v.driver.full_name} (${v.driver.phone || 'Assigned'})` : (v.driver_name || 'Driver assigned')}</span>
                                            <span className="text-slate-400 ml-1.5 truncate">({v.pickup_location})</span>
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded shrink-0">
                                            Booked
                                        </span>
                                    </div>
                                ))}
                                <p className="text-[11px] text-amber-600 dark:text-amber-400 italic pt-1">
                                    💡 Tip: Check above time slots to avoid driver conflicts when scheduling.
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                                <CheckCircle2 size={14} /> All company vehicles & drivers are currently free on this date!
                            </p>
                        )}
                    </div>
                )}

                {/* 4. Notes & Clarification */}
                {isClarificationMode ? (
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Response to Admin</label>
                        <textarea
                            className="w-full p-2 border rounded-lg min-h-[100px] dark:bg-white/5 dark:border-white/10 dark:text-white"
                            value={formData.clarificationResponse}
                            onChange={e => setFormData(p => ({ ...p, clarificationResponse: e.target.value }))}
                            placeholder="Provide clarification details..."
                            required
                        />
                    </div>
                ) : (
                    <div className="space-y-1">
                        <button
                            type="button"
                            onClick={() => setShowNotes(!showNotes)}
                            className="text-sm font-medium flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                            <MessageSquare size={16}/> {showNotes ? "Hide Notes" : "Add Notes / Instructions"}
                        </button>
                        {showNotes && (
                            <textarea
                                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg min-h-[80px] dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                                value={formData.notes}
                                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Any special notes or client preferences..."
                            />
                        )}
                    </div>
                )}

                <ModalFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>
                        {editingVisit ? "Update Request" : "Submit Site Visit Request"}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
