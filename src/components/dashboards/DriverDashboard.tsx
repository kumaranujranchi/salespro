import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { DriverTripModal } from '../site-visits/DriverTripModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MapPin, Clock, Calendar, Car, Navigation, CheckCircle2 } from 'lucide-react';

export function DriverDashboard() {
    const { profile } = useAuth();
    const tenantId = profile?.tenant_id as Id<"tenants">;
    const userId = profile?._id as Id<"profiles">;
    const userRole = profile?.role || "driver";

    const [selectedVisit, setSelectedVisit] = useState<Doc<"site_visits"> | null>(null);
    const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

    // Convex Query
    const visitsData = useQuery(api.site_visits.listSiteVisits, 
        tenantId ? { tenant_id: tenantId, userId: userId, role: userRole } : "skip"
    );

    const loading = !visitsData;
    const visits = (visitsData || []) as any[];

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'approved': return 'info'; // Ready to start
            case 'trip_started': return 'warning'; // In progress
            case 'completed': return 'success';
            default: return 'default';
        }
    };

    // Group visits by Date
    const groupedVisits = useMemo(() => {
        return visits.reduce((acc: Record<string, any[]>, visit: any) => {
            const date = new Date(visit.visit_date).toDateString();
            if (!acc[date]) acc[date] = [];
            acc[date].push(visit);
            return acc;
        }, {});
    }, [visits]);

    // Sort dates
    const sortedDates = useMemo(() => {
        return Object.keys(groupedVisits).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, [groupedVisits]);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Welcome Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-white">
                    <div className="flex items-center gap-5">
                        <div className="p-1 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                            {profile?.image_url ? (
                                <img src={profile.image_url} alt={profile.full_name} className="w-14 h-14 rounded-xl object-cover" />
                            ) : (
                                <div className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center text-xl font-bold">
                                    {profile?.full_name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Hello, {profile?.full_name?.split(' ')[0]} 👋
                            </h1>
                            <p className="text-slate-400 text-sm font-medium mt-1">
                                You have {visits.filter(v => v.status === 'approved' || v.status === 'trip_started').length} active tasks
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : visits.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center shadow-sm border border-slate-100 dark:border-slate-700">
                    <Car className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No trips assigned yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">When trips are assigned to you, they will appear here.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {sortedDates.map(date => (
                        <div key={date} className="space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-lg text-slate-700 dark:text-slate-200 sticky top-[72px] bg-slate-50 dark:bg-[#0f172a] py-2 z-10">
                                <Calendar className="text-blue-500" size={20} />
                                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupedVisits[date].map((visit: any) => {
                                    const isStarted = visit.status === 'trip_started';
                                    const isApproved = visit.status === 'approved';
                                    const isCompleted = visit.status === 'completed';

                                    return (
                                        <div 
                                            key={visit._id} 
                                            className={`
                                                relative bg-white dark:bg-slate-800 rounded-2xl p-5 border transition-all duration-300
                                                ${isStarted ? 'border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 ring-1 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'}
                                                ${isCompleted ? 'opacity-75 bg-slate-50 dark:bg-slate-800/50' : ''}
                                            `}
                                        >
                                            {/* Status Badge */}
                                            <div className="absolute top-4 right-4">
                                                <Badge variant={getStatusVariant(visit.status)}>
                                                    {visit.status === 'trip_started' ? 'On Trip' : visit.status.replace('_', ' ')}
                                                </Badge>
                                            </div>

                                            <div className="mb-4">
                                                <h4 className="font-bold text-slate-800 dark:text-white text-lg truncate pr-20">
                                                    {visit.pickup_location || 'Unknown Location'}
                                                </h4>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
                                                    <Clock size={14} />
                                                    {visit.visit_time}
                                                </p>
                                            </div>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                                                    <div className="mt-1 min-w-[16px]"><MapPin size={16} className="text-slate-400" /></div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Customer</p>
                                                        <p className="font-medium text-slate-700 dark:text-slate-200">{visit.customer_name}</p>
                                                        <a href={`tel:${visit.customer_phone}`} className="text-blue-600 dark:text-blue-400 text-sm hover:underline">{visit.mobile}</a>
                                                    </div>
                                                </div>
                                                
                                                {isCompleted && (
                                                   <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-2">
                                                       <span>Distance: {(Number(visit.end_odometer) - Number(visit.start_odometer)).toFixed(1)} km</span>
                                                       <CheckCircle2 size={14} className="text-green-500" />
                                                   </div> 
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {(isApproved || isStarted) && (
                                                <Button 
                                                    className="w-full"
                                                    variant={isStarted ? "danger" : "primary"}
                                                    onClick={() => { setSelectedVisit(visit); setIsDriverModalOpen(true); }}
                                                >
                                                    {isStarted ? (
                                                        <>
                                                            <CheckCircle2 className="mr-2" size={18} />
                                                            End Trip (Complete)
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Navigation className="mr-2" size={18} />
                                                            Start Trip
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <DriverTripModal
                isOpen={isDriverModalOpen}
                onClose={() => setIsDriverModalOpen(false)}
                onSuccess={() => {}}
                visit={selectedVisit as any}
            />
        </div>
    );
}
