import jwt from 'jsonwebtoken';

const TOKEN_TTL = process.env.JWT_TTL || '7d';
const ISSUER = 'realsalepro';
const PLATFORM_ROLES = ['platform_admin', 'super_admin'];

let warnedMissingSecret = false;

export function normalizeRole(role) {
  return String(role || '').toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * Strips sensitive authentication fields (password, password_hash) from user objects
 * before returning them to clients or storing in session payloads.
 */
export function sanitizeProfile(user) {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password;
  delete copy.password_hash;

  let roleDetails = null;
  const roleId = copy.role_id_val || copy.role_id;
  const roleName = copy.role_name || copy.role;
  let rolePermissions = copy.role_permissions || copy.permissions || {};
  if (typeof rolePermissions === 'string') {
    try {
      rolePermissions = JSON.parse(rolePermissions);
    } catch {
      rolePermissions = {};
    }
  }

  if (roleId || roleName || copy.role_permissions) {
    roleDetails = {
      id: roleId,
      name: roleName,
      description: copy.role_description || null,
      permissions: rolePermissions,
      is_system: copy.role_is_system || false,
    };
  }

  return {
    ...copy,
    _id: copy.id,
    userId: copy.user_id || copy.email,
    role_details: roleDetails,
    permissions: rolePermissions,
  };
}

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL SECURITY WARNING: JWT_SECRET is not set in production environment.');
  }

  if (!warnedMissingSecret) {
    warnedMissingSecret = true;
    console.warn(
      '⚠️  JWT_SECRET is not set — falling back to an insecure development secret. ' +
      'Set JWT_SECRET in server/.env before going live.'
    );
  }
  return 'realsalepro-insecure-development-secret';
}

export function signAuthToken(profile) {
  return jwt.sign(
    {
      sub: String(profile.id || profile._id),
      email: profile.email,
      role: normalizeRole(profile.role),
      role_id: profile.role_id || profile.role_details?.id || null,
      tenant_id: profile.tenant_id || null,
      userId: profile.user_id || profile.email,
    },
    jwtSecret(),
    { expiresIn: TOKEN_TTL, issuer: ISSUER }
  );
}

export function isPlatformRole(user) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  if (role === 'platform_admin') return true;
  const email = (user.email || '').toLowerCase().trim();
  if (email === 'admin@realsalepro.com' || email === 'admin@salespro.com') return true;
  if (!user.tenant_id && role === 'super_admin') return true;
  return false;
}

export async function getEffectivePermissions(user) {
  if (!user) return { is_admin: false };
  if (isPlatformRole(user) || normalizeRole(user.role) === 'super_admin') {
    return { is_admin: true };
  }
  try {
    const { query } = await import('../db/index.js');
    const sql = `
      SELECT r.permissions 
      FROM profiles p
      LEFT JOIN tenant_roles r ON (p.role_id = r.id OR (p.role_id IS NULL AND p.tenant_id = r.tenant_id AND LOWER(r.name) = LOWER(p.role)))
      WHERE p.id = $1
      LIMIT 1
    `;
    const res = await query(sql, [user.id]);
    const perms = res.rows[0]?.permissions;
    if (perms) {
      return typeof perms === 'string' ? JSON.parse(perms) : perms;
    }
  } catch (err) {
    console.error('getEffectivePermissions error:', err.message);
  }
  return {};
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret(), { issuer: ISSUER });
    req.user = {
      id: String(payload.sub),
      email: payload.email,
      role: normalizeRole(payload.role),
      role_id: payload.role_id || null,
      tenant_id: payload.tenant_id ? String(payload.tenant_id) : null,
      userId: payload.userId,
    };
    recordUserActivity(req.user, req.ip, req.headers['user-agent']);
    return next();
  } catch (err) {
    const expired = err?.name === 'TokenExpiredError';
    return res.status(401).json({
      error: expired ? 'Session expired, please sign in again' : 'Invalid authentication token',
    });
  }
}

// Role guard. Platform roles always pass.
export function requireRole(...roles) {
  const allowed = roles.map(normalizeRole);
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (isPlatformRole(req.user) || allowed.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'You do not have permission to perform this action' });
  };
}

// In-memory live users tracker for real-time monitoring
const liveUsersMap = new Map();
const lastDbSyncMap = new Map();

export function recordUserActivity(user, ip, userAgent) {
  if (!user || !user.email) return;
  const key = String(user.email).toLowerCase();
  const now = Date.now();
  liveUsersMap.set(key, {
    id: user.id,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id,
    ip: ip || 'client-ip',
    userAgent: userAgent ? String(userAgent).substring(0, 80) : undefined,
    lastActive: now,
  });

  // Throttle database last_login_at updates to once every 15 minutes per user/tenant
  const lastSync = lastDbSyncMap.get(key) || 0;
  if (now - lastSync > 15 * 60 * 1000) {
    lastDbSyncMap.set(key, now);
    import('../db/index.js').then(({ query }) => {
      if (user.id) {
        query('UPDATE profiles SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]).catch(() => {});
      }
      if (user.tenant_id) {
        query(`UPDATE tenants 
               SET last_login_at = CURRENT_TIMESTAMP, 
                   inactivity_warning_count = 0,
                   is_active = true,
                   deactivation_reason = NULL
               WHERE id = $1`, [user.tenant_id]).catch(() => {});
      }
    }).catch(() => {});
  }
}

export function getLiveUsersList(windowMinutes = 15) {
  const cutoff = Date.now() - (windowMinutes * 60 * 1000);
  const active = [];
  for (const [key, data] of liveUsersMap.entries()) {
    if (data.lastActive >= cutoff) {
      active.push(data);
    } else {
      liveUsersMap.delete(key);
    }
  }
  return active.sort((a, b) => b.lastActive - a.lastActive);
}

// Only the SaaS owner (platform admin) may cross tenant boundaries freely.
export function requirePlatformAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'platform_admin') {
    return res.status(403).json({ error: 'Platform admin access required' });
  }
  return next();
}

// Guard for routes that act on a specific tenant.
export function requireTenantAccess(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  const tenantId = req.params.tenantId || req.params.id || req.body?.tenant_id || req.query?.tenant_id;
  if (!tenantId || isPlatformRole(req.user) || String(tenantId) === String(req.user.tenant_id)) {
    recordUserActivity(req.user, req.ip, req.headers['user-agent']);
    return next();
  }
  return res.status(403).json({ error: 'You cannot access another organisation’s data' });
}

// Keeps every tenant-scoped request inside the caller's own tenant.
export function enforceTenantScope(req, res, next) {
  if (!req.user || isPlatformRole(req.user)) return next();

  const claimed = req.body?.tenant_id || req.query?.tenant_id;
  if (claimed && req.user.tenant_id && String(claimed) !== String(req.user.tenant_id)) {
    return res.status(403).json({ error: 'You cannot access another organisation’s data' });
  }
  return next();
}

export const authConfig = {
  tokenTtl: TOKEN_TTL,
  issuer: ISSUER,
  hasConfiguredSecret: () => Boolean(process.env.JWT_SECRET),
};
