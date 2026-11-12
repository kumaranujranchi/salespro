import { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileModal } from '../profile/ProfileModal';
import { Tooltip } from '../ui/Tooltip';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  LayoutDashboard,
  Building,
  Briefcase,
  Megaphone,
  Target,
  Calendar,
  TrendingUp,
  CreditCard,
  Award,
  Shield,
  FileText,
  Menu,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart2,
  Contact,
  Users,
  User,
  HelpCircle,
  Zap,
  ArrowRight,
  Building2,
  Settings,
  Plug,
  Server,
  MessageSquare,
  LucideIcon,
  Send,
  Sparkles,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';

import { useAction } from '../../lib/reactive';
import { api } from '../../lib/api-endpoints';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Platform Overview', path: '/platform/dashboard', icon: TrendingUp, roles: ['platform_admin'] },
      { label: 'Tenants', path: '/platform/tenants', icon: Building2, roles: ['platform_admin'] },
      { label: 'Referrals', path: '/referral-management', icon: Users, roles: ['platform_admin'] },
      { label: 'Platform WhatsApp', path: '/platform/whatsapp', icon: MessageSquare, roles: ['platform_admin'] },
      { label: 'AWS & Server Health', path: '/platform/server-health', icon: Server, roles: ['platform_admin'] },
      { label: 'Support Tickets', path: '/platform/support', icon: HelpCircle, roles: ['platform_admin'] },
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive', 'crm_staff', 'accountant', 'driver', 'receptionist'] },
      { label: 'My Performance', path: '/performance', icon: BarChart2, roles: ['admin', 'director', 'team_leader', 'sales_executive', 'crm_staff', 'accountant', 'sales_manager'] },
    ]
  },
  {
    label: 'Accounts',
    items: [
      { label: 'Accounts & Collections', path: '/accounts', icon: CreditCard, roles: ['super_admin', 'admin', 'director', 'accountant'] },
    ]
  },
  {
    label: 'Sales',
    items: [
      { label: 'Sales', path: '/sales', icon: TrendingUp, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive', 'crm_staff', 'accountant', 'sales_manager', 'Sales Executive'] },
      { label: 'Incentives', path: '/incentives', icon: Award, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive', 'crm_staff', 'accountant', 'sales_manager', 'Sales Executive'] },
      { label: 'Targets', path: '/targets', icon: Target, roles: ['super_admin', 'admin', 'director', 'sales_manager', 'team_leader', 'sales_executive', 'Sales Executive'] },
      { label: 'Reports', path: '/reports', icon: FileText, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive', 'crm_staff', 'accountant', 'sales_manager', 'Sales Executive'] },
    ]
  },
  {
    label: 'Operations',
    items: [
      { label: 'Directory', path: '/directory', icon: Contact, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive', 'crm_staff', 'accountant', 'driver', 'receptionist'] },
      { label: 'Announcements', path: '/announcements', icon: Megaphone, roles: ['super_admin', 'admin', 'director', 'sales_executive', 'team_leader', 'receptionist'] },
    ]
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Projects', path: '/projects', icon: Building, roles: ['super_admin', 'admin', 'director'] },
      { label: 'Inventory', path: '/inventory', icon: Building2, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive', 'Sales Executive', 'crm_staff', 'accountant', 'sales_manager'] },
      { label: 'Departments', path: '/departments', icon: Briefcase, roles: ['super_admin', 'admin', 'director'] },
      { label: 'Roles', path: '/roles', icon: Shield, roles: ['super_admin'] },
      { label: 'Users', path: '/users', icon: Users, roles: ['super_admin', 'admin', 'director'] },
      { label: 'WhatsApp', path: '/configuration/whatsapp', icon: MessageSquare, roles: ['super_admin', 'admin', 'director', 'platform_admin', 'team_leader', 'sales_manager', 'sales_executive', 'crm_staff'] },
      { label: 'Integrations', path: '/settings/integrations', icon: Plug, roles: ['super_admin', 'admin', 'director'] },
    ]
  }
];

// Flatten for backward compatibility
const navItems: NavItem[] = navGroups.flatMap(group => group.items);

import { useMobile } from '../../hooks/useMobile';
import { MobileLayout } from './MobileLayout';
import { useTutorial } from '../../contexts/TutorialContext';
import { AppTutorial } from '../tutorial/AppTutorial';

// Define CRM Nav Items
const crmNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/crm', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive'] },
  { label: 'Leads', path: '/leads', icon: Contact, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive'] },
  { label: 'Pipeline', path: '/crm/pipeline', icon: BarChart2, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive'] },
  { label: 'Site Visits', path: '/site-visits', icon: Calendar, roles: ['super_admin', 'admin', 'director', 'team_leader', 'sales_executive', 'crm_staff', 'driver', 'receptionist'] },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('realsalepro_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('realsalepro_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 200 && parsed <= 500) return parsed;
      }
    } catch {}
    return 272; // default width in pixels
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartWidthRef = useRef<number>(272);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('realsalepro_sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = isCollapsed ? 80 : sidebarWidth;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartXRef.current;
      const newWidth = dragStartWidthRef.current + delta;

      if (newWidth < 140) {
        setIsCollapsed(true);
        try { localStorage.setItem('realsalepro_sidebar_collapsed', 'true'); } catch {}
      } else {
        if (isCollapsed) {
          setIsCollapsed(false);
          try { localStorage.setItem('realsalepro_sidebar_collapsed', 'false'); } catch {}
        }
        const clampedWidth = Math.min(Math.max(newWidth, 200), 480);
        setSidebarWidth(clampedWidth);
        try { localStorage.setItem('realsalepro_sidebar_width', String(clampedWidth)); } catch {}
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isCollapsed, sidebarWidth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);
  const { profile, tenant, signOut } = useAuth();
  const { startTutorial } = useTutorial();
  const navigate = useNavigate();
  const location = useLocation();

  // Ensure landing page marketing classes are stripped on dashboard mount
  useEffect(() => {
    document.body.classList.remove('landing-page-active');
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  // AI Chatbot State
  const chatAction = useAction(api.ai.chatWithAI);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([
    {
      role: 'model',
      content: "Welcome! Ready to boost your pipeline and close more deals today?\n\nHere is how I can assist you right now:\n\n* **Cold Call Scripts:** Pitching SalesPro to real estate brokers or team leads.\n* **Objection Handling:** Crushing pushback like \"We already use a CRM\" or \"It's too expensive.\"\n* **Follow-up Cadences:** High-converting multi-channel strategies (Email, SMS, WhatsApp).\n* **Pipeline Strategy:** Ideas to re-engage dead leads and boost conversion rates.\n\nWhat are you working on right now? Tell me your immediate goal or challenge!"
    }
  ]);

  // Clean formatting symbols (* and **) to render them natively as bullet lists and bold text
  const renderFormattedMessage = (content: any) => {
    try {
      if (!content) return null;
      const safeContent = typeof content === 'string'
        ? content
        : (content && typeof content === 'object' && content.message ? String(content.message) : (content ? String(content) : ''));
      if (!safeContent) return null;
      const lines = safeContent.split('\n');
      return lines.map((line, idx) => {
        let trimmed = (line || '').trim();
        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || (trimmed.startsWith('*') && !trimmed.startsWith('**'));
        
        if (isBullet) {
          trimmed = trimmed.replace(/^[\*\-]\s*/, '');
        }

        // Parse bold elements inside the line
        const parts = (trimmed || '').split('**');
        const formattedText = parts.map((part, i) => {
          if (i % 2 === 1) {
            return <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{part}</strong>;
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-2 my-1.5 leading-relaxed">
              <span className="text-emerald-500 dark:text-[#00E576] font-bold text-sm select-none">•</span>
              <span className="flex-1">{formattedText}</span>
            </div>
          );
        }

        return (
          <div key={idx} className={trimmed ? "my-1.5 leading-relaxed min-h-[1em]" : "my-2.5 min-h-[0.5em]"}>
            {formattedText}
          </div>
        );
      });
    } catch (e) {
      return <div>{String(content || '')}</div>;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message to local chat
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: userMessage }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      // Call the AI action with the messages list and current profile/tenant IDs
      const rawResponse = await chatAction({
        messages: updatedMessages,
        tenant_id: profile?.tenant_id,
        profileId: profile?.id,
      });

      let aiReply = '';
      if (typeof rawResponse === 'string' && rawResponse.trim()) {
        aiReply = rawResponse.trim();
      } else if (rawResponse && typeof rawResponse === 'object') {
        aiReply = rawResponse.reply || rawResponse.message || rawResponse.content || '';
      }

      if (!aiReply) {
        aiReply = "I'm your RealSalePro AI Sales Copilot. How can I help you boost your pipeline or close deals today?";
      }

      setChatMessages([...updatedMessages, { role: 'model' as const, content: aiReply }]);
    } catch (err) {
      console.error('AI chat error:', err);
      setChatMessages([
        ...updatedMessages,
        { role: 'model' as const, content: "I'm your RealSalePro AI Sales Copilot. How can I assist you with your sales pipeline or property pitches today?" }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isChatOpen) {
      const chatContainer = document.getElementById('chat-messages-container');
      if (chatContainer) {
        // Run after React layout renders
        setTimeout(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 50);
      }
    }
  }, [chatMessages, chatLoading, isChatOpen]);

  // Module State
  const [activeModule, setActiveModule] = useState<'sales' | 'crm'>('sales');

  // Collapsed Groups State (all expanded by default)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Check if tenant has CRM enabled
  const isCRMEnabled = tenant?.settings?.features?.crm !== false;

  // Check if user has access to CRM (Sales Department)
  // Assuming 'sales_executive', 'team_leader' are in Sales department + Admins
  const userRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
  const roleDetails = profile?.role_details;
  const permissions = roleDetails?.permissions;
  const hasCRMAccess = isCRMEnabled && (
    ['super_admin', 'admin', 'team_leader', 'sales_executive'].includes(userRole) ||
    permissions?.menu?.crm === 'read' ||
    permissions?.menu?.crm === 'edit'
  );

  useEffect(() => {
    // Sync module state with URL
    const isCRMPath = location.pathname.startsWith('/crm') || 
                      location.pathname.startsWith('/leads') ||
                      location.pathname === '/site-visits';
    if (isCRMPath) {
      if (!isCRMEnabled) {
        navigate('/dashboard');
        return;
      }
      setActiveModule('crm');
    } else {
      setActiveModule('sales');
    }
  }, [location.pathname, isCRMEnabled, navigate]);

  const handleModuleToggle = (isCRM: boolean) => {
    if (isCRM && isCRMEnabled) {
      setActiveModule('crm');
      navigate('/crm');
    } else {
      setActiveModule('sales');
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    if (profile?.force_password_change) {
      setIsProfileOpen(true);
    }
  }, [profile]);

  // Determine which nav items to show
  const currentNavItems = activeModule === 'crm' ? crmNavItems : navItems;

  const canAccessNavItem = (item: NavItem) => {
    // 0. Master Bypass - Super Admin always has access to tenant-level features
    // We block platform-level items even for super_admin if not explicitly allowed
    // Also, Super Admin specifically requested to NOT see 'My Performance'
    const isPlatformItem = item.path.startsWith('/platform') || item.path === '/referral-management';
    if (profile?.role === 'super_admin') {
      if (item.path === '/performance') return false;
      if (!isPlatformItem) return true;
    }

    // Special Check: My Performance is only for Sales Department
    if (item.path === '/performance') {
      const isSalesDept = profile?.department_details?.name.toUpperCase() === 'SALES';
      if (!isSalesDept) return false;
    }

    // 1. Permission-based filtering (Dynamic Roles)
    const roleDetails = profile?.role_details;
    const permissions = roleDetails?.permissions;

    if (permissions?.menu) {
      const menuPerms = permissions.menu;
      // Precise mapping of path to permission key
      let permKey: string | null = null;
      
      if (item.path === '/dashboard') permKey = 'dashboard';
      if (item.path === '/accounts' || item.path === '/payments') permKey = 'accounts';
      if (item.path === '/sales' || item.path === '/performance') permKey = 'sales';
      if (item.path === '/crm' || item.path === '/leads' || item.path === '/crm/pipeline') permKey = 'crm';
      if (item.path === '/projects' || item.path === '/inventory') permKey = 'inventory';
      if (item.path === '/site-visits') permKey = 'site_visits';
      if (item.path === '/incentives' || item.path === '/targets') permKey = 'incentives';
      if (item.path === '/reports') permKey = 'reports';
      if (item.path === '/announcements') permKey = 'announcements';
      if (item.path === '/directory') permKey = 'directory';
      if (item.path === '/users') permKey = 'users';
      if (item.path === '/departments') permKey = 'departments';
      if (item.path === '/roles') permKey = 'roles';
      if (item.path === '/settings/integrations') permKey = 'roles';
      if (item.path === '/subscription') permKey = 'subscription';
      if (item.path === '/support') permKey = 'support';

      // If we have a mapped key
      if (permKey) {
        const userPerm = menuPerms[permKey];
        
        // Strictly block if set to 'none'
        if (userPerm === 'none') return false;
        
        // If it's configured (read or edit), allow it
        if (userPerm === 'read' || userPerm === 'edit') return true;
        
        // If it's a custom role and the key is missing/unconfigured, hide it for safety
        if (roleDetails && !roleDetails.is_system) return false;
      }
    }

    // 2. Fallback/Role-string based check (System Roles or missing permission data)
    // Only used if permission mapping didn't provide a definitive true/false
    const normalizedRoles = item.roles?.map(r => r.toLowerCase().replace(/[\s_-]+/g, '_')) || [];
    const roleAccess = !item.roles || normalizedRoles.includes(userRole);
    if (!roleAccess) return false;

    // 3. Global Tenant Feature Flags
    const features = tenant?.settings?.features;
    if (features) {
      if (item.path === '/leads' || item.path === '/crm' || item.path === '/crm/pipeline' || item.path === '/site-visits') return features.crm !== false;
      if (item.path === '/projects' || item.path === '/inventory') return features.inventory !== false;
      if (item.path === '/reports') return features.reports !== false;
      if (item.path === '/incentives' || item.path === '/targets') return features.incentives !== false;
    }

    return true;
  };

  if (isMobile) {
    return (
      <MobileLayout
        navItems={currentNavItems.filter(canAccessNavItem)}
        activeModule={activeModule}
        onModuleChange={handleModuleToggle}
        hasCRMAccess={hasCRMAccess}
      >
        {children}
      </MobileLayout>
    );
  }

  const handleSignOut = async () => {
    if (profile?.id) {
        sessionStorage.removeItem(`hasSeenNotificationPopup_${profile.id}`);
    }
    // Also clear legacy key just in case
    sessionStorage.removeItem('hasSeenNotificationPopup');
    
    await signOut();
    window.location.href = '/login';
  };

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    if (sidebarOpen) setSidebarOpen(false);
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const filteredNavItems = currentNavItems.filter(canAccessNavItem);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        forceChange={profile?.force_password_change}
      />

      {/* Top Header - Glassmorphism */}
      <div
        className="fixed top-0 right-0 z-30 border-b border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]"
        style={{
          left: isMobile ? 0 : (isCollapsed ? '80px' : `${sidebarWidth}px`),
          transition: isDragging ? 'none' : 'left 300ms cubic-bezier(0.4,0,0.2,1)'
        }}
      >
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 p-2 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Desktop Sidebar Toggle Button (Hide / Unhide) */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Hide Sidebar (Ctrl+B)"}
            >
              {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>

            {/* Module Toggle Switch */}
            {hasCRMAccess && (
              <div id="module-toggle" className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
                <button
                  onClick={() => handleModuleToggle(true)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeModule === 'crm'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  CRM
                </button>
                <button
                  onClick={() => handleModuleToggle(false)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeModule === 'sales'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  Post Sales
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Help Button - Desktop Only */}
            <button
              id="help-button"
              onClick={startTutorial}
              className="hidden lg:flex items-center justify-center p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
              title="Start Tutorial"
            >
              <HelpCircle size={20} />
            </button>

            <div id="theme-toggle">
              <ThemeToggle />
            </div>
            <div id="notification-bell">
              <NotificationBell />
            </div>

            {/* Customer Profile Dropdown */}
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/10 mx-2 hidden md:block"></div>

            <div className="relative" ref={profileDropdownRef}>
              <button
                id="user-profile"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className={`flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer ${
                  isProfileDropdownOpen
                    ? 'bg-gray-100 dark:bg-white/10 border-gray-300 dark:border-white/20 shadow-sm'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10'
                }`}
                title="Customer Profile & Account"
              >
                <div className="relative">
                  {profile?.image_url && !imageError ? (
                    <img
                      src={profile.image_url}
                      alt={profile.full_name}
                      onError={() => setImageError(true)}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[#10B981]/40 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold ring-2 ring-[#10B981]/40 shadow-sm text-sm">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-surface-dark rounded-full"></div>
                </div>

                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-gray-800 dark:text-white leading-none truncate max-w-[130px]">
                    {profile?.full_name || 'My Profile'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium capitalize mt-1">
                    {profile?.role?.replace('_', ' ')}
                  </p>
                </div>

                <ChevronDown
                  size={14}
                  className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                    isProfileDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>

              {/* Floating Customer Profile Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#121e18] rounded-2xl shadow-2xl border border-gray-200/80 dark:border-white/10 py-2 z-50 animate-fadeIn backdrop-blur-xl">
                  {/* Account / Tenant Header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0 overflow-hidden">
                        {profile?.image_url && !imageError ? (
                          <img src={profile.image_url} alt={profile.full_name} className="w-full h-full object-cover" />
                        ) : (
                          profile?.full_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {profile?.full_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {profile?.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-gray-50 dark:border-white/5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                        {tenant?.name || 'RealSalePro'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                        <Zap size={10} className="fill-current" />
                        {tenant?.plan_tier === 'pro' || tenant?.subscription_status === 'active' ? 'PRO' : 'Free'}
                      </span>
                    </div>
                  </div>

                  {/* Shifted Menu Items: Profile, Settings, Subscription, Support */}
                  <div className="px-2 py-1.5 space-y-0.5">
                    {/* My Profile */}
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsProfileOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-white/5 transition-colors group cursor-pointer text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        <User size={15} />
                      </div>
                      <div className="flex-1">
                        <p className="leading-tight">My Profile</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">Personal details & security</p>
                      </div>
                    </button>

                    {/* Settings (Shifted to Profile) */}
                    {(profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'director') && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigate('/settings');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-white/5 transition-colors group cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          <Settings size={15} />
                        </div>
                        <div className="flex-1">
                          <p className="leading-tight">Settings</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">Company details, branding & rules</p>
                        </div>
                      </button>
                    )}

                    {/* Subscription (Shifted to Profile) */}
                    {(profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'director') && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigate('/subscription');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-white/5 transition-colors group cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                          <Zap size={15} />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <p className="leading-tight">Subscription & Billing</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">Plan, invoices & usage limits</p>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                            PRO
                          </span>
                        </div>
                      </button>
                    )}

                    {/* Support (Shifted to Profile) */}
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        navigate('/support');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-white/5 transition-colors group cursor-pointer text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        <HelpCircle size={15} />
                      </div>
                      <div className="flex-1">
                        <p className="leading-tight">Help & Support</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">Support tickets & documentation</p>
                      </div>
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="px-2 pt-1 border-t border-gray-100 dark:border-white/5 mt-1">
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer text-left group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:-translate-x-0.5 transition-transform">
                        <LogOut size={15} />
                      </div>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dragging overlay to prevent cursor loss and text selection */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none pointer-events-auto" />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 bg-white dark:bg-surface-dark border-r border-slate-200/60 dark:border-white/10 z-40
          shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'w-20' : 'w-72'}
          pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
        `}
        style={{
          width: isMobile ? undefined : (isCollapsed ? '80px' : `${sidebarWidth}px`),
          transition: isDragging ? 'none' : 'width 300ms cubic-bezier(0.4,0,0.2,1), transform 300ms cubic-bezier(0.4,0,0.2,1)'
        }}
      >
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-transparent relative">
          {/* Drag Resize Handle (Desktop Only) */}
          {!isMobile && (
            <div
              onMouseDown={handleMouseDown}
              className={`
                hidden lg:block absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-50 group select-none
                ${isDragging ? 'bg-emerald-500/20' : ''}
              `}
              title="Drag to resize sidebar (Double click to reset)"
              onDoubleClick={() => {
                setSidebarWidth(272);
                if (isCollapsed) toggleCollapse();
                try { localStorage.setItem('realsalepro_sidebar_width', '272'); } catch {}
              }}
            >
              {/* Highlight line on hover or drag */}
              <div className={`
                absolute top-0 right-1.5 w-[2px] h-full transition-colors
                ${isDragging ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'group-hover:bg-emerald-500/70'}
              `} />

              {/* Grip dots */}
              <div className="absolute top-1/2 -translate-y-1/2 right-0.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 p-0.5 rounded shadow border border-slate-200 dark:border-white/10">
                <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                <div className="w-1 h-1 rounded-full bg-slate-400"></div>
              </div>
            </div>
          )}

          {/* Logo Section */}
          <div className={`h-24 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-6'} border-b border-dashed border-slate-200 dark:border-white/10 relative`}>
            {isCollapsed ? (
              tenant?.settings?.appearance?.resolved_logo_url || tenant?.settings?.appearance?.logo_url ? (
                <img src={tenant.settings.appearance.resolved_logo_url || tenant.settings.appearance.logo_url || undefined} alt={tenant.name} className="w-10 h-10 object-contain rounded-xl shadow-sm" />
              ) : (
                <>
                  <img src="/images/RealSalePro_DarkLogo.png" alt="RealSalePro" className="w-8 h-8 object-contain rounded-xl shadow-sm dark:hidden" />
                  <img src="/images/RealSalePro_LighLogo.png" alt="RealSalePro" className="w-8 h-8 object-contain rounded-xl shadow-sm hidden dark:block" />
                </>
              )
            ) : (
              <div className="flex flex-col items-start gap-1.5 w-full pr-4">
                {tenant?.settings?.appearance?.resolved_logo_url || tenant?.settings?.appearance?.logo_url ? (
                  <img src={tenant.settings.appearance.resolved_logo_url || tenant.settings.appearance.logo_url || undefined} alt={tenant.name} className="h-9 max-w-full object-contain rounded-lg shadow-sm" />
                ) : (
                  <>
                    <img src="/images/RealSalePro_DarkLogo.png" alt="RealSalePro" className="h-9 w-auto object-contain rounded-xl shadow-sm dark:hidden" />
                    <img src="/images/RealSalePro_LighLogo.png" alt="RealSalePro" className="h-9 w-auto object-contain rounded-xl shadow-sm hidden dark:block" />
                  </>
                )}
                {tenant?.name && (
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider truncate w-full uppercase mt-1">
                    {tenant.name}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav id="sidebar-nav" className="flex-1 overflow-y-auto py-6 px-4 space-y-4 custom-scrollbar">
            <div className={`px-2 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest ${isCollapsed ? 'hidden' : 'block'}`}>
              {activeModule === 'crm' ? 'CRM Module' : 'Post Sales Module'}
            </div>

            {activeModule === 'sales' ? (
              // Sales Module - Grouped Navigation
              navGroups.map((group) => {
                const groupItems = group.items.filter(canAccessNavItem);

                if (groupItems.length === 0) return null;

                const isGroupCollapsed = collapsedGroups[group.label];
                const toggleGroup = () => {
                  setCollapsedGroups(prev => ({
                    ...prev,
                    [group.label]: !prev[group.label]
                  }));
                };

                return (
                  <div key={group.label} className="space-y-1">
                    {!isCollapsed && (
                      <button
                        onClick={toggleGroup}
                        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        <span>{group.label}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${isGroupCollapsed ? '-rotate-90' : ''}`}
                        />
                      </button>
                    )}

                    {(!isGroupCollapsed || isCollapsed) && groupItems.map((item) => {
                      const Icon = item.icon;

                      const navElement = (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end
                          onClick={(e) => handleNavClick(item.path, e)}
                          className={({ isActive }) => `
                            w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left
                            transition-all duration-300 group relative overflow-hidden
                            ${isActive
                              ? 'bg-gradient-to-r from-[#00E576] to-[#00C853] text-[#0A1C37] shadow-lg shadow-green-200/50 dark:shadow-none font-bold'
                              : 'text-slate-500 dark:text-white hover:bg-white dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white hover:shadow-sm'
                            }
                            ${isCollapsed ? 'justify-center px-2' : ''}
                          `}
                        >
                          {({ isActive }) => (
                            <>
                              {!isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-white/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                              )}

                              <Icon size={isCollapsed ? 22 : 18} className={`
                                relative z-10 transition-transform duration-300 group-hover:scale-110
                                ${isActive ? 'text-[#0A1C37]' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-primary'}
                              `} />

                              {!isCollapsed && (
                                <span className="relative z-10 font-semibold text-[13px] tracking-wide flex items-center justify-between w-full">
                                  <span>{item.label}</span>
                                  {(item.label === 'Integrations' || item.label === 'Support') && tenant?.plan_tier === 'free' && (
                                    <span className={`
                                      ml-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider
                                      ${isActive 
                                        ? 'bg-rose-600 text-white' 
                                        : 'bg-red-500 text-white'
                                      }
                                    `}>
                                      Pro
                                    </span>
                                  )}
                                </span>
                              )}

                              {!isCollapsed && isActive && (
                                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
                              )}
                            </>
                          )}
                        </NavLink>
                      );

                      return isCollapsed ? (
                        <Tooltip key={item.path} content={item.label} position="right" className="w-full">
                          {navElement}
                        </Tooltip>
                      ) : (
                        navElement
                      );
                    })}
                  </div>
                );
              })
            ) : (
              // CRM Module - Original flat navigation
              filteredNavItems.map((item) => {
                const Icon = item.icon;

                const navElement = (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    onClick={(e) => handleNavClick(item.path, e)}
                    className={({ isActive }) => `
                      w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left
                      transition-all duration-300 group relative overflow-hidden
                      ${isActive
                        ? 'bg-gradient-to-r from-[#00E576] to-[#00C853] text-[#0A1C37] shadow-lg shadow-green-200/50 dark:shadow-none font-bold'
                        : 'text-slate-500 dark:text-white hover:bg-white dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white hover:shadow-sm'
                      }
                      ${isCollapsed ? 'justify-center px-2' : ''}
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        {!isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-white/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        )}

                        <Icon size={isCollapsed ? 22 : 20} className={`
                          relative z-10 transition-transform duration-300 group-hover:scale-110
                          ${isActive ? 'text-[#0A1C37]' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-primary'}
                        `} />

                        {!isCollapsed && (
                          <span className="relative z-10 font-semibold text-[13.5px] tracking-wide flex items-center justify-between w-full">
                            <span>{item.label}</span>
                            {(item.label === 'Integrations' || item.label === 'Support') && tenant?.plan_tier === 'free' && (
                              <span className={`
                                ml-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider
                                ${isActive 
                                  ? 'bg-rose-600 text-white' 
                                  : 'bg-red-500 text-white'
                                }
                              `}>
                                Pro
                              </span>
                            )}
                          </span>
                        )}

                        {!isCollapsed && isActive && (
                          <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
                        )}
                      </>
                    )}
                  </NavLink>
                );

                return isCollapsed ? (
                  <Tooltip key={item.path} content={item.label} position="right" className="w-full">
                    {navElement}
                  </Tooltip>
                ) : (
                  navElement
                );
              })
            )}
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
        className="mt-[calc(4rem+env(safe-area-inset-top))] p-4 md:p-5 overflow-x-hidden"
        style={{
          marginLeft: isMobile ? 0 : (isCollapsed ? '80px' : `${sidebarWidth}px`),
          transition: isDragging ? 'none' : 'margin-left 300ms cubic-bezier(0.4,0,0.2,1)'
        }}
      >
        <div key={location.pathname} className="max-w-[1600px] space-y-6 animate-fadeIn">
          {children}
        </div>
      </main>
      <AppTutorial />

      {/* AI Chatbot Float Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-2xl hover:scale-110 hover:shadow-emerald-300/30 transition-all duration-300 group cursor-pointer focus:outline-none"
      >
        {isChatOpen ? (
          <X size={24} className="transition-transform duration-200 rotate-90" />
        ) : (
          <div className="relative">
            <Sparkles size={24} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
          </div>
        )}
      </button>

      {/* AI Chatbot Drawer Pane */}
      {isChatOpen && (
        <div className={`fixed bottom-24 right-6 z-50 bg-white dark:bg-[#121e18] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300 transition-all duration-300 ${isChatMaximized ? 'w-[600px] max-w-[95vw] h-[80vh]' : 'w-[340px] sm:w-[380px] h-[500px]'}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00E576] to-[#00C853] px-4 py-3.5 flex items-center justify-between text-[#0A1C37]">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#0A1C37]" />
              <div>
                <h4 className="font-bold text-sm text-[#0A1C37]">AI Sales Copilot</h4>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0A1C37] animate-pulse"></span>
                  <span className="text-[10px] text-[#0A1C37] opacity-80 font-medium">Ready to assist</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsChatMaximized(!isChatMaximized)}
                className="text-[#0A1C37] hover:bg-black/10 p-1.5 rounded-lg transition-colors focus:outline-none cursor-pointer"
                title={isChatMaximized ? "Minimize chat" : "Maximize chat"}
              >
                {isChatMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-[#0A1C37] hover:bg-black/10 p-1.5 rounded-lg transition-colors focus:outline-none cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Message Area */}
          <div
            id="chat-messages-container"
            className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-black/20 scroll-smooth"
          >
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm whitespace-pre-wrap'
                  }`}
                >
                  {renderFormattedMessage(msg.content)}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-none px-3.5 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce duration-300"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce duration-300 delay-150"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce duration-300 delay-300"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a sales question..."
              className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="flex items-center justify-center p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white disabled:opacity-50 hover:opacity-90 transition-opacity duration-150 focus:outline-none cursor-pointer"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
