import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileModal } from '../profile/ProfileModal';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LogOut } from 'lucide-react';

interface NavItem {
    label: string;
    path: string;
    icon: any;
    roles?: string[];
}

interface MobileLayoutProps {
    children: ReactNode;
    navItems: NavItem[];
    activeModule: 'sales' | 'crm';
    onModuleChange: (isCRM: boolean) => void;
    hasCRMAccess: boolean;
}

export function MobileLayout({ children, navItems, activeModule, onModuleChange, hasCRMAccess }: MobileLayoutProps) {
    const { profile, tenant, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const filteredNavItems = navItems.filter((item) => {
        const roleAccess = !item.roles || item.roles.includes(profile?.role || '');
        if (!roleAccess) return false;

        // Feature Flag System
        const features = tenant?.settings?.features;
        if (features) {
            if (item.path === '/leads' || item.path === '/crm' || item.path === '/crm/pipeline') {
                return features.crm !== false;
            }
            if (item.path === '/projects') return features.inventory !== false;
            if (item.path === '/reports') return features.reports !== false;
            if (item.path === '/site-visits') return features.site_visits !== false;
            if (item.path === '/incentives') return features.incentives !== false;
        }

        return true;
    });

    // Determine if menu is crowded (more than 4 items + Sign Out = 5)
    // If crowded, enable horizontal scrolling instead of squeezing
    const isCrowded = filteredNavItems.length + 1 > 5;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24 transition-colors duration-300">
            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                forceChange={profile?.force_password_change}
            />

            {/* Top Header */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 z-40 px-4 flex items-center justify-between pt-[env(safe-area-inset-top)]">
                <div className="flex items-center gap-2 shrink-0">
                    <img src="/images/RealSalePro_DarkLogo.png" alt="RealSalePro" className="w-12 h-12 rounded-lg object-contain dark:hidden" />
                    <img src="/images/RealSalePro_LighLogo.png" alt="RealSalePro" className="w-12 h-12 rounded-lg object-contain hidden dark:block" />
                </div>

                {/* Module Toggle - Centered/Flexible */}
                {hasCRMAccess && (
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
                        <button
                            onClick={() => onModuleChange(true)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeModule === 'crm'
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            CRM
                        </button>
                        <button
                            onClick={() => onModuleChange(false)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeModule === 'sales'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            Sales
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3 shrink-0">
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
                <div className={`flex w-full py-2 items-center ${isCrowded ? 'overflow-x-auto justify-start px-4 gap-3' : 'justify-between px-2 gap-1'}`}>
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`${isCrowded ? 'flex-none min-w-[64px]' : 'flex-1'} flex flex-col items-center justify-center py-2 rounded-xl transition-all ${isActive ? 'text-blue-600 dark:text-primary bg-blue-50 dark:bg-white/5' : 'text-slate-400 dark:text-text-muted hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-white'
                                    }`}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'mb-1' : 'mb-1 opacity-70'} />
                                <span className={`text-[10px] font-medium leading-none whitespace-nowrap ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                    {item.label}
                                </span>
                            </button>
                        )
                    })}
                    <button
                        onClick={async () => { await signOut(); navigate('/login'); }}
                        className={`${isCrowded ? 'flex-none min-w-[64px]' : 'flex-1'} flex flex-col items-center justify-center py-2 rounded-xl text-slate-400 dark:text-text-muted hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all`}
                    >
                        <LogOut size={20} className="mb-1 opacity-70" />
                        <span className="text-[10px] font-medium leading-none opacity-70 whitespace-nowrap">Sign Out</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
