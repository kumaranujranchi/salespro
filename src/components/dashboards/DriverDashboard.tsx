import { useAuth } from '../../contexts/AuthContext';

export function DriverDashboard() {
    const { profile } = useAuth();
    return (
        <div className="space-y-8">
            {/* Welcome Section - Vibrant for Driver */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-700 to-slate-900 rounded-3xl p-8 shadow-2xl shadow-slate-300">
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
                                Driver, {profile?.full_name?.split(' ')[0]} 🚗
                            </h1>
                            <p className="text-slate-300 text-sm font-medium">
                                Ready for your next trip?
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100 ring-1 ring-slate-100/50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Trip Management System</h3>
                        <p className="mt-1 text-slate-500 text-sm">Features for trip logging, vehicle maintenance, and route optimization are coming soon.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
