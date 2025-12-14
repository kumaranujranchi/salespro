import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SiteVisit } from '../../types/database';
import { Plus, MapPin, Calendar, CheckSquare, XSquare, Clock } from 'lucide-react';

export function SiteVisitManager() {
    const { profile } = useAuth();
    const dialog = useDialog();
    const [visits, setVisits] = useState<SiteVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [pickupLocation, setPickupLocation] = useState('');
    const [visitDate, setVisitDate] = useState('');
    const [visitTime, setVisitTime] = useState('');

    useEffect(() => {
        loadVisits();
    }, [profile]);

    const loadVisits = async () => {
        if (!profile?.id) return;
        try {
            const { data, error } = await supabase
                .from('site_visits')
                .select('*')
                .eq('requested_by', profile.id)
                .order('visit_date', { ascending: false });

            if (error) throw error;
            setVisits(data || []);
        } catch (error) {
            console.error('Error loading visits:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.id) return;

        try {
            const { error } = await supabase.from('site_visits').insert({
                requested_by: profile.id,
                customer_name: customerName,
                customer_phone: customerPhone,
                pickup_location: pickupLocation,
                visit_date: visitDate,
                visit_time: visitTime,
                project_ids: [], // Simplified for demo
                status: 'pending',
                is_public: false
            });

            if (error) throw error;
            setShowForm(false);
            resetForm();
            loadVisits();
            await dialog.alert('Site visit request submitted successfully!', { variant: 'success', title: 'Success' });
        } catch (error) {
            console.error('Error submitting request:', error);
            await dialog.alert('Failed to submit request.', { variant: 'danger', title: 'Error' });
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
            completed: CheckSquare, // Or another done icon
            cancelled: XSquare
        };
        const Icon = icons[status as keyof typeof icons] || Clock;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium capitalize ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
                <Icon size={14} /> {status}
            </span>
        );
    };

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
                {visits.map((visit) => (
                    <div key={visit.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                                <p className="font-mono text-sm text-gray-600">{visit.id.slice(0, 8)}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {!loading && visits.length === 0 && (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl">No site visits found. Create one to get started.</div>
                )}
            </div>
        </div>
    );
}
