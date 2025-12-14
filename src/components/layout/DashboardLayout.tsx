import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileModal } from '../profile/ProfileModal';
import { Tooltip } from '../ui/Tooltip';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NotificationBell } from '../notifications/NotificationBell';
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
  Menu,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Contact,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: any;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive', 'crm_staff', 'accountant', 'driver', 'receptionist'] },
  { label: 'My Performance', path: '/performance', icon: BarChart2, roles: ['sales_executive', 'team_leader'] },
  { label: 'Directory', path: '/directory', icon: Contact },
  { label: 'Users', path: '/users', icon: Users, roles: ['super_admin', 'admin', 'director'] },
  { label: 'Departments', path: '/departments', icon: Briefcase, roles: ['super_admin', 'admin', 'director'] },
  { label: 'Projects', path: '/projects', icon: Building, roles: ['super_admin', 'admin', 'director'] },
  { label: 'Announcements', path: '/announcements', icon: Megaphone, roles: ['super_admin', 'admin', 'director', 'sales_executive', 'team_leader', 'receptionist'] },
  { label: 'Targets', path: '/targets', icon: Target, roles: ['super_admin', 'admin', 'director'] },
  { label: 'Site Visits', path: '/site-visits', icon: Calendar },
  { label: 'Sales', path: '/sales', icon: TrendingUp, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive', 'crm_staff', 'accountant'] },
  { label: 'Incentives', path: '/incentives', icon: Award, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive', 'crm_staff', 'accountant'] },
  { label: 'Reports', path: '/reports', icon: FileText, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive', 'crm_staff', 'accountant'] },
];

import { useMobile } from '../../hooks/useMobile';
import { MobileLayout } from './MobileLayout';

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (profile?.force_password_change) {
      setIsProfileOpen(true);
    }
  }, [profile]);

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(profile?.role || '');
  });

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        forceChange={profile?.force_password_change}
      />

      {/* Top Header - Glassmorphism */}
      <div className={`fixed top-0 right-0 z-30 transition-all duration-300 border-b border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl pt-[env(safe-area-inset-top)] ${isCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-72'}`}>
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 p-2 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Search Bar Removed */}
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />

            {/* Profile Dropdown Trigger */}
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/10 mx-2 hidden md:block"></div>

            <Tooltip content="Manage Profile" position="bottom">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all"
              >
                <div className="relative">
                  {profile?.image_url && !imageError ? (
                    <img
                      src={profile.image_url}
                      alt={profile.full_name}
                      onError={() => setImageError(true)}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-white/10 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-white/10 shadow-sm text-sm">
                      {profile?.full_name?.charAt(0)}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-surface-dark rounded-full"></div>
                </div>

                <div className="hidden md:block text-right">
                  <p className="text-sm font-semibold text-gray-700 dark:text-white leading-none">{profile?.full_name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium capitalize mt-1">{profile?.role?.replace('_', ' ')}</p>
                </div>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 bg-white dark:bg-surface-dark border-r border-slate-200/60 dark:border-white/10 z-40
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'w-20' : 'w-72'}
          pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
        `}
      >
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-transparent">
          {/* Logo Section */}
          <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-dashed border-slate-200 dark:border-white/10`}>
            {isCollapsed ? (
              <img src="/logo.png" alt="WishPro" className="w-10 h-10 object-contain rounded-xl shadow-sm dark:brightness-0 dark:invert" />
            ) : (
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="WishPro" className="w-10 h-10 object-contain rounded-xl shadow-sm dark:brightness-0 dark:invert" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-300">
                  WishPro
                </span>
              </div>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex w-6 h-6 items-center justify-center rounded-full bg-white dark:bg-surface-highlight border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md transition-all absolute -right-3 top-7 z-50"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
            <div className={`px-2 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest ${isCollapsed ? 'hidden' : 'block'}`}>
              Main Menu
            </div>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Tooltip key={item.path} content={isCollapsed ? item.label : ''} position="right" className="w-full">
                  <button
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left
                      transition-all duration-300 group relative overflow-hidden
                      ${isActive
                        ? 'bg-gradient-to-r from-[#00E576] to-[#00C853] text-[#0A1C37] shadow-lg shadow-green-200/50 dark:shadow-none font-bold'
                        : 'text-slate-500 dark:text-white hover:bg-white dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white hover:shadow-sm'
                      }
                      ${isCollapsed ? 'justify-center px-2' : ''}
                    `}
                  >
                    {/* Hover Effect Background */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-white/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}

                    <Icon size={isCollapsed ? 22 : 20} className={`
                      relative z-10 transition-transform duration-300 group-hover:scale-110
                      ${isActive ? 'text-[#0A1C37]' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-primary'}
                    `} />

                    {!isCollapsed && (
                      <span className="relative z-10 font-semibold text-[13.5px] tracking-wide">{item.label}</span>
                    )}

                    {!isCollapsed && isActive && (
                      <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-dashed border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-transparent">
            <button
              onClick={handleSignOut}
              className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left
                  text-slate-500 dark:text-text-muted hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400
                  transition-all duration-200 group
                  ${isCollapsed ? 'justify-center' : ''}
                `}
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              {!isCollapsed && <span className="font-semibold text-sm">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main
        className={`
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          mt-[calc(4rem+env(safe-area-inset-top))] p-4 md:p-6 overflow-x-hidden
          ${isCollapsed ? 'ml-0 lg:ml-20' : 'ml-0 lg:ml-72'}
        `}
      >
        <div className="max-w-[1600px] space-y-8 animate-fadeIn">
          {children}
        </div>
      </main>
    </div>
  );
}
