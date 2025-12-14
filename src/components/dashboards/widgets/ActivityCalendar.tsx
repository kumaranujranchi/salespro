import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityLogItem {
    id: string;
    action: string;
    created_at: string;
    user?: { full_name: string };
}

interface ActivityCalendarProps {
    activities: ActivityLogItem[];
}

const ACTIVITY_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    'SALE_CREATED': { label: 'Sales Add', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    'SALE_DELETED': { label: 'Sales Delete', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
    'USER_CREATED': { label: 'User Add', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
    'PASSWORD_RESET': { label: 'Password Reset', color: 'text-orange-700', bg: 'bg-orange-50', dot: 'bg-orange-500' },
    'SALE_CANCELLED': { label: 'Sales Cancelled', color: 'text-rose-700', bg: 'bg-rose-50', dot: 'bg-rose-500' },
    'PROJECT_CREATED': { label: 'Project Add', color: 'text-violet-700', bg: 'bg-violet-50', dot: 'bg-violet-500' },
    'PROJECT_DELETED': { label: 'Project Delete', color: 'text-pink-700', bg: 'bg-pink-50', dot: 'bg-pink-500' },
    'ANNOUNCEMENT_PUBLISHED': { label: 'Announcement', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
    'ANNOUNCEMENT_CREATED': { label: 'Announcement', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
};

export function ActivityCalendar({ activities }: ActivityCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getDayActivities = (day: number) => {
        return activities.filter(a => {
            const d = new Date(a.created_at);
            return d.getDate() === day &&
                d.getMonth() === currentDate.getMonth() &&
                d.getFullYear() === currentDate.getFullYear();
        });
    };

    const getActivityStyle = (action: string) => {
        if (!action) return { label: 'Unknown', color: 'text-slate-400', bg: 'bg-slate-50', dot: 'bg-slate-300' };
        const normalizedAction = action.toUpperCase();
        return ACTIVITY_CONFIG[normalizedAction] || {
            // Default styling for unknown actions
            label: action.split('_').join(' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            color: 'text-slate-600',
            bg: 'bg-slate-50',
            dot: 'bg-slate-400'
        };
    };

    return (
        <Card className="h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark dark:shadow-none">
            <CardHeader className="border-b border-slate-100/50 dark:border-white/10 pb-4 bg-white dark:bg-surface-dark z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-500/30">
                            <CalendarIcon size={20} />
                        </div>
                        <CardTitle className="text-base font-bold text-slate-800 dark:text-white">
                            Activity Calendar <span className="text-slate-400 dark:text-gray-500 font-normal text-xs ml-1">({activities.length})</span>
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-white/5 p-1 rounded-lg">
                        <Button variant="ghost" size="sm" onClick={prevMonth} className="h-7 w-7 p-0 hover:bg-white dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm rounded-md"><ChevronLeft size={14} /></Button>
                        <span className="text-sm font-semibold min-w-[140px] text-center text-slate-700 dark:text-gray-200">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <Button variant="ghost" size="sm" onClick={nextMonth} className="h-7 w-7 p-0 hover:bg-white dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm rounded-md"><ChevronRight size={14} /></Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-4 lg:p-6 bg-white dark:bg-surface-dark overflow-y-auto custom-scrollbar">
                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="relative">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={currentDate.toISOString()}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-7 gap-2 lg:gap-3"
                        >
                            {/* Empty slots */}
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square"></div>
                            ))}

                            {/* Days */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dayActivities = getDayActivities(day);
                                const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                                const hasActivity = dayActivities.length > 0;

                                return (
                                    <motion.div
                                        whileHover={{ scale: 1.05, zIndex: 10 }}
                                        key={day}
                                        className={`
                                            aspect-square rounded-xl border flex flex-col items-center justify-start pt-2 relative overflow-hidden group cursor-default transition-all duration-200
                                            ${isToday ? 'border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-100 dark:ring-indigo-500/30' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md'}
                                        `}
                                    >
                                        <span className={`
                                            text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full z-10 mb-1 transition-colors
                                            ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}
                                        `}>
                                            {day}
                                        </span>

                                        {/* Activity Dots / Indicators */}
                                        <div className="flex flex-wrap justify-center gap-0.5 px-1 w-full max-h-[50%] overflow-hidden">
                                            {dayActivities.slice(0, 5).map((act, idx) => {
                                                const style = getActivityStyle(act.action);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                                                    />
                                                );
                                            })}
                                            {dayActivities.length > 5 && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-gray-600" />
                                            )}
                                        </div>

                                        {/* Tooltip on Hover */}
                                        {hasActivity && (
                                            <div className="absolute inset-0 bg-white/95 dark:bg-surface-dark/95 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col gap-1.5 overflow-y-auto z-20 backdrop-blur-sm rounded-xl">
                                                <div className="text-[10px] font-bold text-slate-500 dark:text-gray-400 text-center sticky top-0 bg-white/95 dark:bg-surface-dark/95 pb-1 border-b border-slate-100 dark:border-white/10 shrink-0">
                                                    {dayActivities.length} Events
                                                </div>
                                                <div className="space-y-1">
                                                    {dayActivities.map((act, ax) => {
                                                        const style = getActivityStyle(act.action);
                                                        return (
                                                            <div key={ax} className={`text-[9px] font-medium px-1.5 py-0.5 rounded border border-transparent ${style.bg} dark:bg-white/10 ${style.color} dark:text-white whitespace-nowrap overflow-hidden text-ellipsis`}>
                                                                {style.label}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
