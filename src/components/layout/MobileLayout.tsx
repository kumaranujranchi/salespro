import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileModal } from '../profile/ProfileModal';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
    LayoutDashboard,
    Users,
    Building,
    Briefcase,
    Megaphone,
    Target,
    Calendar,
    TrendingUp,
    Award,
    FileText,
    Contact,
    LogOut
} from 'lucide-react';

interface MobileLayoutProps {
    children: ReactNode;
}

const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Directory', path: '/directory', icon: Contact, roles: ['super_admin', 'admin', 'director', 'sales_executive', 'team_leader', 'crm_staff', 'receptionist'] },
    { label: 'Users', path: '/users', icon: Users, roles: ['super_admin', 'admin', 'director'] },
    { label: 'Depts', path: '/departments', icon: Briefcase, roles: ['super_admin', 'admin', 'director'] },
    { label: 'Projects', path: '/projects', icon: Building, roles: ['super_admin', 'admin', 'director'] },
    { label: 'News', path: '/announcements', icon: Megaphone, roles: ['super_admin', 'admin', 'director', 'sales_executive', 'team_leader', 'crm_staff', 'receptionist'] },
    { label: 'Targets', path: '/targets', icon: Target, roles: ['super_admin', 'admin', 'director'] },
    { label: 'Visits', path: '/site-visits', icon: Calendar, roles: ['super_admin', 'admin', 'director', 'sales_executive', 'team_leader', 'crm_staff', 'driver'] },
    { label: 'Sales', path: '/sales', icon: TrendingUp, roles: ['super_admin', 'admin', 'director', 'sales_executive', 'team_leader', 'crm_staff', 'accountant'] },
    { label: 'Incentives', path: '/incentives', icon: Award, roles: ['super_admin', 'admin', 'director', 'sales_executive', 'team_leader', 'accountant'] },
    { label: 'Reports', path: '/reports', icon: FileText, roles: ['super_admin', 'admin', 'director'] },
];

export function MobileLayout({ children }: MobileLayoutProps) {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const filteredNavItems = navItems.filter((item) => {
        if (!item.roles) return true;
        return item.roles.includes(profile?.role || '');
    });

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24 transition-colors duration-300">
            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                forceChange={profile?.force_password_change}
            />

            {/* Top Header */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 z-40 px-4 flex items-center justify-between pt-[env(safe-area-inset-top)]">
                <div className="flex items-center gap-2">
                    <img src="/pwa-icon.png" alt="Logo" className="w-8 h-8 rounded-lg" />
                    <span className="font-bold text-slate-800 dark:text-white text-lg">WishPro</span>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm ring-2 ring-white dark:ring-white/10 shadow-sm cursor-pointer" onClick={() => setIsProfileOpen(true)}>
                        {profile?.image_url ? (
                            <img src={profile.image_url} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            profile?.full_name?.charAt(0)
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="pt-[calc(4rem+env(safe-area-inset-top))] px-4 animate-fadeIn">
                {children}
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-white/10 z-50 pb-[env(safe-area-inset-bottom)]">
                <div className="flex overflow-x-auto no-scrollbar scroll-smooth py-2 px-2 gap-1 items-center md:justify-center">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center justify-center min-w-[4.5rem] py-2 rounded-xl transition-all ${isActive ? 'text-blue-600 dark:text-primary bg-blue-50 dark:bg-white/5' : 'text-slate-400 dark:text-text-muted hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-white'
                                    }`}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'mb-1' : 'mb-1 opacity-70'} />
                                <span className={`text-[10px] font-medium leading-none ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                    {item.label}
                                </span>
                            </button>
                        )
                    })}
                    <button
                        onClick={async () => { await signOut(); navigate('/login'); }}
                        className="flex flex-col items-center justify-center min-w-[4.5rem] py-2 rounded-xl text-slate-400 dark:text-text-muted hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
                    >
                        <LogOut size={20} className="mb-1 opacity-70" />
                        <span className="text-[10px] font-medium leading-none opacity-70">Sign Out</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
