// In-memory sliding-window rate limiter for sensitive authentication endpoints.
// Defends against brute-force password guessing, credential stuffing, and OTP flooding.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_IP_ATTEMPTS = 20; // Max login requests per IP in 15 minutes
const MAX_FAILED_ATTEMPTS = 5; // Max failed password attempts per (IP + Email) in 15 minutes

// Stores: key -> { count: number, resetAt: number }
const ipAttempts = new Map();
const failedAttempts = new Map();

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function getWindowRemainingSeconds(resetAt) {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
}

/**
 * Middleware executed before login handler. Checks if IP or account is currently throttled.
 */
export function authRateLimiter(req, res, next) {
  const now = Date.now();
  const ip = getClientIp(req);
  const email = String(req.body?.email || '').trim().toLowerCase();

  // 1. Check IP-level threshold
  const ipRecord = ipAttempts.get(ip);
  if (ipRecord && now < ipRecord.resetAt) {
    if (ipRecord.count >= MAX_IP_ATTEMPTS) {
      const retryAfter = getWindowRemainingSeconds(ipRecord.resetAt);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: `Too many login attempts from this network. Please try again after ${Math.ceil(retryAfter / 60)} minute(s).`
      });
    }
    ipRecord.count += 1;
  } else {
    ipAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  // 2. Check failed attempts for this (email + ip)
  if (email) {
    const key = `${ip}::${email}`;
    const failedRecord = failedAttempts.get(key);
    if (failedRecord && now < failedRecord.resetAt && failedRecord.count >= MAX_FAILED_ATTEMPTS) {
      const retryAfter = getWindowRemainingSeconds(failedRecord.resetAt);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: `Account temporarily locked due to 5 failed login attempts. For security reasons, please try again in ${Math.ceil(retryAfter / 60)} minute(s) or use "Forgot Password".`
      });
    }
  }

  next();
}

/**
 * Record a failed login attempt for (ip, email).
 */
export function recordFailedLogin(req, email) {
  const now = Date.now();
  const ip = getClientIp(req);
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return;

  const key = `${ip}::${cleanEmail}`;
  const record = failedAttempts.get(key);
  if (record && now < record.resetAt) {
    record.count += 1;
  } else {
    failedAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  }
}

/**
 * Reset failed attempts on successful authentication.
 */
export function resetFailedLogin(req, email) {
  const ip = getClientIp(req);
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return;

  const key = `${ip}::${cleanEmail}`;
  failedAttempts.delete(key);
}

// Garbage collection every 5 minutes to prevent memory leak
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, val] of ipAttempts.entries()) {
    if (now >= val.resetAt) ipAttempts.delete(key);
  }
  for (const [key, val] of failedAttempts.entries()) {
    if (now >= val.resetAt) failedAttempts.delete(key);
  }
}, 5 * 60 * 1000);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}
