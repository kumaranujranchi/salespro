import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Activity } from 'lucide-react';

interface ActivityLogItem {
    id: string;
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
            <CardContent className="pt-4">
                <div className="relative space-y-0 pl-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {activities.length === 0 ? (
                        <p className="text-center text-slate-400 dark:text-gray-500 py-8 text-sm">No recent activity</p>
                    ) : (
                        <div className="relative border-l border-slate-200 dark:border-white/10 ml-2 space-y-6 py-2">
                            {activities.map((log) => (
                                <div key={log.id} className="relative pl-6 group">
                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-gray-600 ring-2 ring-white dark:ring-surface-dark group-hover:bg-blue-500 transition-colors"></div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium text-slate-700 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{log.user?.full_name || 'System'}</span> {log.action.replace('_', ' ').toLowerCase()}
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-gray-500 font-medium">
                                            {new Date(log.created_at).toLocaleString()}
                                        </p>
                                        {log.details && (
                                            <div className="mt-1 p-2 bg-slate-50 dark:bg-white/5 rounded-lg text-xs text-slate-500 dark:text-gray-400 border border-slate-100/50 dark:border-white/5">
                                                <code className="break-all font-mono">{JSON.stringify(log.details).slice(0, 100)}...</code>
                                            </div>
                                        )}
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
