// LOCAL DEV ONLY — floating role switcher (bottom-right).
// Mounted from App.tsx behind `import.meta.env.DEV` via a lazy import, so it is
// stripped from production builds entirely.
//
// Two ways to test a role:
//  • "Log in as"   — real session for an actual user of that role. The API sees
//                    the new token, so backend permissions & data scoping apply.
//                    Needs ENABLE_DEV_ROLE_SWITCH=true on the local API server.
//  • "Preview"     — UI-only role override for the current user. Instant and
//                    needs no server setup, but the API still sees your real role.

import { useEffect, useMemo, useState } from 'react';
import {
  FlaskConical, X, LogIn, Eye, RotateCcw, Search, Loader2, Undo2, AlertTriangle, Crown, Building2, UserRound,
  ShieldCheck, Briefcase, LineChart, Users, Headphones, Calculator, ConciergeBell, Car, Handshake, ListChecks, Play,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/database';
import {
  DevUser,
  PERSONAS,
  PersonaKey,
  devApi,
  getOriginalSession,
  loginAsPersona,
  loginAsUser,
  returnToOriginalSession,
} from '../../lib/dev-session';
import { clearOfflineSession, isOfflineSession } from '../../lib/dev-offline';
import { setAuthToken, setStoredSessionUser } from '../../lib/auth-token';
import { DEV_PAGES, PageGroup, clearPageStatuses, getPageStatuses, getTourIndex, setTourIndex, useDevPagesVersion } from '../../lib/dev-pages';
import DevPageTour from './DevPageTour';
import { StatusBadge } from './DevStatusBadge';

const PERSONA_ICONS: Record<PersonaKey, typeof Crown> = {
  qa_tester: ListChecks,
  super_admin: Crown,
  tenant_admin: Building2,
  admin: ShieldCheck,
  director: Briefcase,
  sales_manager: LineChart,
  team_leader: Users,
  employee: UserRound,
  crm_staff: Headphones,
  accountant: Calculator,
  receptionist: ConciergeBell,
  driver: Car,
  affiliate: Handshake,
};

const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Platform Admin',
  super_admin: 'Super Admin',
  admin: 'Admin',
  director: 'Director',
  team_leader: 'Team Leader',
  sales_executive: 'Sales Executive',
  crm_staff: 'CRM Staff',
  accountant: 'Accountant',
  driver: 'Driver',
  receptionist: 'Receptionist',
  sales_manager: 'Sales Manager',
  affiliate: 'Affiliate',
};

const PREVIEW_ROLES = Object.keys(ROLE_LABELS) as UserRole[];
const roleLabel = (role?: string | null) => (role && ROLE_LABELS[role]) || role || 'Unknown';

type Tab = 'login' | 'preview' | 'pages';
const TAB_KEY = 'crm_dev_switcher_tab';

export default function DevRoleSwitcher() {
  const { user, profile, tenant, activeRoleOverride, setActiveRoleOverride } = useAuth();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>(() => {
    try {
      return (localStorage.getItem(TAB_KEY) as Tab) || 'login';
    } catch {
      return 'login';
    }
  });
  const [allTenants, setAllTenants] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<DevUser[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const original = getOriginalSession();
  const isImpersonating = Boolean(original);
  const offlineMode = isOfflineSession();
  const isPreviewing = Boolean(activeRoleOverride);
  const realRole = (profile as { _actual_role?: string } | null)?._actual_role || profile?.role;
  const tenantId = (tenant as { _id?: string } | null)?._id || tenant?.id || profile?.tenant_id || undefined;

  useEffect(() => {
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch {
      // ignore
    }
  }, [tab]);

  // Ctrl+Shift+D toggles, Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Load switchable users when the "Log in as" tab is shown.
  useEffect(() => {
    if (!open || tab !== 'login') return;
    let cancelled = false;
    setUsers(null);
    setLoadError(null);
    devApi
      .users(allTenants || !tenantId ? undefined : String(tenantId))
      .then((rows) => !cancelled && setUsers(rows))
      .catch((err: Error) => !cancelled && setLoadError(err.message || 'Request failed'));
    return () => {
      cancelled = true;
    };
  }, [open, tab, allTenants, tenantId]);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const groups = new Map<string, DevUser[]>();
    (users || [])
      .filter((u) => !q || [u.full_name, u.email, u.role, u.role_name, u.tenant_name].some((v) => v?.toLowerCase().includes(q)))
      .forEach((u) => {
        const key = u.role || 'unknown';
        groups.set(key, [...(groups.get(key) || []), u]);
      });
    return [...groups.entries()].sort(([a], [b]) => roleLabel(a).localeCompare(roleLabel(b)));
  }, [users, search]);

  const handleLoginAs = async (target: DevUser) => {
    setSwitchingId(target.id);
    try {
      await loginAsUser(target, profile?.full_name || profile?.email || user?.email || 'original user');
    } catch (err: unknown) {
      setLoadError((err instanceof Error && err.message) || 'Could not switch user');
      setSwitchingId(null);
    }
  };

  const [personaError, setPersonaError] = useState<string | null>(null);
  const handlePersona = async (key: PersonaKey) => {
    setSwitchingId(`persona:${key}`);
    setPersonaError(null);
    try {
      // Uses the real local test account when the API + database are up,
      // otherwise signs in offline with fake data (no database needed).
      await loginAsPersona(key, profile?.full_name || profile?.email || user?.email || 'original user');
    } catch (err: unknown) {
      setPersonaError((err instanceof Error && err.message) || 'Could not switch');
      setSwitchingId(null);
    }
  };

  const endpointMissing = loadError && /404|not found|failed to fetch|networkerror/i.test(loadError);
  const active = isImpersonating || isPreviewing;
  // Checklist results are kept per account (+ previewed role), so each persona has its own.
  const pageRoleKey = `${profile?.email || user?.email || 'signed-out'}${activeRoleOverride ? `:${activeRoleOverride}` : ''}`;

  return (
    <>
    <DevPageTour roleKey={pageRoleKey} />
    <div className="fixed bottom-20 right-20 md:bottom-6 md:right-24 z-[10000] font-sans antialiased">
      {open && (
        <div
          role="dialog"
          aria-label="Dev Mode role switcher"
          className="absolute bottom-14 right-0 w-[min(380px,calc(100vw-2rem))] max-h-[min(560px,75vh)] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold">Dev Mode</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400">
                Local only
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close Dev Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current identity */}
          <div className="px-4 py-3 text-xs border-b border-slate-200 dark:border-slate-800 space-y-2">
            {user && profile ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{profile.full_name || profile.email}</div>
                  <div className="text-slate-500 dark:text-slate-400 truncate">
                    {isPreviewing ? (
                      <>
                        Previewing <b className="text-amber-600 dark:text-amber-400">{roleLabel(activeRoleOverride)}</b> · real role{' '}
                        {roleLabel(realRole)}
                      </>
                    ) : (
                      <>
                        Signed in as {roleLabel(profile.role)}
                        {offlineMode && (
                          <span
                            title="Fake user in your browser only. No API or database, so pages show no data."
                            className="ml-1.5 px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold text-[10px] uppercase"
                          >
                            Offline
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {isPreviewing && (
                  <button
                    onClick={() => setActiveRoleOverride(null)}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
            ) : (
              <div className="text-slate-500 dark:text-slate-400">Not signed in. Pick a role below to start a session.</div>
            )}

            {offlineMode && !isImpersonating && (
              <button
                onClick={() => {
                  clearOfflineSession();
                  setAuthToken(null);
                  setStoredSessionUser(null);
                  window.location.assign('/login');
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold"
              >
                <Undo2 className="w-3.5 h-3.5" /> Leave offline session
              </button>
            )}

            {isImpersonating && (
              <button
                onClick={returnToOriginalSession}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
              >
                <Undo2 className="w-3.5 h-3.5" /> Return to {original?.label || 'original session'}
              </button>
            )}
          </div>

          {/* Quick personas */}
          <div className="px-4 pt-3 text-xs">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Quick switch</div>
            <div className="grid grid-cols-4 gap-1.5">
              {PERSONAS.map(({ key, label, hint, role }) => {
                const Icon = PERSONA_ICONS[key];
                const current = !isPreviewing && profile?.role === role;
                const busy = switchingId === `persona:${key}`;
                return (
                  <button
                    key={key}
                    disabled={switchingId !== null}
                    onClick={() => handlePersona(key)}
                    title={`Log in as ${label} (real test account if the local database is up, otherwise offline with fake data)`}
                    className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl border text-center transition disabled:opacity-60 ${
                      current
                        ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/60 hover:bg-amber-500/5'
                    }`}
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Icon className="w-4 h-4" />}
                    <span className="font-semibold leading-tight">{label}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">{hint}</span>
                  </button>
                );
              })}
            </div>
            {personaError && (
              <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300">
                {personaError}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 mx-4 mt-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            {(
              [
                ['login', 'Log in as', LogIn],
                ['preview', 'Preview', Eye],
                ['pages', 'Pages', ListChecks],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
                  tab === key ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3 text-xs">
            {tab === 'pages' ? (
              <PagesTab roleKey={pageRoleKey} onStartTour={() => setOpen(false)} />
            ) : tab === 'login' ? (
              <>
                <p className="text-slate-500 dark:text-slate-400 mb-2">
                  Real session as that user. Backend permissions and data scoping apply exactly as in production.
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name, email, role…"
                      className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  {tenantId && (
                    <label className="flex items-center gap-1 whitespace-nowrap text-slate-500 dark:text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={allTenants} onChange={(e) => setAllTenants(e.target.checked)} />
                      All companies
                    </label>
                  )}
                </div>

                {loadError ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {endpointMissing ? 'Local dev API not enabled' : 'Could not load users'}
                    </div>
                    {endpointMissing ? (
                      <div>
                        Add <code className="font-mono">ENABLE_DEV_ROLE_SWITCH=true</code> to your local <code className="font-mono">.env</code>,
                        restart <code className="font-mono">npm run server</code>, and make sure the frontend points at the local API.
                        Meanwhile, "Preview role" works without it.
                      </div>
                    ) : (
                      <div>{loadError}</div>
                    )}
                  </div>
                ) : !users ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading users…
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">No matching users.</div>
                ) : (
                  <div className="space-y-3">
                    {grouped.map(([role, list]) => (
                      <div key={role}>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                          {roleLabel(role)} · {list.length}
                        </div>
                        <div className="space-y-1">
                          {list.map((u) => {
                            const isMe = profile && String((profile as { _id?: string })._id || profile.id) === String(u.id);
                            return (
                              <button
                                key={u.id}
                                disabled={Boolean(isMe) || switchingId !== null}
                                onClick={() => handleLoginAs(u)}
                                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 hover:bg-amber-500/5 disabled:opacity-60 disabled:hover:border-slate-200 text-left"
                              >
                                <div className="min-w-0">
                                  <div className="font-medium truncate">
                                    {u.full_name || u.email}
                                    {u.role_name && <span className="ml-1 text-slate-400 font-normal">({u.role_name})</span>}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">
                                    {u.email}
                                    {allTenants && u.tenant_name ? ` · ${u.tenant_name}` : ''}
                                  </div>
                                </div>
                                {isMe ? (
                                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">You</span>
                                ) : switchingId === u.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                                ) : (
                                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-slate-500 dark:text-slate-400 mb-2">
                  Changes only the UI (menus, dashboards, masking). The API still sees your real role, so data shown may not match.
                </p>
                {!user ? (
                  <div className="py-6 text-center text-slate-400">Sign in first to preview roles.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {PREVIEW_ROLES.map((role) => {
                      const selected = (activeRoleOverride || realRole) === role;
                      return (
                        <button
                          key={role}
                          onClick={() => setActiveRoleOverride(role === realRole ? null : role)}
                          className={`px-2.5 py-2 rounded-lg border text-left font-medium transition ${
                            selected
                              ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {roleLabel(role)}
                          {role === realRole && <span className="block text-[10px] text-slate-400 font-normal">your real role</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
            Ctrl+Shift+D to toggle · Not included in production builds
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title={`Dev Mode${profile ? ` · ${roleLabel(profile.role)}` : ''} (Ctrl+Shift+D)`}
        aria-label="Toggle Dev Mode role switcher"
        aria-expanded={open}
        className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-2xl hover:scale-110 hover:shadow-amber-300/30 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/40"
      >
        {open ? (
          <X size={22} className="rotate-90 transition-transform duration-200" />
        ) : (
          <FlaskConical size={22} />
        )}
        {active && !open && (
          // Small dot = you're switched into another user / previewing a role.
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-white dark:border-slate-900" />
        )}
      </button>
    </div>
    </>
  );
}

const GROUPS: PageGroup[] = ['App', 'Platform', 'Affiliate', 'Public'];

function PagesTab({ roleKey, onStartTour }: { roleKey: string; onStartTour: () => void }) {
  useDevPagesVersion();
  const statuses = getPageStatuses(roleKey);
  const touring = getTourIndex() !== null;
  const counts = { ok: 0, blocked: 0, broken: 0 };
  Object.values(statuses).forEach((s) => counts[s]++);

  const startAt = (i: number) => {
    setTourIndex(i);
    onStartTour();
  };
  const firstUnchecked = DEV_PAGES.findIndex((p) => !statuses[p.path]);

  return (
    <>
      <p className="text-slate-500 dark:text-slate-400 mb-2">
        Every page in the app. The tour visits each one in turn and marks it <b>ok</b>, <b>blocked</b> (redirected) or{' '}
        <b>broken</b> (runtime error). Use the <b>QA Tester</b> persona to open them all.
      </p>
      <div className="flex items-center gap-1.5 mb-3">
        <button
          onClick={() => startAt(firstUnchecked === -1 ? 0 : firstUnchecked)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
        >
          <Play className="w-3.5 h-3.5" /> {touring ? 'Restart from next unchecked' : firstUnchecked > 0 ? 'Resume tour' : 'Start tour'}
        </button>
        <button
          onClick={() => clearPageStatuses(roleKey)}
          title="Clear results for this account"
          className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-2 mb-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span>{Object.keys(statuses).length}/{DEV_PAGES.length} checked</span>
        <span className="text-emerald-600 dark:text-emerald-400">{counts.ok} ok</span>
        <span>{counts.blocked} blocked</span>
        <span className="text-rose-600 dark:text-rose-400">{counts.broken} broken</span>
      </div>
      <div className="space-y-3">
        {GROUPS.map((group) => (
          <div key={group}>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{group}</div>
            <div className="space-y-0.5">
              {DEV_PAGES.map((p, i) =>
                p.group !== group ? null : (
                  <div key={p.path} className="flex items-center gap-1.5 group">
                    <button
                      onClick={() => startAt(i)}
                      title={p.access ? `Access: ${p.access}` : 'Open in tour'}
                      className="flex-1 min-w-0 flex items-center justify-between gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{p.label}</span>{' '}
                        <span className="font-mono text-[10px] text-slate-400">{p.path}</span>
                      </span>
                      <StatusBadge status={statuses[p.path]} />
                    </button>
                    <a
                      href={p.path}
                      target="_blank"
                      rel="noreferrer"
                      title="Open in new tab"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
