import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Gift, Heart, Briefcase } from 'lucide-react'; // Icons
import { format, parseISO, getYear, setYear, differenceInDays, isValid, addYears, startOfDay } from 'date-fns';
import { Profile } from '../../types/database';

interface CelebrationEvent {
    id: string;
    profileName: string;
    profileImage: string | null;
    date: Date;
    daysUntil: number;
    details?: string;
}

export function CelebrationCards() {
    const [birthdays, setBirthdays] = useState<CelebrationEvent[]>([]);
    const [anniversaries, setAnniversaries] = useState<CelebrationEvent[]>([]);
    const [workAnniversaries, setWorkAnniversaries] = useState<CelebrationEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCelebrations();
    }, []);

    const loadCelebrations = async () => {
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, full_name, image_url, dob, marriage_anniversary, joining_date')
                .eq('is_active', true);

            if (error) throw error;

            if (profiles) {
                processCelebrations(profiles);
            }
        } catch (err) {
            console.error('Error loading celebrations:', err);
        } finally {
            setLoading(false);
        }
    };

    const processCelebrations = (profiles: Partial<Profile>[]) => {
        const today = startOfDay(new Date());
        const bdays: CelebrationEvent[] = [];
        const annivs: CelebrationEvent[] = [];
        const works: CelebrationEvent[] = [];

        profiles.forEach((profile) => {
            const { id, full_name, image_url, dob, marriage_anniversary, joining_date } = profile;
            if (!full_name || !id) return;

            // Birthday
            if (dob) {
                const nextDate = getNextOccurrence(dob, today);
                bdays.push({
                    id: `${id}-dob`,
                    profileName: full_name,
                    profileImage: image_url || null,
                    date: nextDate,
                    daysUntil: differenceInDays(nextDate, today)
                });
            }

            // Marriage Anniversary
            if (marriage_anniversary) {
                const nextDate = getNextOccurrence(marriage_anniversary, today);
                annivs.push({
                    id: `${id}-marriage`,
                    profileName: full_name,
                    profileImage: image_url || null,
                    date: nextDate,
                    daysUntil: differenceInDays(nextDate, today)
                });
            }

            // Work Anniversary
            if (joining_date) {
                const nextDate = getNextOccurrence(joining_date, today);
                const joinYear = getYear(parseISO(joining_date));
                const anniversaryYear = getYear(nextDate);
                const yearsCompleted = anniversaryYear - joinYear;

                // Only count if at least 1 year completed
                if (yearsCompleted > 0) {
                    works.push({
                        id: `${id}-work`,
                        profileName: full_name,
                        profileImage: image_url || null,
                        date: nextDate,
                        daysUntil: differenceInDays(nextDate, today),
                        details: `${yearsCompleted} Year${yearsCompleted > 1 ? 's' : ''}`
                    });
                }
            }
        });

        // Sort by nearest date and take top 5
        setBirthdays(bdays.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5));
        setAnniversaries(annivs.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5));
        setWorkAnniversaries(works.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5));
    };

    const getNextOccurrence = (dateStr: string, today: Date): Date => {
        let date = parseISO(dateStr);
        if (!isValid(date)) return date; // Should handle invalid dates gracefully

        const currentYear = getYear(today);
        date = setYear(date, currentYear);

        // If date has passed this year, move to next year
        if (differenceInDays(date, today) < 0) {
            date = addYears(date, 1);
        }
        return date;
    };

    const EventList = ({ events, emptyText }: { events: CelebrationEvent[], emptyText: string }) => (
        <div className="space-y-4">
            {events.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm py-4 text-center">{emptyText}</p>
            ) : (
                events.map(event => (
                    <div key={event.id} className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-2 rounded-xl">
                        {event.profileImage ? (
                            <img src={event.profileImage} alt={event.profileName} className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-surface-dark" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-gray-400 font-bold border border-slate-100 dark:border-white/5 shadow-sm">
                                {event.profileName.charAt(0)}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{event.profileName}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">{event.details || format(event.date, 'MMMM d, yyyy')}</p>
                        </div>
                        <div className="text-right">
                            {event.daysUntil === 0 ? (
                                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20 px-2 py-1 rounded-full">Today</span>
                            ) : (
                                <span className="text-[10px] font-medium text-slate-400 dark:text-gray-400 bg-white dark:bg-white/5 px-2 py-1 rounded-full border border-slate-100 dark:border-white/10">
                                    {event.daysUntil} days
                                </span>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    if (loading) return <div>Loading celebrations...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-3xl border-0 shadow-[0_2px_20px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark overflow-hidden">
                <CardHeader className="bg-white dark:bg-surface-dark border-b border-slate-50 dark:border-white/10 pb-4">
                    <CardTitle className="flex items-center gap-2 text-base text-pink-600 dark:text-pink-400">
                        <Gift size={20} /> Upcoming Birthdays
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] overflow-y-auto custom-scrollbar pt-4">
                    <EventList events={birthdays} emptyText="No upcoming birthdays" />
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-[0_2px_20px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark overflow-hidden">
                <CardHeader className="bg-white dark:bg-surface-dark border-b border-slate-50 dark:border-white/10 pb-4">
                    <CardTitle className="flex items-center gap-2 text-base text-rose-600 dark:text-rose-400">
                        <Heart size={20} /> Upcoming Anniversaries
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] overflow-y-auto custom-scrollbar pt-4">
                    <EventList events={anniversaries} emptyText="No upcoming marriage anniversaries" />
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-[0_2px_20px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 dark:ring-white/10 dark:bg-surface-dark overflow-hidden">
                <CardHeader className="bg-white dark:bg-surface-dark border-b border-slate-50 dark:border-white/10 pb-4">
                    <CardTitle className="flex items-center gap-2 text-base text-indigo-600 dark:text-indigo-400">
                        <Briefcase size={20} /> Work Anniversaries
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] overflow-y-auto custom-scrollbar pt-4">
                    <EventList events={workAnniversaries} emptyText="No upcoming work anniversaries" />
                </CardContent>
            </Card>
        </div>
    );
}
