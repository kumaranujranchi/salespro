import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { useQuery, useMutation } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal, ModalFooter } from '../ui/Modal';
import { User, DollarSign, FileText, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SalesFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingSale?: any | null;
}

export function SalesFormModal({ isOpen, onClose, onSuccess, editingSale }: SalesFormModalProps) {
    const { profile } = useAuth();
    const dialog = useDialog();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Convex Queries
    const projects = useQuery(api.projects.listRunningProjects, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");
    const executives = useQuery(api.profiles.listDrivers, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip"); // Using listDrivers as a proxy for profiles for now, should ideally be listExecutives

    // Mutations
    const createSale = useMutation(api.sales.createSale);
    const updateSale = useMutation(api.sales.updateSale);
    const createLead = useMutation(api.leads.createLead);

    // Form State
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        executiveId: '' as string,
        bookingDate: new Date().toISOString().slice(0, 10),
        projectId: '' as string,
        unitNumber: '',
        areaSqft: '',
        ratePerSqft: '',
        plc: '0',
        devCharges: '0',
        otherCharges: '0',
        discount: '0',
        isAgreementDone: false,
        agreementDate: '',
        isRegistryDone: false,
        registryDate: '',
        bookingAmount: '',
        paymentMode: 'cheque',
        transactionRef: '',
        customFields: [] as { label: string, value: string }[]
    });

    useEffect(() => {
        if (isOpen && editingSale) {
            setFormData({
                customerName: editingSale.customer?.name || '',
                customerPhone: editingSale.customer?.phone || '',
                customerEmail: editingSale.customer?.email || '',
                executiveId: editingSale.sales_executive_id,
                bookingDate: editingSale.sale_date,
                projectId: editingSale.project_id,
                unitNumber: editingSale.unit_number || '',
                areaSqft: editingSale.area_sqft?.toString() || '',
                ratePerSqft: editingSale.rate_per_sqft?.toString() || '',
                plc: (editingSale.metadata?.plc || 0).toString(),
                devCharges: (editingSale.metadata?.dev_charges || 0).toString(),
                otherCharges: (editingSale.metadata?.additional_charges || 0).toString(),
                discount: (editingSale.metadata?.discount || 0).toString(),
                isAgreementDone: editingSale.is_agreement_done || false,
                agreementDate: editingSale.agreement_date || '',
                isRegistryDone: editingSale.is_registry_done || false,
                registryDate: editingSale.registry_date || '',
                bookingAmount: '',
                paymentMode: 'cheque',
                transactionRef: '',
                customFields: editingSale.metadata?.custom_fields || []
            });
        }
    }, [isOpen, editingSale]);

    const calculateTotal = () => {
        const area = parseFloat(formData.areaSqft) || 0;
        const rate = parseFloat(formData.ratePerSqft) || 0;
        const plc = parseFloat(formData.plc) || 0;
        const dev = parseFloat(formData.devCharges) || 0;
        const other = parseFloat(formData.otherCharges) || 0;
        const discount = parseFloat(formData.discount) || 0;
        return (area * rate) + (area * dev) + (area * rate * (plc / 100)) + other - discount;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.tenant_id) return;
        setIsSubmitting(true);

        try {
            // 1. Create/Find Lead (Customer)
            // Simplified: Always try to create or update lead status to Converted in mutation
            // (Handled by createSale mutation internally in our new sales.ts)
            
            // Wait, I need a Lead ID. I'll just pass the details and let the mutation handle it
            // Actually, my createSale mutation expects customer_id: v.id("leads")
            
            // So I need to find lead by mobile first
            const existingLead = await ctx.runQuery(api.leads.getLeadByMobile, { 
                tenant_id: profile.tenant_id as Id<"tenants">, 
                mobile: formData.customerPhone 
            });

            let leadId = existingLead?._id;
            if (!leadId) {
                leadId = await createLead({
                    tenant_id: profile.tenant_id as Id<"tenants">,
                    customer_name: formData.customerName,
                    mobile: formData.customerPhone,
                    email: formData.customerEmail,
                    lead_source: 'Walk-in',
                    lead_status: 'Converted',
                    lead_score: 'Hot',
                    created_by: profile.id as Id<"profiles">,
                    metadata: { auto_created_from_sale: true }
                });
            }

            const saleData = {
                tenant_id: profile.tenant_id as Id<"tenants">,
                customer_id: leadId,
                project_id: formData.projectId as Id<"projects">,
                sales_executive_id: formData.executiveId as Id<"profiles">,
                sale_date: formData.bookingDate,
                area_sqft: parseFloat(formData.areaSqft),
                total_revenue: calculateTotal(),
                booking_amount: parseFloat(formData.bookingAmount) || 0,
                is_agreement_done: formData.isAgreementDone,
                agreement_date: formData.agreementDate,
                is_registry_done: formData.isRegistryDone,
                registry_date: formData.registryDate,
                status: 'booked',
                unit_number: formData.unitNumber,
                metadata: {
                    plc: parseFloat(formData.plc),
                    dev_charges: parseFloat(formData.devCharges),
                    additional_charges: parseFloat(formData.otherCharges),
                    discount: parseFloat(formData.discount),
                    custom_fields: formData.customFields
                }
            };

            if (editingSale) {
                await updateSale({ id: editingSale._id, ...saleData });
                toast.success("Sale updated successfully");
            } else {
                await createSale(saleData);
                toast.success("Sale created successfully");
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            let errorMessage = err.message || "Failed to save sale";
            if (errorMessage.includes('ConvexError:')) {
                errorMessage = errorMessage.split('ConvexError:')[1].trim();
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!projects || !executives) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingSale ? "Edit Sale" : "New Sale"} size="xl">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Customer Name" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required />
                    <Input label="Customer Phone" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Select label="Project" value={formData.projectId} onChange={e => setFormData({ ...formData, projectId: e.target.value })} 
                        options={projects.map(p => ({ label: p.name, value: p._id }))} required />
                    <Select label="Executive" value={formData.executiveId} onChange={e => setFormData({ ...formData, executiveId: e.target.value })} 
                        options={executives.map(e => ({ label: e.full_name, value: e._id }))} required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <Input label="Area (Sq Ft)" type="number" value={formData.areaSqft} onChange={e => setFormData({ ...formData, areaSqft: e.target.value })} required />
                    <Input label="Rate / Sq Ft" type="number" value={formData.ratePerSqft} onChange={e => setFormData({ ...formData, ratePerSqft: e.target.value })} required />
                    <Input label="Unit Number" value={formData.unitNumber} onChange={e => setFormData({ ...formData, unitNumber: e.target.value })} />
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-bold">Total Revenue:</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(calculateTotal())}</span>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={isSubmitting}>{editingSale ? "Update" : "Create"}</Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
