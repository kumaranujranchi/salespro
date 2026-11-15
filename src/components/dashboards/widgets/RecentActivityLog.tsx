import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Activity } from 'lucide-react';

interface ActivityLogItem {
    id?: string;
    _id: string;
    action: string;
    entity_type: string;
    created_at: string;
    details: any;
    user_id: string | null;
    user?: { full_name: string };
}

interface RecentActivityLogProps {
    activities: ActivityLogItem[];
}

function renderActivityDetails(rawDetails: any) {
    if (!rawDetails) return null;

    let details = rawDetails;
    if (typeof details === 'string') {
        try {
            details = JSON.parse(details);
        } catch {
            return (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {details}
                </p>
            );
        }
    }

    if (typeof details !== 'object' || details === null) {
        return (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {String(details)}
            </p>
        );
    }

    // Filter out internal database IDs and UUIDs
    const hiddenKeys = new Set([
        'lead_id', 'tenant_id', 'user_id', 'entity_id', '_id', 'id', 
        'driver_id', 'created_by_profile_id', 'assigned_to_id', 'role_id',
        'department_id', 'token'
    ]);

    const items: { label: string; value: string; variant?: 'default' | 'success' | 'info' | 'warning' }[] = [];

    // Distance / Trip Kilometers
    if (details.distance_km !== undefined && details.distance_km !== null) {
        items.push({ 
            label: 'Distance', 
            value: `${details.distance_km} km`,
            variant: 'success'
        });
    }

    // Customer
    if (details.customer_name || details.customer) {
        items.push({ 
            label: 'Customer', 
            value: String(details.customer_name || details.customer),
            variant: 'info'
        });
    }

    // Pickup Location
    if (details.pickup_location) {
        items.push({ 
            label: 'Pickup', 
            value: String(details.pickup_location),
            variant: 'default'
        });
    }

    // End / Start Odometer
    if (details.end_odometer) {
        items.push({ 
            label: 'End Odo', 
            value: `${details.end_odometer} km`,
            variant: 'default'
        });
    }

    // Project Name
    if (details.project_name || details.project) {
        items.push({ 
            label: 'Project', 
            value: String(details.project_name || details.project),
            variant: 'info'
        });
    }

    // Unit / Property
    if (details.unit_number || details.unit) {
        items.push({ 
            label: 'Unit', 
            value: String(details.unit_number || details.unit),
            variant: 'default'
        });
    }

    // Amount / Deal Revenue
    if (details.amount !== undefined && details.amount !== null) {
        const num = Number(details.amount);
        items.push({ 
            label: 'Amount', 
            value: !isNaN(num) ? `₹${num.toLocaleString('en-IN')}` : String(details.amount),
            variant: 'success'
        });
    }

    // Status
    if (details.status) {
        items.push({ 
            label: 'Status', 
            value: String(details.status).replace(/_/g, ' '),
            variant: 'warning'
        });
    }

    const noteText = details.note || details.message || details.comment || details.description;

    const handledKeys = new Set([
        'distance_km', 'customer_name', 'customer', 'pickup_location',
        'start_odometer', 'end_odometer', 'project_name', 'project',
        'unit_number', 'unit', 'amount', 'status', 'note', 'message',
        'comment', 'description'
    ]);

    Object.entries(details).forEach(([key, val]) => {
        if (!hiddenKeys.has(key) && !handledKeys.has(key) && val !== null && val !== undefined && val !== '') {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            items.push({ label, value: String(val) });
        }
    });

    if (items.length === 0 && !noteText) {
        return null;
    }

    return (
        <div className="mt-1.5 space-y-1">
            {items.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {items.map((item, idx) => (
                        <span 
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${
                                item.variant === 'success'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40'
                                    : item.variant === 'info'
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40'
                                    : item.variant === 'warning'
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40'
                                    : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5'
                            }`}
                        >
                            <span className="opacity-70 font-normal">{item.label}:</span>
                            <span>{item.value}</span>
                        </span>
                    ))}
                </div>
            )}
            {noteText && (
                <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5">
                    "{String(noteText)}"
                </p>
            )}
        </div>
    );
}

export function RecentActivityLog({ activities }: RecentActivityLogProps) {
    return (
        <Card className="h-full rounded-3xl border-0 shadow-[0_2px_20px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 overflow-hidden dark:bg-surface-dark">
            <CardHeader className="border-b border-slate-100 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50/50 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 ring-1 ring-blue-100/50 dark:ring-blue-500/30">
                        <Activity size={20} />
                    </div>
                    <CardTitle className="text-slate-800 dark:text-white text-base">Recent Activity</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-3">
                <div className="relative space-y-0 pl-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {activities.length === 0 ? (
                        <p className="text-center text-slate-400 dark:text-gray-500 py-6 text-xs">No recent activity</p>
                    ) : (
                        <div className="relative border-l border-slate-200 dark:border-white/10 ml-2 space-y-4 py-1.5">
                            {activities.map((log) => (
                                <div key={log._id || log.id} className="relative pl-6 group">
                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-gray-600 ring-2 ring-white dark:ring-surface-dark group-hover:bg-blue-500 transition-colors"></div>
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-xs font-medium text-slate-700 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{log.user?.full_name || 'System'}</span> {log.action.replace(/_/g, ' ').toLowerCase()}
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">
                                            {new Date(log.created_at).toLocaleString()}
                                        </p>
                                        {renderActivityDetails(log.details)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
