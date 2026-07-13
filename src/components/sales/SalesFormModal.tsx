import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal, ModalFooter } from '../ui/Modal';
import { User, DollarSign, FileText, Calendar, MapPin } from 'lucide-react';
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
    const convex = useConvex();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'booking' | 'customer' | 'address' | 'coapplicant'>('booking');

    // Convex Queries
    const projects = useQuery(api.projects.listRunningProjects, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");
    const executives = useQuery(api.profiles.listExecutives, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");

    // Mutations
    const createSale = useMutation(api.sales.createSale);
    const updateSale = useMutation(api.sales.updateSale);
    const createLead = useMutation(api.leads.createLead);
    const updateLead = useMutation(api.leads.updateLead);

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
        customFields: [] as { label: string, value: string }[],
        // Customer Info (Primary Applicant)
        fatherHusbandName: '',
        dob: '',
        gender: '',
        alternateMobile: '',
        panNumber: '',
        aadhaarNumber: '',
        occupation: '',
        companyName: '',
        annualIncome: '',
        maritalStatus: '',
        nationality: 'Indian',
        passport: '',
        // Address Details
        addressHouseNo: '',
        addressStreet: '',
        addressCity: '',
        addressState: '',
        addressPinCode: '',
        addressSameAsCurrent: false,
        permAddressHouseNo: '',
        permAddressStreet: '',
        permAddressCity: '',
        permAddressState: '',
        permAddressPinCode: '',
        // Co-Applicant Details
        coApplicantName: '',
        coApplicantRelation: '',
        coApplicantMobile: '',
        coApplicantAadhaar: '',
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
                bookingAmount: editingSale.booking_amount?.toString() || '',
                paymentMode: editingSale.metadata?.payment_mode || 'cheque',
                transactionRef: editingSale.metadata?.transaction_ref || '',
                customFields: editingSale.metadata?.custom_fields || [],
                // Customer Info
                fatherHusbandName: editingSale.father_husband_name || '',
                dob: editingSale.dob || '',
                gender: editingSale.gender || '',
                alternateMobile: editingSale.alternate_mobile || '',
                panNumber: editingSale.pan_number || '',
                aadhaarNumber: editingSale.aadhaar_number || '',
                occupation: editingSale.occupation || '',
                companyName: editingSale.company_name || '',
                annualIncome: editingSale.annual_income || '',
                maritalStatus: editingSale.marital_status || '',
                nationality: editingSale.nationality || 'Indian',
                passport: editingSale.passport || '',
                // Address Details
                addressHouseNo: editingSale.address_house_no || '',
                addressStreet: editingSale.address_street || '',
                addressCity: editingSale.address_city || '',
                addressState: editingSale.address_state || '',
                addressPinCode: editingSale.address_pin_code || '',
                addressSameAsCurrent: editingSale.address_same_as_current || false,
                permAddressHouseNo: editingSale.perm_address_house_no || '',
                permAddressStreet: editingSale.perm_address_street || '',
                permAddressCity: editingSale.perm_address_city || '',
                permAddressState: editingSale.perm_address_state || '',
                permAddressPinCode: editingSale.perm_address_pin_code || '',
                // Co-Applicant Details
                coApplicantName: editingSale.co_applicant_name || '',
                coApplicantRelation: editingSale.co_applicant_relation || '',
                coApplicantMobile: editingSale.co_applicant_mobile || '',
                coApplicantAadhaar: editingSale.co_applicant_aadhaar || '',
            });
        } else if (isOpen) {
            // Reset to defaults
            setFormData({
                customerName: '',
                customerPhone: '',
                customerEmail: '',
                executiveId: '',
                bookingDate: new Date().toISOString().slice(0, 10),
                projectId: '',
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
                customFields: [],
                fatherHusbandName: '',
                dob: '',
                gender: '',
                alternateMobile: '',
                panNumber: '',
                aadhaarNumber: '',
                occupation: '',
                companyName: '',
                annualIncome: '',
                maritalStatus: '',
                nationality: 'Indian',
                passport: '',
                addressHouseNo: '',
                addressStreet: '',
                addressCity: '',
                addressState: '',
                addressPinCode: '',
                addressSameAsCurrent: false,
                permAddressHouseNo: '',
                permAddressStreet: '',
                permAddressCity: '',
                permAddressState: '',
                permAddressPinCode: '',
                coApplicantName: '',
                coApplicantRelation: '',
                coApplicantMobile: '',
                coApplicantAadhaar: '',
            });
            setActiveTab('booking');
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

        // Validation Checks
        if (!formData.projectId) {
            toast.error("Project selection is required. Please check the Property & Pricing tab.");
            setActiveTab('booking');
            setIsSubmitting(false);
            return;
        }
        if (!formData.executiveId) {
            toast.error("Sales Executive selection is required. Please check the Property & Pricing tab.");
            setActiveTab('booking');
            setIsSubmitting(false);
            return;
        }
        if (!formData.areaSqft) {
            toast.error("Area is required. Please check the Property & Pricing tab.");
            setActiveTab('booking');
            setIsSubmitting(false);
            return;
        }
        if (!formData.ratePerSqft) {
            toast.error("Rate per Sq Ft is required. Please check the Property & Pricing tab.");
            setActiveTab('booking');
            setIsSubmitting(false);
            return;
        }
        if (!formData.customerName) {
            toast.error("Customer Name is required. Please check the Primary Applicant tab.");
            setActiveTab('customer');
            setIsSubmitting(false);
            return;
        }
        if (!formData.customerPhone) {
            toast.error("Customer Phone Number is required. Please check the Primary Applicant tab.");
            setActiveTab('customer');
            setIsSubmitting(false);
            return;
        }

        try {
            // Find or Create/Update Lead (Customer)
            let leadId = editingSale?.customer_id;
            
            if (leadId) {
                // If editing, update the existing lead details
                await updateLead({
                    id: leadId,
                    customer_name: formData.customerName,
                    mobile: formData.customerPhone,
                    email: formData.customerEmail || undefined,
                });
            } else {
                // If creating, find lead by mobile or create it
                const existingLead = await convex.query(api.leads.getLeadByMobile, { 
                    tenant_id: profile.tenant_id as Id<"tenants">, 
                    mobile: formData.customerPhone 
                });

                leadId = existingLead?._id;
                if (!leadId) {
                    leadId = await createLead({
                        tenant_id: profile.tenant_id as Id<"tenants">,
                        customer_name: formData.customerName,
                        mobile: formData.customerPhone,
                        email: formData.customerEmail || undefined,
                        lead_source: 'Walk-in',
                        lead_status: 'Converted',
                        lead_score: 'Hot',
                        created_by: profile.id as Id<"profiles">,
                        metadata: { auto_created_from_sale: true }
                    });
                } else {
                    // Update existing lead details if found
                    await updateLead({
                        id: leadId,
                        customer_name: formData.customerName,
                        mobile: formData.customerPhone,
                        email: formData.customerEmail || undefined,
                    });
                }
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
                agreement_date: formData.isAgreementDone ? formData.agreementDate : undefined,
                is_registry_done: formData.isRegistryDone,
                registry_date: formData.isRegistryDone ? formData.registryDate : undefined,
                status: 'booked',
                unit_number: formData.unitNumber || undefined,
                father_husband_name: formData.fatherHusbandName || undefined,
                dob: formData.dob || undefined,
                gender: formData.gender || undefined,
                alternate_mobile: formData.alternateMobile || undefined,
                pan_number: formData.panNumber || undefined,
                aadhaar_number: formData.aadhaarNumber || undefined,
                occupation: formData.occupation || undefined,
                company_name: formData.companyName || undefined,
                annual_income: formData.annualIncome || undefined,
                marital_status: formData.maritalStatus || undefined,
                nationality: formData.nationality || undefined,
                passport: formData.passport || undefined,
                address_house_no: formData.addressHouseNo || undefined,
                address_street: formData.addressStreet || undefined,
                address_city: formData.addressCity || undefined,
                address_state: formData.addressState || undefined,
                address_pin_code: formData.addressPinCode || undefined,
                address_same_as_current: formData.addressSameAsCurrent,
                perm_address_house_no: formData.addressSameAsCurrent ? formData.addressHouseNo : (formData.permAddressHouseNo || undefined),
                perm_address_street: formData.addressSameAsCurrent ? formData.addressStreet : (formData.permAddressStreet || undefined),
                perm_address_city: formData.addressSameAsCurrent ? formData.addressCity : (formData.permAddressCity || undefined),
                perm_address_state: formData.addressSameAsCurrent ? formData.addressState : (formData.permAddressState || undefined),
                perm_address_pin_code: formData.addressSameAsCurrent ? formData.addressPinCode : (formData.permAddressPinCode || undefined),
                co_applicant_name: formData.coApplicantName || undefined,
                co_applicant_relation: formData.coApplicantRelation || undefined,
                co_applicant_mobile: formData.coApplicantMobile || undefined,
                co_applicant_aadhaar: formData.coApplicantAadhaar || undefined,
                metadata: {
                    plc: parseFloat(formData.plc) || 0,
                    dev_charges: parseFloat(formData.devCharges) || 0,
                    additional_charges: parseFloat(formData.otherCharges) || 0,
                    discount: parseFloat(formData.discount) || 0,
                    payment_mode: formData.paymentMode,
                    transaction_ref: formData.transactionRef,
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
        <Modal isOpen={isOpen} onClose={onClose} title={editingSale ? "Edit Sale Details" : "New Sale Record"} size="xl">
            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6 pt-3">
                <button
                    type="button"
                    className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
                        activeTab === 'booking'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                    onClick={() => setActiveTab('booking')}
                >
                    <DollarSign size={16} /> Property & Pricing
                </button>
                <button
                    type="button"
                    className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
                        activeTab === 'customer'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                    onClick={() => setActiveTab('customer')}
                >
                    <User size={16} /> Primary Applicant
                </button>
                <button
                    type="button"
                    className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
                        activeTab === 'address'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                    onClick={() => setActiveTab('address')}
                >
                    <MapPin size={16} /> Address Details
                </button>
                <button
                    type="button"
                    className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
                        activeTab === 'coapplicant'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                    onClick={() => setActiveTab('coapplicant')}
                >
                    <User size={16} /> Co-Applicant
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* 1. PROPERTY & PRICING TAB */}
                {activeTab === 'booking' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Project" value={formData.projectId} onChange={e => setFormData({ ...formData, projectId: e.target.value })} 
                                options={projects.map(p => ({ label: p.name, value: p._id }))} required />
                            <Select label="Sales Executive" value={formData.executiveId} onChange={e => setFormData({ ...formData, executiveId: e.target.value })} 
                                options={executives.map(e => ({ label: e.full_name, value: e._id }))} required />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Input label="Area (Sq Ft)" type="number" step="any" value={formData.areaSqft} onChange={e => setFormData({ ...formData, areaSqft: e.target.value })} required />
                            <Input label="Rate / Sq Ft" type="number" step="any" value={formData.ratePerSqft} onChange={e => setFormData({ ...formData, ratePerSqft: e.target.value })} required />
                            <Input label="Unit Number" value={formData.unitNumber} onChange={e => setFormData({ ...formData, unitNumber: e.target.value })} placeholder="E.g. Flat-102" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <Input label="PLC (%)" type="number" step="any" value={formData.plc} onChange={e => setFormData({ ...formData, plc: e.target.value })} placeholder="Preferential Location Charges" />
                            <Input label="Dev Charges (Per Sq Ft)" type="number" step="any" value={formData.devCharges} onChange={e => setFormData({ ...formData, devCharges: e.target.value })} placeholder="Development Charges" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Additional / Other Charges" type="number" step="any" value={formData.otherCharges} onChange={e => setFormData({ ...formData, otherCharges: e.target.value })} />
                            <Input label="Discount Amount" type="number" step="any" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-3 gap-4 border-t pt-4">
                            <Input label="Booking Amount Paid" type="number" step="any" value={formData.bookingAmount} onChange={e => setFormData({ ...formData, bookingAmount: e.target.value })} />
                            <Select label="Payment Mode" value={formData.paymentMode} onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                                options={[
                                    { value: 'cash', label: 'Cash' },
                                    { value: 'cheque', label: 'Cheque' },
                                    { value: 'bank_transfer', label: 'Bank Transfer (NEFT/RTGS)' },
                                    { value: 'online', label: 'Online / UPI' }
                                ]} />
                            <Input label="Transaction/Cheque Ref" value={formData.transactionRef} onChange={e => setFormData({ ...formData, transactionRef: e.target.value })} placeholder="Cheque No / UTR" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <Input label="Booking Date" type="date" value={formData.bookingDate} onChange={e => setFormData({ ...formData, bookingDate: e.target.value })} required />
                        </div>

                        {/* Agreement & Registry Status */}
                        <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-gray-200">
                                    <input type="checkbox" checked={formData.isAgreementDone} onChange={e => setFormData({ ...formData, isAgreementDone: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    Agreement Completed
                                </label>
                                {formData.isAgreementDone && (
                                    <Input label="Agreement Date" type="date" value={formData.agreementDate} onChange={e => setFormData({ ...formData, agreementDate: e.target.value })} required />
                                )}
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-gray-200">
                                    <input type="checkbox" checked={formData.isRegistryDone} onChange={e => setFormData({ ...formData, isRegistryDone: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    Registry Completed
                                </label>
                                {formData.isRegistryDone && (
                                    <Input label="Registry Date" type="date" value={formData.registryDate} onChange={e => setFormData({ ...formData, registryDate: e.target.value })} required />
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Total Calculated Cost:</span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(calculateTotal())}</span>
                        </div>
                    </div>
                )}

                {/* 2. PRIMARY APPLICANT TAB */}
                {activeTab === 'customer' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Customer ID (System Auto)" value={editingSale?.customer?.lead_id || 'System Generated'} disabled className="bg-gray-50 disabled:opacity-75" />
                            <Input label="Applicant Full Name" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Input label="Mobile Number" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} required />
                            <Input label="Alternate Mobile" value={formData.alternateMobile} onChange={e => setFormData({ ...formData, alternateMobile: e.target.value })} />
                            <Input label="Email ID" type="email" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <Input label="Father's / Husband's Name" value={formData.fatherHusbandName} onChange={e => setFormData({ ...formData, fatherHusbandName: e.target.value })} />
                            <Input label="Date of Birth" type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Select label="Gender" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                options={[
                                    { value: 'male', label: 'Male' },
                                    { value: 'female', label: 'Female' },
                                    { value: 'other', label: 'Other' }
                                ]} />
                            <Input label="PAN Number" value={formData.panNumber} onChange={e => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" maxLength={10} />
                            <Input label="Aadhaar Number" value={formData.aadhaarNumber} onChange={e => setFormData({ ...formData, aadhaarNumber: e.target.value })} placeholder="12-digit number" maxLength={12} />
                        </div>
                        <div className="grid grid-cols-3 gap-4 border-t pt-4">
                            <Input label="Occupation" value={formData.occupation} onChange={e => setFormData({ ...formData, occupation: e.target.value })} placeholder="Job, Business, Retired etc." />
                            <Input label="Company Name" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                            <Input label="Annual Income" value={formData.annualIncome} onChange={e => setFormData({ ...formData, annualIncome: e.target.value })} placeholder="E.g. 8 Lakhs" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Select label="Marital Status" value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}
                                options={[
                                    { value: 'single', label: 'Single' },
                                    { value: 'married', label: 'Married' },
                                    { value: 'divorced', label: 'Divorced' },
                                    { value: 'widowed', label: 'Widowed' }
                                ]} />
                            <Input label="Nationality" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />
                            <Input label="Passport Number (NRI Case)" value={formData.passport} onChange={e => setFormData({ ...formData, passport: e.target.value })} />
                        </div>
                    </div>
                )}

                {/* 3. ADDRESS DETAILS TAB */}
                {activeTab === 'address' && (
                    <div className="space-y-6">
                        {/* Current Address */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-800 dark:text-gray-200 border-b pb-2">Current Address</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="House/Flat/Plot No" value={formData.addressHouseNo} onChange={e => setFormData({ ...formData, addressHouseNo: e.target.value })} />
                                <Input label="Street / Landmark" value={formData.addressStreet} onChange={e => setFormData({ ...formData, addressStreet: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <Input label="City" value={formData.addressCity} onChange={e => setFormData({ ...formData, addressCity: e.target.value })} />
                                <Input label="State" value={formData.addressState} onChange={e => setFormData({ ...formData, addressState: e.target.value })} />
                                <Input label="PIN Code" value={formData.addressPinCode} onChange={e => setFormData({ ...formData, addressPinCode: e.target.value })} maxLength={6} />
                            </div>
                        </div>

                        {/* Permanent Address */}
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-gray-200">Permanent Address</h3>
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.addressSameAsCurrent}
                                        onChange={e => setFormData({ ...formData, addressSameAsCurrent: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Same as Current Address
                                </label>
                            </div>

                            {!formData.addressSameAsCurrent && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="House/Flat/Plot No" value={formData.permAddressHouseNo} onChange={e => setFormData({ ...formData, permAddressHouseNo: e.target.value })} />
                                        <Input label="Street / Landmark" value={formData.permAddressStreet} onChange={e => setFormData({ ...formData, permAddressStreet: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <Input label="City" value={formData.permAddressCity} onChange={e => setFormData({ ...formData, permAddressCity: e.target.value })} />
                                        <Input label="State" value={formData.permAddressState} onChange={e => setFormData({ ...formData, permAddressState: e.target.value })} />
                                        <Input label="PIN Code" value={formData.permAddressPinCode} onChange={e => setFormData({ ...formData, permAddressPinCode: e.target.value })} maxLength={6} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* 4. CO-APPLICANT DETAILS TAB */}
                {activeTab === 'coapplicant' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 dark:text-gray-200 border-b pb-2">Co-Applicant Details (If Applicable)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Co-Applicant Full Name" value={formData.coApplicantName} onChange={e => setFormData({ ...formData, coApplicantName: e.target.value })} />
                            <Select label="Relationship with Primary Applicant" value={formData.coApplicantRelation} onChange={e => setFormData({ ...formData, coApplicantRelation: e.target.value })}
                                options={[
                                    { value: 'Spouse', label: 'Spouse (Wife/Husband)' },
                                    { value: 'Father', label: 'Father' },
                                    { value: 'Mother', label: 'Mother' },
                                    { value: 'Son', label: 'Son' },
                                    { value: 'Daughter', label: 'Daughter' },
                                    { value: 'Brother', label: 'Brother' },
                                    { value: 'Sister', label: 'Sister' },
                                    { value: 'Other', label: 'Other Relation' }
                                ]} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Mobile Number" value={formData.coApplicantMobile} onChange={e => setFormData({ ...formData, coApplicantMobile: e.target.value })} />
                            <Input label="Aadhaar Number" value={formData.coApplicantAadhaar} onChange={e => setFormData({ ...formData, coApplicantAadhaar: e.target.value })} maxLength={12} placeholder="12-digit number" />
                        </div>
                    </div>
                )}

                <ModalFooter>
                    <div className="flex gap-2">
                        {activeTab !== 'booking' && (
                            <Button variant="outline" type="button" onClick={() => {
                                if (activeTab === 'coapplicant') setActiveTab('address');
                                else if (activeTab === 'address') setActiveTab('customer');
                                else if (activeTab === 'customer') setActiveTab('booking');
                            }}>Previous Tab</Button>
                        )}
                        {activeTab !== 'coapplicant' ? (
                            <Button variant="primary" type="button" onClick={() => {
                                if (activeTab === 'booking') setActiveTab('customer');
                                else if (activeTab === 'customer') setActiveTab('address');
                                else if (activeTab === 'address') setActiveTab('coapplicant');
                            }}>Next Tab</Button>
                        ) : (
                            <Button variant="primary" type="submit" isLoading={isSubmitting}>{editingSale ? "Update Details" : "Book Sale"}</Button>
                        )}
                    </div>
                </ModalFooter>
            </form>
        </Modal>
    );
}
