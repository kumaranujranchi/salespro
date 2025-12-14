import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { supabase } from '../../lib/supabase';
import { logActivity } from '../../lib/logger';
import { Sale, Project, Profile } from '../../types/database';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal, ModalFooter } from '../ui/Modal';
import { User, DollarSign, FileText, Calendar, Trash2 } from 'lucide-react';

interface SalesFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingSale?: Sale | null;
}

export function SalesFormModal({ isOpen, onClose, onSuccess, editingSale }: SalesFormModalProps) {
    const { user } = useAuth();
    const dialog = useDialog();
    const [projects, setProjects] = useState<Project[]>([]);
    const [executives, setExecutives] = useState<Profile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        // Customer
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        allowDuplicate: false,
        coOwners: [] as string[],

        // Assignment
        executiveId: '',

        // Transaction
        bookingDate: new Date().toISOString().slice(0, 10),
        projectId: '',
        unitNumber: '', // Plot No

        // Pricing
        areaSqft: '',
        ratePerSqft: '',
        plc: '0',
        devCharges: '0',
        otherCharges: '0',
        discount: '0',

        // Legal
        isAgreementDone: false,
        agreementDate: '',
        isRegistryDone: false,
        registryDate: '',
        
        // Initial Payment
        bookingAmount: '',
        paymentMode: 'cheque',
        paymentType: 'booking',
        transactionRef: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadProjects();
            loadExecutives();
            if (editingSale) {
                // Populate form
                const customer = (editingSale as any).customer;
                setFormData({
                    customerName: customer?.name || '',
                    customerPhone: customer?.phone || '',
                    customerEmail: customer?.email || '',
                    allowDuplicate: false, // Default to strict on edit usually
                    coOwners: (editingSale as any).co_owners || [],

                    executiveId: editingSale.sales_executive_id,
                    bookingDate: editingSale.sale_date,
                    projectId: editingSale.project_id,
                    unitNumber: editingSale.unit_number || '',
                    areaSqft: editingSale.area_sqft?.toString() || '',
                    ratePerSqft: editingSale.rate_per_sqft?.toString() || '',
                    plc: editingSale.plc?.toString() || '0',
                    devCharges: editingSale.dev_charges?.toString() || '0',
                    otherCharges: editingSale.additional_charges?.toString() || '0',
                    discount: editingSale.discount?.toString() || '0',
                    isAgreementDone: editingSale.is_agreement_done || false,
                    agreementDate: editingSale.agreement_date || '',
                    isRegistryDone: editingSale.is_registry_done || false,
                    registryDate: editingSale.registry_date || '',
                    
                    // Don't populate initial payment fields on edit
                    bookingAmount: '',
                    paymentMode: 'cheque',
                    paymentType: 'booking',
                    transactionRef: ''
                });
            } else {
                resetForm();
            }
        }
    }, [isOpen, editingSale]);

    const resetForm = () => {
        setFormData({
            customerName: '',
            customerPhone: '',
            customerEmail: '',
            allowDuplicate: false,
            coOwners: [],
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
            paymentType: 'booking',
            transactionRef: ''
        });
    };

    const loadProjects = async () => {
        const { data } = await supabase.from('projects').select('*').eq('is_active', true);
        if (data) setProjects(data);
    };

    const loadExecutives = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['sales_executive', 'team_leader']) // Filter appropriately
            .eq('is_active', true);
        if (data) setExecutives(data);
    };

    const calculateTotal = () => {
        const area = parseFloat(formData.areaSqft) || 0;
        const baseRate = parseFloat(formData.ratePerSqft) || 0;
        const dcRate = parseFloat(formData.devCharges) || 0; // DC is now added to base rate
        const plcPercent = parseFloat(formData.plc) || 0; // PLC is now %
        const other = parseFloat(formData.otherCharges) || 0;
        const discount = parseFloat(formData.discount) || 0;

        // Formula: 
        // 1. Base Cost Calculation: (Base Rate + DC Rate) * Area
        // 2. PLC Calculation: (Base Rate * Area) * (PLC% / 100)

        const baseCost = area * baseRate;
        const dcAmount = area * dcRate;

        // PLC is calculated on Base Cost (without DC as per requirement)
        const plcAmount = baseCost * (plcPercent / 100);

        return baseCost + dcAmount + plcAmount + other - discount;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let customerId = (editingSale as any)?.customer_id;

            if (editingSale && customerId) {
                // Check if this customer is linked to other sales
                const { count } = await supabase
                    .from('sales')
                    .select('id', { count: 'exact', head: true })
                    .eq('customer_id', customerId);

                const isSharedCustomer = (count || 0) > 1;

                if (isSharedCustomer) {
                    // Create NEW customer for this sale to avoid affecting others
                    const { data: newCust, error: createError } = await supabase.from('customers').insert({
                        name: formData.customerName,
                        phone: formData.customerPhone,
                        email: formData.customerEmail || null,
                        created_by: user?.id
                    }).select().single();

                    if (createError) {
                        console.error("Error creating new customer for split:", createError);
                        throw new Error(`Failed to create new customer record: ${createError.message} `);
                    }
                    customerId = newCust.id;
                } else {
                    // Update existing customer info (if not shared)
                    await supabase.from('customers').update({
                        name: formData.customerName,
                        phone: formData.customerPhone,
                        email: formData.customerEmail || null
                    }).eq('id', customerId);
                }
            } else {
                let existingCust = null;

                // Only check for existing if duplicate is NOT allowed
                if (!formData.allowDuplicate) {
                    const { data } = await supabase.from('customers').select('id').eq('phone', formData.customerPhone).maybeSingle();
                    existingCust = data;
                }

                if (existingCust) {
                    customerId = existingCust.id;
                } else {
                    const { data: newCust, error: custError } = await supabase.from('customers').insert({
                        name: formData.customerName,
                        phone: formData.customerPhone,
                        email: formData.customerEmail || null,
                        created_by: user?.id
                    }).select().single();

                    if (custError) {
                        console.error("Error creating customer:", custError);
                        throw new Error(`Failed to create customer: ${custError.message} `);
                    }
                    customerId = newCust.id;
                }
            }

            // 2. Save Sale
            const saleData = {
                customer_id: customerId,
                project_id: formData.projectId,
                sales_executive_id: formData.executiveId,
                unit_number: formData.unitNumber,
                area_sqft: parseFloat(formData.areaSqft),
                rate_per_sqft: parseFloat(formData.ratePerSqft),
                plc: parseFloat(formData.plc),
                dev_charges: parseFloat(formData.devCharges),
                additional_charges: parseFloat(formData.otherCharges),
                discount: parseFloat(formData.discount),
                total_revenue: calculateTotal(),
                sale_date: formData.bookingDate,

                // Add Co-Owners
                co_owners: formData.coOwners.filter(n => n.trim() !== ''),

                // Legal
                is_agreement_done: formData.isAgreementDone,
                agreement_date: formData.isAgreementDone ? formData.agreementDate || null : null,
                is_registry_done: formData.isRegistryDone,
                registry_date: formData.isRegistryDone ? formData.registryDate || null : null,

                ...(editingSale ? {} : {
                    sale_number: `SALE - ${Date.now()} `,
                    booking_amount: 0 // Will be handled by payments
                })
            };

            let result;

            if (editingSale) {
                result = await supabase
                    .from('sales')
                    .update(saleData)
                    .eq('id', editingSale.id)
                    .select()
                    .single();

                if (!result.error) {
                    await logActivity('SALE_UPDATED', `Updated sale for unit ${formData.unitNumber}`);
                }
            } else {
                result = await supabase
                    .from('sales')
                    .insert(saleData)
                    .select()
                    .single();

                if (!result.error) {
                    await logActivity('SALE_CREATED', `New sale created for unit ${formData.unitNumber}`);
                }
            }

            const { data: savedSale, error } = result;

            if (error) throw error;

            // Log Activity
            await supabase.from('activity_log').insert({
                user_id: user?.id,
                action: editingSale ? 'SALE_UPDATED' : 'SALE_CREATED',
                entity_type: 'sale',
                entity_id: (savedSale as any).id,
                details: {
                    sale_number: (savedSale as any).sale_number,
                    customer_name: formData.customerName,
                    amount: calculateTotal(),
                    project_id: formData.projectId
                }
            });

            // 3. Handle Initial Payment (New Sales Only)
            if (!editingSale && parseFloat(formData.bookingAmount) > 0) {
              const bookingAmt = parseFloat(formData.bookingAmount);
              /* 
                 Insert payment for Booking Amount.
                 Note: We rely on the returned 'savedSale.id'
              */
              const { error: paymentError } = await supabase.from('payments').insert({
                sale_id: (savedSale as any).id,
                payment_date: formData.bookingDate, // Use booking date as payment date for initial
                amount: bookingAmt,
                payment_type: formData.paymentType,
                payment_mode: formData.paymentMode,
                transaction_reference: formData.transactionRef,
                remarks: 'Initial Booking Amount',
                recorded_by: user?.id
              });

              if (paymentError) {
                console.error("Error creating initial payment:", paymentError);
                await dialog.alert('Sale created but initial payment failed to record. Please add it manually.', { variant: 'warning' });
              } else {
                 await logActivity('PAYMENT_RECEIVED', `Received initial booking amount of ${formatCurrency(bookingAmt)}`);
              }
            }

            await dialog.alert(
                editingSale ? 'Sale updated successfully!' : 'Sale created successfully!',
                { variant: 'success', title: 'Success' }
            );
            onSuccess();
            onClose();

        } catch (err: any) {
            console.error('Error saving sale:', err);
            await dialog.alert(err.message || 'Failed to save sale.', { variant: 'danger' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingSale ? "Edit Sales Record" : "New Sales Record"}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Section */}
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg space-y-4 border border-gray-200 dark:border-white/10">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-[#0A1C37] dark:text-white flex items-center gap-2">
                            <User size={18} className="text-[#1673FF] dark:text-[#1673FF]" />
                            Customer Information
                        </h3>
                        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={formData.allowDuplicate}
                                onChange={e => setFormData({ ...formData, allowDuplicate: e.target.checked })}
                                className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-black/20 text-[#1673FF] focus:ring-[#1673FF]"
                            />
                            Allow Duplicate Entry
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Primary Owner Name *" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required maxLength={100} />
                        <Input label="Mobile Number *" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })} required placeholder="10-digit number" />
                        <Input label="Email Address" type="email" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} className="md:col-span-2" />
                    </div>

                    {/* Co-Owners Dynamic List */}
                    <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-white/10 mt-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Co-Owners / Joint Applicants</label>
                        {formData.coOwners.map((name, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <span className="text-gray-400 text-sm w-6">{index + 1}.</span>
                                <Input
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => {
                                        const newOwners = [...formData.coOwners];
                                        newOwners[index] = e.target.value;
                                        setFormData({ ...formData, coOwners: newOwners });
                                    }}
                                    className="flex-1"
                                />
                                <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 h-10 w-10 p-0" onClick={() => {
                                    const newOwners = formData.coOwners.filter((_, i) => i !== index);
                                    setFormData({ ...formData, coOwners: newOwners });
                                }}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="ghost" size="sm" className="text-[#1673FF] hover:bg-blue-50 mt-1" onClick={() => setFormData({ ...formData, coOwners: [...formData.coOwners, ''] })}>
                            + Add Co-Owner
                        </Button>
                    </div>
                </div>

                {/* Assignment & Transaction */}
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg space-y-4 border border-gray-200 dark:border-white/10">
                    <h3 className="font-semibold text-[#0A1C37] dark:text-white flex items-center gap-2">
                        <Calendar size={18} className="text-[#1673FF]" />
                        Transaction Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Project Name *"
                            value={formData.projectId}
                            onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                            options={projects.map(p => ({ label: p.name, value: p.id }))}
                            required
                        />
                        <Select
                            label="Sales Executive *"
                            value={formData.executiveId}
                            onChange={e => setFormData({ ...formData, executiveId: e.target.value })}
                            options={executives.map(e => ({ label: e.full_name, value: e.id }))}
                            required
                        />
                        <Input label="Plot No (Unit No) *" value={formData.unitNumber} onChange={e => setFormData({ ...formData, unitNumber: e.target.value })} required />
                        <Input label="Booking Date *" type="date" value={formData.bookingDate} onChange={e => setFormData({ ...formData, bookingDate: e.target.value })} required />
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg space-y-4 border border-gray-200 dark:border-white/10">
                    <h3 className="font-semibold text-[#0A1C37] dark:text-white flex items-center gap-2">
                        <DollarSign size={18} className="text-[#1673FF]" />
                        Pricing & Area
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Area (sq ft) *" type="number" step="0.01" value={formData.areaSqft} onChange={e => setFormData({ ...formData, areaSqft: e.target.value })} required />
                        <Input label="Base Price / sq ft *" type="number" value={formData.ratePerSqft} onChange={e => setFormData({ ...formData, ratePerSqft: e.target.value })} required />
                        <Input label="Discount" type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Dev Charges (+ Rate/sqft)" type="number" value={formData.devCharges} onChange={e => setFormData({ ...formData, devCharges: e.target.value })} />
                        <Input label="PLC (%)" type="number" value={formData.plc} onChange={e => setFormData({ ...formData, plc: e.target.value })} />
                        <Input label="Other Charges" type="number" value={formData.otherCharges} onChange={e => setFormData({ ...formData, otherCharges: e.target.value })} />
                    </div>

                    <div className="flex justify-between items-center bg-white dark:bg-black/20 p-3 rounded border border-gray-200 dark:border-white/10 mt-2">
                        <span className="text-gray-600 dark:text-gray-400 font-medium h-fit">Total Revenue Calculation:</span>
                        <span className="text-xl font-bold text-[#2BA67A] dark:text-[#00E576]">{formatCurrency(calculateTotal())}</span>
                    </div>
                </div>

                {/* Initial Payment Details (Restored) */}
                {!editingSale && (
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg space-y-4 border border-gray-200 dark:border-white/10">
                        <h3 className="font-semibold text-[#0A1C37] dark:text-white flex items-center gap-2">
                            <DollarSign size={18} className="text-[#1673FF]" />
                            Initial Payment Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                                label="Booking / Token Amount" 
                                type="number" 
                                value={formData.bookingAmount} 
                                onChange={e => setFormData({ ...formData, bookingAmount: e.target.value })} 
                                placeholder="Enter amount if received"
                            />
                             <Select
                                label="Payment Type"
                                value={formData.paymentType}
                                onChange={e => setFormData({ ...formData, paymentType: e.target.value })}
                                options={[
                                    { label: 'Booking Amount', value: 'booking' },
                                    { label: 'Token Amount', value: 'token' },
                                    { label: 'Advance', value: 'advance' },
                                ]}
                            />
                            <Select
                                label="Mode of Payment"
                                value={formData.paymentMode}
                                onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                                options={[
                                    { label: 'Cheque', value: 'cheque' },
                                    { label: 'Cash', value: 'cash' },
                                    { label: 'Account Transfer', value: 'account_transfer' },
                                    { label: 'UPI', value: 'upi' },
                                    { label: 'Demand Draft (DD)', value: 'dd' },
                                ]}
                            />
                            <Input 
                                label="Transaction Ref / Chq No" 
                                value={formData.transactionRef} 
                                onChange={e => setFormData({ ...formData, transactionRef: e.target.value })} 
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                )}

                {/* Legal Status */}
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg space-y-4 border border-gray-200 dark:border-white/10">
                    <h3 className="font-semibold text-[#0A1C37] dark:text-white flex items-center gap-2">
                        <FileText size={18} className="text-[#1673FF]" />
                        Legal Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Agreement Toggle */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[#1673FF] rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-black/20 focus:ring-[#1673FF]"
                                    checked={formData.isAgreementDone}
                                    onChange={e => setFormData({ ...formData, isAgreementDone: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Agreement Done?</span>
                            </label>
                            {formData.isAgreementDone && (
                                <Input label="Agreement Date" type="date" value={formData.agreementDate} onChange={e => setFormData({ ...formData, agreementDate: e.target.value })} required />
                            )}
                        </div>

                        {/* Registry Toggle */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[#1673FF] rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-black/20 focus:ring-[#1673FF]"
                                    checked={formData.isRegistryDone}
                                    onChange={e => setFormData({ ...formData, isRegistryDone: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Registry Done?</span>
                            </label>
                            {formData.isRegistryDone && (
                                <Input label="Registry Date" type="date" value={formData.registryDate} onChange={e => setFormData({ ...formData, registryDate: e.target.value })} required />
                            )}
                        </div>
                    </div>
                </div>

                <ModalFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={isSubmitting}>
                        {editingSale ? (
                            <>
                                <span className="hidden sm:inline">Update Record</span>
                                <span className="sm:hidden">Update</span>
                            </>
                        ) : (
                            <>
                                <span className="hidden sm:inline">Create Record</span>
                                <span className="sm:hidden">Create</span>
                            </>
                        )}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
