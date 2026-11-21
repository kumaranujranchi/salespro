// LOCAL DEV ONLY — helpers for the Dev Mode role switcher.
// Only imported from DevRoleSwitcher, which is code-split behind
// `import.meta.env.DEV`, so none of this ships in production builds.

import api, { getApiBaseUrl } from './api';
import { getAuthToken, getStoredSessionUser, setAuthToken, setStoredSessionUser } from './auth-token';
import { clearOfflineSession, isOfflineSession, startOfflineSession } from './dev-offline';

const ORIGINAL_SESSION_KEY = 'crm_dev_original_session';
const QA_OVERRIDE_KEY = 'realsalepro_qa_role_override';

export interface DevUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  role_name: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
}

interface SavedSession {
  token: string | null;
  user: unknown;
  label: string;
}

export const devApi = {
  status: () => api.get<{ enabled: boolean }>('/dev/status'),
  users: (tenantId?: string) => api.get<DevUser[]>('/dev/users', tenantId ? { tenant_id: tenantId } : undefined),
  impersonate: (profileId: string) =>
    api.post<{ token: string; profile: { email: string; userId?: string; user_id?: string } }>('/dev/impersonate', {
      profile_id: profileId,
    }),
  // Plain fetch (not the shared api client): when the dev route is off the API
  // answers 401, and the shared client would treat that as "session expired"
  // and bounce to /login before we can fall back to an offline session.
  persona: async (key: PersonaKey) => {
    const res = await fetch(`${getApiBaseUrl()}/dev/personas/${key}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return (await res.json()) as { token: string; profile: { email: string; userId?: string; user_id?: string } };
  },
};

export function getOriginalSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(ORIGINAL_SESSION_KEY);
    return raw ? (JSON.parse(raw) as SavedSession) : null;
  } catch {
    return null;
  }
}

function clearRolePreview() {
  try {
    sessionStorage.removeItem(QA_OVERRIDE_KEY);
  } catch {
    // ignore
  }
}

// Full reload so every cached query refetches under the new token.
function reloadInto(path: string) {
  window.location.assign(path);
}

export type PersonaKey =
  | 'qa_tester'
  | 'super_admin'
  | 'tenant_admin'
  | 'admin'
  | 'director'
  | 'sales_manager'
  | 'team_leader'
  | 'employee'
  | 'crm_staff'
  | 'accountant'
  | 'receptionist'
  | 'driver'
  | 'affiliate';

// One local test account per role. Keys/emails must match PERSONAS in server/src/routes/dev.js.
export const PERSONAS: { key: PersonaKey; label: string; hint: string; role: string; home?: string }[] = [
  // Dummy "see everything" user: platform_admin passes every route guard, and it
  // also owns an affiliate campaign so /affiliate/dashboard renders too.
  { key: 'qa_tester', label: 'QA Tester', hint: 'Every page', role: 'platform_admin' },
  { key: 'super_admin', label: 'Super Admin', hint: 'Platform owner', role: 'platform_admin' },
  { key: 'tenant_admin', label: 'Tenant Admin', hint: 'Company owner', role: 'super_admin' },
  { key: 'admin', label: 'Admin', hint: 'Company admin', role: 'admin' },
  { key: 'director', label: 'Director', hint: 'Management', role: 'director' },
  { key: 'sales_manager', label: 'Sales Manager', hint: 'Manages teams', role: 'sales_manager' },
  { key: 'team_leader', label: 'Team Leader', hint: 'Leads a team', role: 'team_leader' },
  { key: 'employee', label: 'Employee', hint: 'Sales executive', role: 'sales_executive' },
  { key: 'crm_staff', label: 'CRM Staff', hint: 'Back office', role: 'crm_staff' },
  { key: 'accountant', label: 'Accountant', hint: 'Accounts', role: 'accountant' },
  { key: 'receptionist', label: 'Receptionist', hint: 'Front desk', role: 'receptionist' },
  { key: 'driver', label: 'Driver', hint: 'Site visits', role: 'driver' },
  { key: 'affiliate', label: 'Affiliate', hint: 'Partner portal', role: 'affiliate', home: '/affiliate/dashboard' },
];

export async function loginAsUser(target: DevUser, currentLabel: string) {
  await startSession(await devApi.impersonate(target.id), currentLabel);
}

// One-click persona login. The server creates the test account on first use.
// Falls back to an offline dummy session (no API/database) when the local
// API server or database is unavailable. Returns which mode was used.
export async function loginAsPersona(key: PersonaKey, currentLabel: string): Promise<'online' | 'offline'> {
  const persona = PERSONAS.find((p) => p.key === key);
  if (!persona) throw new Error(`Unknown persona: ${key}`);
  let session;
  try {
    session = await devApi.persona(key);
  } catch {
    loginOffline(key, currentLabel);
    return 'offline';
  }
  await startSession(session, currentLabel, persona.home);
  return 'online';
}

/** Sign in as this role with fake data in the browser only (no API / database). */
export function loginOffline(key: PersonaKey, currentLabel: string) {
  const persona = PERSONAS.find((p) => p.key === key);
  if (!persona) throw new Error(`Unknown persona: ${key}`);
  rememberOriginalSession(currentLabel);
  startOfflineSession(persona, persona.home);
}

function rememberOriginalSession(currentLabel: string) {
  // Only the first hop, so chained switches return to the account you
  // originally signed in with. An offline session is never "original".
  if (!getOriginalSession() && !isOfflineSession()) {
    const saved: SavedSession = { token: getAuthToken(), user: getStoredSessionUser(), label: currentLabel };
    localStorage.setItem(ORIGINAL_SESSION_KEY, JSON.stringify(saved));
  }
}

async function startSession(
  { token, profile }: { token: string; profile: { email: string; userId?: string; user_id?: string } },
  currentLabel: string,
  home = '/dashboard'
) {
  rememberOriginalSession(currentLabel);
  clearOfflineSession();
  clearRolePreview();
  setAuthToken(token);
  setStoredSessionUser({ id: profile.userId || profile.user_id || profile.email, email: profile.email });
  reloadInto(home);
}

export function returnToOriginalSession() {
  const original = getOriginalSession();
  localStorage.removeItem(ORIGINAL_SESSION_KEY);
  clearOfflineSession();
  clearRolePreview();

  if (original?.token) {
    setAuthToken(original.token);
    setStoredSessionUser(original.user);
    reloadInto('/dashboard');
  } else {
    setAuthToken(null);
    setStoredSessionUser(null);
    reloadInto('/login');
  }
}
