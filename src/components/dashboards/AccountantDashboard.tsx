import { useAuth } from '../../contexts/AuthContext';
import { UpcomingEvents } from './widgets/UpcomingEvents';

export function AccountantDashboard() {
    const { profile } = useAuth();
    return (
        <div className="space-y-8">
            {/* Welcome Section - Vibrant for Accountant */}
            <div className="relative overflow-hidden bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-teal-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-white">
                    <div className="flex items-center gap-5">
                        <div className="p-1 bg-white/20 rounded-2xl backdrop-blur-sm">
                            {profile?.image_url ? (
                                <img src={profile.image_url} alt={profile.full_name || 'User'} className="w-16 h-16 rounded-xl object-cover border-2 border-white/50" />
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-bold border-2 border-white/50">
                                    {profile?.full_name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-xl md:text-3xl font-bold tracking-tight">
                                Accountant, {profile?.full_name?.split(' ')[0]} 📊
                            </h1>
                            <p className="text-teal-100 text-sm font-medium">
                                Manage financials and payments seamlessly.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100 h-fit ring-1 ring-slate-100/50">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Accounting Module</h3>
                            <p className="mt-2 text-slate-600 leading-relaxed">
                                This module is currently being enhanced to support advanced invoicing, tax handling, and payroll management.
                            </p>
                            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-semibold">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                                </span>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <UpcomingEvents />
                </div>
            </div>
        </div>
    );
}
