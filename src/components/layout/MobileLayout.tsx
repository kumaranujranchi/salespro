import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileModal } from '../profile/ProfileModal';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LogOut, Menu, X, ChevronRight } from 'lucide-react';

export interface NavItem {
    label: string;
    path: string;
    icon: any;
    roles?: string[];
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

interface MobileLayoutProps {
    children: ReactNode;
    navItems: NavItem[];
    navGroups?: NavGroup[];
    crmNavItems?: NavItem[];
    activeModule: 'sales' | 'crm';
    onModuleChange: (isCRM: boolean) => void;
    hasCRMAccess: boolean;
}

export function MobileLayout({
    children,
    navItems,
    navGroups,
    crmNavItems,
    activeModule,
    onModuleChange,
    hasCRMAccess
}: MobileLayoutProps) {
    const { profile, tenant, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Auto-close drawer on route change
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [location.pathname]);

    // Check accessibility based on role and feature flags
    const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
    const isAccessible = (item: NavItem) => {
        const normalizedRoles = item.roles?.map(r => r.toLowerCase().replace(/[\s_-]+/g, '_')) || [];
        const roleAccess = !item.roles || normalizedRoles.includes(normalizedRole);
        if (!roleAccess) return false;

        const features = tenant?.settings?.features;
        if (features) {
            if (item.path === '/leads' || item.path === '/crm' || item.path === '/crm/pipeline' || item.path === '/site-visits') {
                return features.crm !== false;
            }
            if (item.path === '/projects') return features.inventory !== false;
            if (item.path === '/reports') return features.reports !== false;
            if (item.path === '/incentives') return features.incentives !== false;
        }

        return true;
    };

    const allAccessibleItems = navItems.filter(isAccessible);

    // Primary 4 items for bottom navigation
    const primaryCrmPaths = ['/crm', '/leads', '/crm/pipeline', '/site-visits'];
    const primarySalesPaths = ['/dashboard', '/accounts', '/sales', '/reports'];

    const targetPrimaryPaths = activeModule === 'crm' ? primaryCrmPaths : primarySalesPaths;

    let bottomNavItems: NavItem[] = [];
    for (const path of targetPrimaryPaths) {
        const matched = allAccessibleItems.find(item => item.path === path);
        if (matched) bottomNavItems.push(matched);
    }

    // Fallback if role lacks some primary paths (fill up to 4 items from other accessible items)
    if (bottomNavItems.length < 4) {
        for (const item of allAccessibleItems) {
            if (!bottomNavItems.some(b => b.path === item.path)) {
                bottomNavItems.push(item);
                if (bottomNavItems.length === 4) break;
            }
        }
    } else if (bottomNavItems.length > 4) {
        bottomNavItems = bottomNavItems.slice(0, 4);
    }

    // Indicates if the current route is one of the secondary routes (not in the 4 primary tabs)
    const isSecondaryRouteActive = !bottomNavItems.some(item => location.pathname === item.path);

    // Build Drawer Groups
    let drawerGroups: NavGroup[] = [];
    if (activeModule === 'crm') {
        const crmItems = (crmNavItems && crmNavItems.length > 0 ? crmNavItems : navItems).filter(isAccessible);
        drawerGroups = [
            { label: 'CRM Modules', items: crmItems }
        ];
        if (navGroups) {
            const extraGroups = navGroups.filter(g => g.label === 'Operations' || g.label === 'Configuration');
            drawerGroups.push(...extraGroups);
        }
    } else {
        if (navGroups && navGroups.length > 0) {
            drawerGroups = navGroups;
        } else {
            drawerGroups = [
                { label: 'Primary Menus', items: bottomNavItems },
                { label: 'More Tools & Settings', items: allAccessibleItems.filter(item => !bottomNavItems.some(b => b.path === item.path)) }
            ];
        }
    }

    const getBottomLabel = (label: string) => {
        if (label === 'Accounts & Collections') return 'Accounts';
        if (label === 'Site Visits') return 'Visits';
        if (label === 'My Performance') return 'Performance';
        if (label === 'Platform Overview') return 'Overview';
        return label;
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24 transition-colors duration-300">
            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                forceChange={profile?.force_password_change}
            />

            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 z-30 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 pt-[env(safe-area-inset-top,0px)] shadow-sm">
                <div className="h-16 px-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                        {/* Hamburger Button */}
                        <button
                            type="button"
                            onClick={() => setIsDrawerOpen(true)}
                            className="p-2 -ml-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0"
                            aria-label="Open Navigation Menu"
                        >
                            <Menu size={22} />
                        </button>

                        {tenant?.settings?.appearance?.resolved_logo_url || tenant?.settings?.appearance?.logo_url ? (
                            <img src={tenant.settings.appearance.resolved_logo_url || tenant.settings.appearance.logo_url || undefined} alt={tenant.name} className="w-7 h-7 rounded-lg object-contain shrink-0" />
                        ) : (
                            <>
                                <img src="/images/RealSalePro_DarkLogo.png" alt="RealSalePro" className="w-7 h-7 rounded-lg object-contain dark:hidden shrink-0" />
                                <img src="/images/RealSalePro_LighLogo.png" alt="RealSalePro" className="w-7 h-7 rounded-lg object-contain hidden dark:block shrink-0" />
                            </>
                        )}
                        {tenant?.name && (
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase truncate max-w-[70px] sm:max-w-[120px]">
                                {tenant.name}
                            </span>
                        )}
                    </div>

                    {/* Module Toggle */}
                    {hasCRMAccess && (
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-lg shrink-0">
                            <button
                                onClick={() => onModuleChange(true)}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${activeModule === 'crm'
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                CRM
                            </button>
                            <button
                                onClick={() => onModuleChange(false)}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${activeModule === 'sales'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                Post Sales
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                        <ThemeToggle />
                        <div
                            className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm ring-2 ring-white dark:ring-white/10 shadow-sm cursor-pointer"
                            onClick={() => setIsProfileOpen(true)}
                        >
                            {profile?.image_url ? (
                                <img src={profile.image_url} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                profile?.full_name?.charAt(0) || 'U'
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hamburger Slide-Over Drawer */}
            <div
                className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
                    isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsDrawerOpen(false)}
            />

            <aside
                className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-200 dark:border-white/10 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] ${
                    isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Drawer Header */}
                <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {tenant?.settings?.appearance?.resolved_logo_url || tenant?.settings?.appearance?.logo_url ? (
                            <img src={tenant.settings.appearance.resolved_logo_url || tenant.settings.appearance.logo_url || undefined} alt={tenant.name} className="w-8 h-8 rounded-lg object-contain shrink-0" />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {tenant?.name?.charAt(0) || 'R'}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate">
                                {tenant?.name || 'RealSalePro'}
                            </h3>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 capitalize truncate block">
                                {profile?.role?.replace(/_/g, ' ') || 'User'}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        aria-label="Close Menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Profile Card in Drawer */}
                <div
                    onClick={() => {
                        setIsDrawerOpen(false);
                        setIsProfileOpen(true);
                    }}
                    className="p-3.5 mx-3 mt-3 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-slate-800 dark:to-slate-800/60 border border-blue-100/80 dark:border-white/5 flex items-center justify-between cursor-pointer hover:shadow-sm transition-all"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            {profile?.image_url ? (
                                <img src={profile.image_url} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                profile?.full_name?.charAt(0) || 'U'
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {profile?.full_name || 'My Account'}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                {profile?.email || 'View Profile'}
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </div>

                {/* Module Switcher in Drawer */}
                {hasCRMAccess && (
                    <div className="px-3 pt-3">
                        <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-xl flex items-center text-xs font-bold">
                            <button
                                onClick={() => {
                                    onModuleChange(true);
                                    setIsDrawerOpen(false);
                                }}
                                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                                    activeModule === 'crm' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                CRM
                            </button>
                            <button
                                onClick={() => {
                                    onModuleChange(false);
                                    setIsDrawerOpen(false);
                                }}
                                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                                    activeModule === 'sales' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                Post Sales
                            </button>
                        </div>
                    </div>
                )}

                {/* Drawer Menu Items (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                    {drawerGroups.map((group) => {
                        if (!group.items || group.items.length === 0) return null;
                        return (
                            <div key={group.label} className="space-y-1">
                                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    {group.label}
                                </div>
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => {
                                                setIsDrawerOpen(false);
                                                if (location.pathname !== item.path) {
                                                    navigate(item.path);
                                                }
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                                isActive
                                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            <Icon size={17} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                                            <span className="truncate flex-1 text-left">{item.label}</span>
                                            {isActive && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Drawer Footer */}
                <div className="p-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                    <button
                        onClick={async () => {
                            setIsDrawerOpen(false);
                            await signOut();
                            window.location.href = '/login';
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main key={location.pathname} className="pt-[calc(4rem+env(safe-area-inset-top,0px))] px-4 pb-28 animate-fadeIn">
                <div className="pt-3 pb-6">
                    {children}
                </div>
            </main>

            {/* Fixed Bottom Navigation (4 Core Items + More Hamburger Tab) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 z-40 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex w-full h-16 items-center justify-around px-1">
                    {bottomNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    if (location.pathname !== item.path) {
                                        navigate(item.path);
                                    }
                                }}
                                className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
                                    isActive
                                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                                        : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
                                }`}
                            >
                                <div className={`relative p-1 rounded-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className="text-[10px] mt-0.5 whitespace-nowrap leading-tight truncate max-w-[64px]">
                                    {getBottomLabel(item.label)}
                                </span>
                            </button>
                        );
                    })}

                    {/* 5th Tab: "More" Menu Button (opens Drawer) */}
                    <button
                        type="button"
                        onClick={() => setIsDrawerOpen(true)}
                        className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
                            isSecondaryRouteActive
                                ? 'text-blue-600 dark:text-blue-400 font-bold'
                                : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
                        }`}
                    >
                        <div className={`relative p-1 rounded-xl transition-transform ${isSecondaryRouteActive ? 'scale-110' : ''}`}>
                            <Menu size={20} strokeWidth={isSecondaryRouteActive ? 2.5 : 2} />
                            {isSecondaryRouteActive && (
                                <span className="absolute top-1 right-0.5 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 ring-2 ring-white dark:ring-surface-dark" />
                            )}
                        </div>
                        <span className="text-[10px] mt-0.5 whitespace-nowrap leading-tight">
                            More
                        </span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
