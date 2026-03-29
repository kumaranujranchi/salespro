import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, MapPin, Calendar, CheckSquare, XSquare, Clock } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function SiteVisitManager() {
    const { profile } = useAuth();
    const dialog = useDialog();
    const tenantId = profile?.tenant_id as Id<"tenants">;
    const userId = profile?._id as Id<"profiles">;

    // Convex Queries
    const visits = useQuery(api.site_visits.listSiteVisits, 
        tenantId && profile ? { 
            tenant_id: tenantId, 
            role: profile.role, 
            userId: userId 
        } : "skip"
    );

    // Convex Mutations
    const createSiteVisit = useMutation(api.site_visits.createSiteVisit);

    const [showForm, setShowForm] = useState(false);

    // Form State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [pickupLocation, setPickupLocation] = useState('');
    const [visitDate, setVisitDate] = useState('');
    const [visitTime, setVisitTime] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?._id) return;

        try {
            await createSiteVisit({
                tenant_id: tenantId,
                requested_by: userId,
                customer_name: customerName,
                mobile: customerPhone,
                pickup_location: pickupLocation,
                visit_date: visitDate,
                visit_time: visitTime,
                status: 'pending',
                notes: ''
            });

            setShowForm(false);
            resetForm();
            await dialog.alert('Site visit request submitted successfully!', { variant: 'success', title: 'Success' });
        } catch (error: any) {
            console.error('Error submitting request:', error);
            await dialog.alert(error.message || 'Failed to submit request.', { variant: 'danger', title: 'Error' });
        }
    };

    const resetForm = () => {
        setCustomerName('');
        setCustomerPhone('');
        setPickupLocation('');
        setVisitDate('');
        setVisitTime('');
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            completed: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        const icons = {
            pending: Clock,
            approved: CheckSquare,
            completed: CheckSquare,
            cancelled: XSquare
        };
        const Icon = icons[status as keyof typeof icons] || Clock;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium capitalize ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
                <Icon size={14} /> {status}
            </span>
        );
    };

    if (visits === undefined) return <LoadingSpinner fullScreen />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#0A1C37]">Site Visit Management</h2>
                <Button onClick={() => setShowForm(!showForm)} variant="primary">
                    {showForm ? 'Cancel Request' : <><Plus size={18} className="mr-2" /> New Visit Request</>}
                </Button>
            </div>

            {showForm && (
                <Card className="animate-fadeIn">
                    <CardHeader><CardTitle>Create New Request</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                            <Input label="Customer Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
                            <Input label="Pickup Location" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} required />
                            <div className="grid grid-cols-2 gap-4">
                                <Input type="date" label="Date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required />
                                <Input type="time" label="Time" value={visitTime} onChange={e => setVisitTime(e.target.value)} required />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <Button type="submit">Submit Request</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Visits List */}
            <div className="grid grid-cols-1 gap-4">
                {visits.map((visit: any) => (
                    <div key={visit._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-[#0A1C37]">{visit.customer_name}</h3>
                                <StatusBadge status={visit.status} />
                            </div>
                            <p className="text-gray-500 text-sm flex items-center gap-2"><MapPin size={14} /> {visit.pickup_location || 'No pickup'}</p>
                            <p className="text-gray-500 text-sm flex items-center gap-2"><Calendar size={14} /> {new Date(visit.visit_date).toLocaleDateString()} at {visit.visit_time}</p>
                        </div>
                        <div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Request ID</p>
                                <p className="font-mono text-sm text-gray-600">{visit._id.slice(0, 8)}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {visits.length === 0 && (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl">No site visits found. Create one to get started.</div>
                )}
            </div>
        </div>
    );
}
