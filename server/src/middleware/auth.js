import jwt from 'jsonwebtoken';

const TOKEN_TTL = process.env.JWT_TTL || '7d';
const ISSUER = 'realsalepro';
const PLATFORM_ROLES = ['platform_admin', 'super_admin'];

let warnedMissingSecret = false;

export function normalizeRole(role) {
  return String(role || '').toLowerCase().replace(/[\s-]+/g, '_');
}

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

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
      tenant_id: profile.tenant_id || null,
      userId: profile.user_id || profile.email,
    },
    jwtSecret(),
    { expiresIn: TOKEN_TTL, issuer: ISSUER }
  );
}

export function isPlatformRole(user) {
  return !!user && PLATFORM_ROLES.includes(normalizeRole(user.role));
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
      tenant_id: payload.tenant_id ? String(payload.tenant_id) : null,
      userId: payload.userId,
    };
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
