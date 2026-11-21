// LOCAL DEV ONLY: "offline" dummy sessions that need no database or API.
//
// Picking a role in the Dev Mode switcher while the local API/database is
// unavailable stores a fake profile + company here. AuthContext then uses it
// instead of fetching the user, so every page and menu for that role opens.
// Data on the pages stays empty (the API rejects the fake token), and the
// usual "session expired -> back to login" redirect is suppressed.
//
// Every entry point is gated on `import.meta.env.DEV`, which is statically
// false in production builds, so none of this can activate there.

import type { Profile, ReferralCampaign, Tenant, TenantSettings } from '../types/database';

const OFFLINE_KEY = 'crm_dev_offline_session';
export const OFFLINE_TOKEN = 'dev-offline-session';

export interface OfflineSession {
  profile: Profile;
  tenant: Tenant | null;
  affiliate: ReferralCampaign | null;
}

export interface OfflinePersona {
  key: string;
  label: string;
  role: string;
}

export function getOfflineSession(): OfflineSession | null {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = localStorage.getItem(OFFLINE_KEY);
    return raw ? (JSON.parse(raw) as OfflineSession) : null;
  } catch {
    return null;
  }
}

export function isOfflineSession(): boolean {
  return getOfflineSession() !== null;
}

export function clearOfflineSession() {
  try {
    localStorage.removeItem(OFFLINE_KEY);
  } catch {
    // ignore
  }
}

const DEV_TENANT_ID = 'dev-offline-tenant';

function buildTenant(now: string): Tenant {
  const settings: TenantSettings = {
    features: { crm: true, inventory: true, reports: true, site_visits: true, incentives: true },
    appearance: { primary_color: '#10B981', logo_url: null },
    general: { target_model: 'area' },
    incentive_plan: { type: 'percentage', rules: {} },
  };
  return {
    id: DEV_TENANT_ID,
    _id: DEV_TENANT_ID,
    _creationTime: Date.now(),
    name: 'Dev Test Company (offline)',
    slug: 'dev-test-company',
    settings,
    subscription_status: 'active',
    plan_tier: 'enterprise',
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

export function buildOfflineSession(persona: OfflinePersona): OfflineSession {
  const now = new Date().toISOString();
  const email = `dev.${persona.key.replace(/_/g, '')}@localhost.test`;
  const id = `dev-offline-${persona.key}`;
  const profile: Profile = {
    id,
    _id: id,
    userId: email,
    _creationTime: Date.now(),
    employee_id: `DEV-${persona.key.toUpperCase()}`,
    full_name: `Dev ${persona.label}`,
    email,
    phone: '+91 90000 00000',
    role: persona.role,
    tenant_id: DEV_TENANT_ID,
    is_active: true,
    force_password_change: false,
    created_at: now,
    updated_at: now,
  };

  const affiliate: ReferralCampaign | null =
    persona.role === 'affiliate' || persona.key === 'qa_tester'
      ? {
          id: 'dev-offline-campaign',
          _id: 'dev-offline-campaign',
          _creationTime: Date.now(),
          created_at: now,
          code: 'DEVAFF20',
          name: 'Dev Affiliate Partner Program',
          created_by: id,
          referrer_commission_percent: 20,
          referee_discount_percent: 10,
          is_active: true,
        }
      : null;

  return { profile, tenant: buildTenant(now), affiliate };
}

/** Store a fake session for this role and reload into the app. */
export function startOfflineSession(persona: OfflinePersona, home = '/dashboard') {
  if (!import.meta.env.DEV) return;
  const session = buildOfflineSession(persona);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(session));
  // ProtectedRoute/AuthContext only treat you as signed in with a token + session user.
  localStorage.setItem('crm_auth_token', OFFLINE_TOKEN);
  localStorage.setItem('crm_session_user', JSON.stringify({ id: session.profile.userId, email: session.profile.email }));
  try {
    sessionStorage.removeItem('realsalepro_qa_role_override');
  } catch {
    // ignore
  }
  window.location.assign(home);
}
