import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/index.js';
import { signAuthToken, sanitizeProfile } from '../middleware/auth.js';

/**
 * LOCAL-ONLY developer tools: "log in as" any user to test role behaviour
 * end-to-end (the issued token carries the target user's real role, so every
 * backend permission and data-scoping rule applies exactly as in production).
 *
 * This hands out a session for ANY account without a password, so it is
 * guarded by several independent checks — all must pass:
 *   1. ENABLE_DEV_ROLE_SWITCH=true is explicitly set (never set it in prod).
 *   2. NODE_ENV is not "production".
 *   3. The TCP connection comes straight from loopback (not via a proxy:
 *      any X-Forwarded-* / X-Real-IP header is rejected, because nginx on the
 *      same box would otherwise also appear as 127.0.0.1).
 *   4. The Host header is localhost (blocks DNS-rebinding from a web page).
 * Failing requests get a plain 404 so the route is indistinguishable from
 * one that does not exist.
 */

const LOOPBACK_ADDRS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isDevRoleSwitchEnabled() {
  return process.env.ENABLE_DEV_ROLE_SWITCH === 'true' && process.env.NODE_ENV !== 'production';
}

function hostnameOf(hostHeader) {
  const host = String(hostHeader || '').toLowerCase();
  if (host.startsWith('[')) return host.slice(0, host.indexOf(']') + 1);
  return host.split(':')[0];
}

function localOnly(req, res, next) {
  const remote = req.socket?.remoteAddress;
  const proxied = Boolean(
    req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.headers['x-forwarded-host'] || req.headers.forwarded
  );

  if (!isDevRoleSwitchEnabled() || !LOOPBACK_ADDRS.has(remote) || proxied || !LOCAL_HOSTNAMES.has(hostnameOf(req.headers.host))) {
    return res.status(404).json({ error: 'Not found' });
  }
  return next();
}

const router = Router();
router.use(localOnly);

router.get('/status', (req, res) => {
  res.json({ enabled: true });
});

// Active users to switch into. Optional ?tenant_id= narrows to one company.
router.get('/users', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const params = [];
    let where = 'WHERE p.is_active IS DISTINCT FROM false';
    if (tenant_id) {
      params.push(String(tenant_id));
      where += ` AND p.tenant_id::text = $${params.length}`;
    }

    const result = await query(
      `SELECT p.id, p.full_name, p.email, p.role, p.tenant_id, r.name AS role_name, t.name AS tenant_name
       FROM profiles p
       LEFT JOIN tenants t ON p.tenant_id = t.id
       LEFT JOIN tenant_roles r ON p.role_id = r.id
       ${where}
       ORDER BY t.name NULLS FIRST, p.role, p.full_name
       LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Quick personas: one local test account per role (see PERSONAS below).
// Each is a dedicated local test account that is created on first use, so the
// buttons work even on an empty database. They also have a password, so
// you can sign in with them through the normal login form.
// ---------------------------------------------------------------------------
const DEV_PASSWORD = 'Dev@12345';
const DEV_TENANT = { name: 'Dev Test Company', slug: 'dev-test-company' };

const PERSONAS = {
  // Dummy "see every page" user: platform_admin passes every frontend route
  // guard, and it also owns an affiliate campaign so the affiliate dashboard loads.
  qa_tester: {
    label: 'QA Tester', email: 'dev.qatester@localhost.test', full_name: 'Dev QA Tester',
    employee_id: 'DEV-QA-001', role: 'platform_admin', tenant: 'platform', campaignCode: 'DEVQA100',
  },
  // Platform owner (your team).
  super_admin: {
    label: 'Super Admin', email: 'dev.superadmin@localhost.test', full_name: 'Dev Super Admin',
    employee_id: 'DEV-SA-001', role: 'platform_admin', tenant: 'platform',
  },
  // Company (tenant) roles, all in "Dev Test Company", wired into one reporting chain:
  // Tenant Admin <- Director <- Sales Manager <- Team Leader <- Employee / CRM Staff.
  tenant_admin: {
    label: 'Tenant Admin', email: 'dev.tenantadmin@localhost.test', full_name: 'Dev Tenant Admin',
    employee_id: 'DEV-TA-001', role: 'super_admin', tenant: 'dev',
  },
  admin: {
    label: 'Admin', email: 'dev.admin@localhost.test', full_name: 'Dev Admin',
    employee_id: 'DEV-AD-001', role: 'admin', tenant: 'dev', reportsTo: 'tenant_admin',
  },
  director: {
    label: 'Director', email: 'dev.director@localhost.test', full_name: 'Dev Director',
    employee_id: 'DEV-DR-001', role: 'director', tenant: 'dev', reportsTo: 'tenant_admin',
  },
  sales_manager: {
    label: 'Sales Manager', email: 'dev.salesmanager@localhost.test', full_name: 'Dev Sales Manager',
    employee_id: 'DEV-SM-001', role: 'sales_manager', tenant: 'dev', reportsTo: 'director',
  },
  team_leader: {
    label: 'Team Leader', email: 'dev.teamleader@localhost.test', full_name: 'Dev Team Leader',
    employee_id: 'DEV-TL-001', role: 'team_leader', tenant: 'dev', reportsTo: 'sales_manager',
  },
  employee: {
    label: 'Employee', email: 'dev.employee@localhost.test', full_name: 'Dev Employee',
    employee_id: 'DEV-EMP-001', role: 'sales_executive', tenant: 'dev', reportsTo: 'team_leader',
  },
  crm_staff: {
    label: 'CRM Staff', email: 'dev.crmstaff@localhost.test', full_name: 'Dev CRM Staff',
    employee_id: 'DEV-CRM-001', role: 'crm_staff', tenant: 'dev', reportsTo: 'team_leader',
  },
  accountant: {
    label: 'Accountant', email: 'dev.accountant@localhost.test', full_name: 'Dev Accountant',
    employee_id: 'DEV-AC-001', role: 'accountant', tenant: 'dev', reportsTo: 'tenant_admin',
  },
  receptionist: {
    label: 'Receptionist', email: 'dev.receptionist@localhost.test', full_name: 'Dev Receptionist',
    employee_id: 'DEV-RC-001', role: 'receptionist', tenant: 'dev', reportsTo: 'tenant_admin',
  },
  driver: {
    label: 'Driver', email: 'dev.driver@localhost.test', full_name: 'Dev Driver',
    employee_id: 'DEV-DV-001', role: 'driver', tenant: 'dev', reportsTo: 'tenant_admin',
  },
  // Affiliate partner: also gets a referral campaign so /affiliate/dashboard has data.
  affiliate: {
    label: 'Affiliate', email: 'dev.affiliate@localhost.test', full_name: 'Dev Affiliate',
    employee_id: 'DEV-AF-001', role: 'affiliate', tenant: 'platform', campaignCode: 'DEVAFF20',
  },
};

async function ensureDevTenant() {
  const result = await query(
    `INSERT INTO tenants (name, slug, settings, subscription_status, plan_tier, is_active, last_login_at)
     VALUES ($1, $2, '{"general": {"target_model": "area"}, "branding": {"primary_color": "#3B82F6"}}'::jsonb, 'active', 'enterprise', true, CURRENT_TIMESTAMP)
     ON CONFLICT (slug) DO UPDATE SET is_active = true, subscription_status = 'active'
     RETURNING id`,
    [DEV_TENANT.name, DEV_TENANT.slug]
  );
  return result.rows[0].id;
}

// Platform admins live in the platform's own tenant; reuse it if it exists.
async function platformTenantId() {
  const existing = await query(
    `SELECT tenant_id FROM profiles WHERE role = 'platform_admin' AND tenant_id IS NOT NULL ORDER BY created_at LIMIT 1`
  );
  return existing.rows[0]?.tenant_id || ensureDevTenant();
}

async function ensurePersona(key) {
  const p = PERSONAS[key];
  const tenantId = p.tenant === 'platform' ? await platformTenantId() : await ensureDevTenant();
  const managerId = p.reportsTo ? (await ensurePersona(p.reportsTo)).id : null;
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  // Upsert by email; also re-activates the account and resets its role, so a
  // persona always behaves as its button says even if someone edited it.
  await query(
    `INSERT INTO profiles (user_id, email, password_hash, full_name, employee_id, role, tenant_id, reporting_manager_id, is_active, force_password_change)
     VALUES ($1, $1, $2, $3, $4, $5, $6, $7, true, false)
     ON CONFLICT (email) DO UPDATE SET
       role = EXCLUDED.role, tenant_id = EXCLUDED.tenant_id, reporting_manager_id = EXCLUDED.reporting_manager_id,
       is_active = true, force_password_change = false, updated_at = CURRENT_TIMESTAMP`,
    [p.email, passwordHash, p.full_name, p.employee_id, p.role, tenantId, managerId]
  );

  const result = await query(
    `SELECT p.*, t.name as tenant_name, t.slug as tenant_slug, t.settings as tenant_settings, t.subscription_status
     FROM profiles p LEFT JOIN tenants t ON p.tenant_id = t.id
     WHERE p.email = $1 LIMIT 1`,
    [p.email]
  );
  const user = result.rows[0];

  if (p.campaignCode) {
    // The affiliate dashboard looks the campaign up by the session's user id (the profile's user_id).
    await query(
      `INSERT INTO referral_campaigns (tenant_id, code, name, referrer_email, referrer_commission_percent, referee_discount_percent, is_active, created_by, created_by_user_id)
       VALUES ($1, $2, $3, $4, 20, 10, true, $5, $6)
       ON CONFLICT (code) DO UPDATE SET is_active = true, created_by = EXCLUDED.created_by, created_by_user_id = EXCLUDED.created_by_user_id`,
      [tenantId, p.campaignCode, `${p.full_name} Partner Program`, p.email, user.id, user.user_id || p.email]
    );
  }
  return user;
}

router.get('/personas', (req, res) => {
  res.json({
    password: DEV_PASSWORD,
    personas: Object.entries(PERSONAS).map(([key, p]) => ({ key, label: p.label, email: p.email, role: p.role })),
  });
});

router.post('/personas/:key/login', async (req, res) => {
  try {
    const { key } = req.params;
    if (!Object.prototype.hasOwnProperty.call(PERSONAS, key)) return res.status(404).json({ error: 'Unknown persona' });

    const user = await ensurePersona(key);
    console.warn(`🧪 [dev] Issued local test session for persona ${key} (${user.email}, ${user.role})`);
    res.json({ token: signAuthToken(user), profile: sanitizeProfile(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Issue a real session token for the chosen profile.
router.post('/impersonate', async (req, res) => {
  try {
    const { profile_id } = req.body || {};
    if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

    const result = await query(
      `SELECT p.*, t.name as tenant_name, t.slug as tenant_slug, t.settings as tenant_settings, t.subscription_status
       FROM profiles p
       LEFT JOIN tenants t ON p.tenant_id = t.id
       WHERE p.id::text = $1
       LIMIT 1`,
      [String(profile_id)]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    console.warn(`🧪 [dev] Issued local test session for ${user.email} (${user.role})`);
    res.json({ token: signAuthToken(user), profile: sanitizeProfile(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
