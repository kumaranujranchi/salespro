import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Calendar, Gift, Heart, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import {
    format, addYears, differenceInDays,
    parseISO, setYear, startOfDay, getYear, isValid
} from 'date-fns';
import { Profile } from '../../../types/database';

interface EventItem {
    id: string;
    type: 'birthday' | 'anniversary' | 'work_anniversary';
    date: Date;
    daysUntil: number;
    profileName: string;
    profileImage: string | null;
    details?: string; // e.g., "5 years"
}

export function UpcomingEvents() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, full_name, image_url, dob, marriage_anniversary, joining_date')
                .eq('is_active', true);

            if (error) throw error;

            if (profiles) {
                const processedEvents = processEvents(profiles);
                setEvents(processedEvents);
            }
        } catch (err) {
            console.error('Error loading events:', err);
        } finally {
            setLoading(false);
        }
    };

    const processEvents = (profiles: Partial<Profile>[]): EventItem[] => {
        const today = startOfDay(new Date());
        const eventList: EventItem[] = [];

        profiles.forEach((profile) => {
            const { id, full_name, image_url, dob, marriage_anniversary, joining_date } = profile;
            if (!full_name || !id) return;

            // 1. Birthday
            if (dob) {
                const nextDate = getNextOccurrence(dob, today);
                const days = differenceInDays(nextDate, today);
                if (days >= 0 && days <= 30) {
                    eventList.push({
                        id: `${id}-dob`,
                        type: 'birthday',
                        date: nextDate,
                        daysUntil: days,
                        profileName: full_name,
                        profileImage: image_url || null,
                    });
                }
            }

            // 2. Marriage Anniversary
            if (marriage_anniversary) {
                const nextDate = getNextOccurrence(marriage_anniversary, today);
                const days = differenceInDays(nextDate, today);
                if (days >= 0 && days <= 30) {
                    eventList.push({
                        id: `${id}-marriage`,
                        type: 'anniversary',
                        date: nextDate,
                        daysUntil: days,
                        profileName: full_name,
                        profileImage: image_url || null,
                    });
                }
            }

            // 3. Work Anniversary
            if (joining_date) {
                const nextDate = getNextOccurrence(joining_date, today);
                const days = differenceInDays(nextDate, today);
                if (days >= 0 && days <= 30) {
                    const joinYear = getYear(parseISO(joining_date));
                    const anniversaryYear = getYear(nextDate);
                    const yearsCompleted = anniversaryYear - joinYear;

                    if (yearsCompleted > 0) {
                        eventList.push({
                            id: `${id}-work`,
                            type: 'work_anniversary',
                            date: nextDate,
                            daysUntil: days,
                            profileName: full_name,
                            profileImage: image_url || null,
                            details: `${yearsCompleted} Year${yearsCompleted > 1 ? 's' : ''}`
                        });
                    }
                }
            }
        });

        return eventList.sort((a, b) => a.daysUntil - b.daysUntil);
    };

    const getNextOccurrence = (dateStr: string, today: Date): Date => {
        let date = parseISO(dateStr);
        if (!isValid(date)) return date;

        const currentYear = getYear(today);
        date = setYear(date, currentYear);

        if (differenceInDays(date, today) < 0) {
            date = addYears(date, 1);
        }
        return date;
    };

    const displayedEvents = isExpanded ? events : events.slice(0, 5);

    if (loading) return <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />;
    if (events.length === 0) return null;

    return (
        <Card className="h-full bg-white/80 dark:bg-surface-dark backdrop-blur-sm border-0 shadow-[0_2px_20px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-surface-dark">
                <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100/50 dark:ring-indigo-500/30">
                            <Calendar size={18} />
                        </div>
                        <span className="text-slate-800 dark:text-white">Upcoming Celebrations</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-full uppercase tracking-wider">
                        Next 30 Days
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 max-h-[320px] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                    {displayedEvents.map((event) => (
                        <div key={event.id} className="flex items-center gap-3 group p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-default">
                            {/* Avatar */}
                            <div className="relative">
                                {event.profileImage ? (
                                    <img src={event.profileImage} alt={event.profileName} className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-surface-dark shadow-sm" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center ring-2 ring-white dark:ring-surface-dark shadow-sm">
                                        <span className="text-xs font-bold text-slate-500 dark:text-gray-300">{event.profileName.charAt(0)}</span>
                                    </div>
                                )}
                                {/* Event Type Icon Badge */}
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-surface-dark shadow-sm ${event.type === 'birthday' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-400' :
                                    event.type === 'anniversary' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400' :
                                        'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                                    }`}>
                                    {event.type === 'birthday' && <Gift size={10} />}
                                    {event.type === 'anniversary' && <Heart size={10} />}
                                    {event.type === 'work_anniversary' && <Briefcase size={10} />}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{event.profileName}</p>
                                <p className="text-xs text-slate-500 dark:text-gray-500 flex items-center gap-1 font-medium">
                                    {event.type === 'birthday' && 'Birthday'}
                                    {event.type === 'anniversary' && 'Anniversary'}
                                    {event.type === 'work_anniversary' && `Work Anniversary (${event.details})`}
                                </p>
                            </div>

                            {/* Date */}
                            <div className="text-right whitespace-nowrap">
                                {event.daysUntil === 0 ? (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full animate-pulse shadow-sm ring-1 ring-emerald-100 dark:ring-emerald-500/20">Today!</span>
                                ) : event.daysUntil === 1 ? (
                                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-full">Tomorrow</span>
                                ) : (
                                    <span className="text-xs font-semibold text-slate-400 dark:text-gray-500">{format(event.date, 'MMM d')}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {events.length > 5 && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full mt-4 py-2 flex items-center justify-center gap-1 text-xs font-medium text-slate-500 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-all"
                    >
                        {isExpanded ? (
                            <>Show Less <ChevronUp size={14} /></>
                        ) : (
                            <>View All ({events.length - 5} more) <ChevronDown size={14} /></>
                        )}
                    </button>
                )}
            </CardContent>
        </Card>
    );
}
