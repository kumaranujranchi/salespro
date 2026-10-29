import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/database';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  UserCheck,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Eye,
  Lock,
  Unlock,
  ExternalLink,
  Sparkles,
  PhoneCall,
  SlidersHorizontal,
} from 'lucide-react';

interface RoleOption {
  role: UserRole;
  label: string;
  badge: string;
  description: string;
  color: string;
  testFocus: string;
}

const AVAILABLE_ROLES: RoleOption[] = [
  {
    role: 'platform_admin',
    label: 'Platform Admin',
    badge: 'SaaS Owner',
    description: 'Master platform view: multi-tenant management, billing, and server health.',
    color: 'border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    testFocus: 'Full SaaS control',
  },
  {
    role: 'super_admin',
    label: 'Super Admin',
    badge: 'Tenant Owner',
    description: 'Tenant administrator: company settings, user invites, and full lead access.',
    color: 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    testFocus: 'Unmasked leads & Settings',
  },
  {
    role: 'sales_executive',
    label: 'Sales Executive',
    badge: 'Team Member',
    description: 'Sales rep view: lead phone numbers masked, restricted to assigned leads.',
    color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    testFocus: '🔒 Phone Masking & Dialer',
  },
  {
    role: 'team_leader',
    label: 'Team Leader',
    badge: 'Manager',
    description: 'Team supervisor: view team targets, review followups, site visit logs.',
    color: 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    testFocus: 'Team pipeline & Targets',
  },
  {
    role: 'accountant',
    label: 'Accountant',
    badge: 'Finance',
    description: 'Finance desk: view approved sales, incentive logs, and payment status.',
    color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    testFocus: 'Incentives & Payouts',
  },
  {
    role: 'driver',
    label: 'Driver',
    badge: 'Field Staff',
    description: 'Field logistics: assigned site visits, pickup timings, and location routes.',
    color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    testFocus: 'Site Visit Pickup List',
  },
  {
    role: 'receptionist',
    label: 'Receptionist',
    badge: 'Front Desk',
    description: 'Front desk: visitor registrations, direct walk-in leads, company directory.',
    color: 'border-pink-500/50 bg-pink-500/10 text-pink-600 dark:text-pink-400',
    testFocus: 'Directory & Visitor Intake',
  },
];

export function AdminRoleSwitcherBar() {
  const { user, profile, isActualPlatformAdmin, activeRoleOverride, setActiveRoleOverride } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // STRICT GUARD: Must be 100% invisible to regular users, staff, and clients.
  // Only rendered if user session is genuine SaaS/Platform Admin.
  if (!user || !isActualPlatformAdmin) {
    return null;
  }

  const currentActiveRole: UserRole = (activeRoleOverride || profile?.role || 'platform_admin') as UserRole;
  const isImpersonating = Boolean(activeRoleOverride && activeRoleOverride !== 'platform_admin');
  const activeRoleConfig = AVAILABLE_ROLES.find((r) => r.role === currentActiveRole) || AVAILABLE_ROLES[0];

  const handleRoleSelect = (role: UserRole) => {
    if (role === 'platform_admin') {
      setActiveRoleOverride(null);
    } else {
      setActiveRoleOverride(role);
    }
  };

  const handleReset = () => {
    setActiveRoleOverride(null);
  };

  return (
    <aside
      aria-label="SaaS Admin Testing Toolbar"
      className="fixed bottom-4 right-4 z-[9999] font-sans antialiased max-w-sm sm:max-w-md pointer-events-auto"
    >
      {/* Collapsed Pill (Discreet, Mobile-Friendly) */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-full shadow-2xl backdrop-blur-md border transition-all duration-200 text-xs font-semibold ${
            isImpersonating
              ? 'bg-amber-500/90 hover:bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30 animate-pulse'
              : 'bg-slate-900/90 hover:bg-slate-900 text-slate-100 border-white/20 shadow-slate-950/50'
          }`}
          title="Open SaaS Admin QA Role Switcher"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-300/40 animate-ping" />
          <ShieldAlert className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="font-bold">QA Mode:</span>
          <span className="px-2 py-0.5 rounded-full bg-black/30 text-[11px] font-mono capitalize">
            {activeRoleConfig.label}
          </span>
          <ChevronUp className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {/* Expanded QA Control Panel */}
      {isExpanded && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-300 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-4 text-slate-800 dark:text-slate-100 w-[92vw] sm:w-[420px] max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">SaaS Admin QA Mode</h3>
                  <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Solo-Founder QA
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instant role switching. Only visible to SaaS Admin.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Minimize toolbar"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Active Status Callout */}
          <div className="my-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              {isImpersonating ? (
                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <Unlock className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <div className="truncate">
                <div className="font-semibold flex items-center gap-1.5">
                  <span>Current View:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold capitalize">
                    {activeRoleConfig.label}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {activeRoleConfig.testFocus}
                </div>
              </div>
            </div>

            {isImpersonating && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition shrink-0"
                title="Reset to default Platform Admin"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Role Selection Grid */}
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
            Switch Perspective:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 overflow-y-auto max-h-[220px] pr-1 py-1">
            {AVAILABLE_ROLES.map((item) => {
              const isSelected = item.role === currentActiveRole;
              return (
                <button
                  key={item.role}
                  onClick={() => handleRoleSelect(item.role)}
                  className={`flex flex-col text-left p-2 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-xs">{item.label}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {item.testFocus}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Jump & Verify Shortcuts */}
          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Quick Test Verification:</span>
              <span className="text-[10px] text-slate-400">{location.pathname}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <button
                onClick={() => navigate('/leads')}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 font-medium"
              >
                <PhoneCall className="w-3 h-3 text-emerald-500" />
                Leads (Test Phone Mask)
              </button>

              <button
                onClick={() => navigate('/targets')}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 font-medium"
              >
                <Sparkles className="w-3 h-3 text-blue-500" />
                Targets & Math
              </button>

              <button
                onClick={() => navigate('/incentives')}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 font-medium"
              >
                <Eye className="w-3 h-3 text-amber-500" />
                Incentives
              </button>

              {currentActiveRole === 'platform_admin' && (
                <button
                  onClick={() => navigate('/platform/tenants')}
                  className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition flex items-center gap-1 font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  Tenants
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

