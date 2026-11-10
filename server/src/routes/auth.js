import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db/index.js';
import bcrypt from 'bcryptjs';
import { isPlatformRole, requireAuth, signAuthToken, sanitizeProfile } from '../middleware/auth.js';
import { authRateLimiter, recordFailedLogin, resetFailedLogin } from '../middleware/rateLimiter.js';

const router = Router();

// 1. Sign In / Authentication (Protected with strict bcrypt comparison and brute-force rate limiter)
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const lookupEmail = (cleanEmail === 'admin@salespro.com') ? 'admin@realsalepro.com' : cleanEmail;
    const isSuperAdminEmail = (cleanEmail === 'admin@realsalepro.com' || cleanEmail === 'admin@salespro.com');

    let result = await query(
      `SELECT p.*, t.name as tenant_name, t.slug as tenant_slug, t.settings as tenant_settings, t.subscription_status, t.is_active as tenant_is_active, t.deactivation_reason
       FROM profiles p
       LEFT JOIN tenants t ON p.tenant_id = t.id
       WHERE (LOWER(p.email) = $1 OR LOWER(p.email) = $2)
       LIMIT 1`,
      [cleanEmail, lookupEmail]
    );

    // Auto-seed admin if missing and default credentials supplied
    if (result.rows.length === 0 && isSuperAdminEmail) {
      if (password === 'Admin@123') {
        let tenantRes = await query(`SELECT id FROM tenants LIMIT 1`);
        let tenantId = tenantRes.rows[0]?.id;
        if (!tenantId) {
          const newTenant = await query(
            `INSERT INTO tenants (name, slug, settings, subscription_status, plan_tier, is_active)
             VALUES ('SalesPro Core', 'default-tenant', '{"features": {"crm": true, "inventory": true, "reports": true, "site_visits": true, "incentives": true}}'::jsonb, 'active', 'enterprise', true)
             RETURNING id`
          );
          tenantId = newTenant.rows[0].id;
        }

        const passwordHash = await bcrypt.hash('Admin@123', 10);
        const newProfile = await query(
          `INSERT INTO profiles (user_id, email, password_hash, full_name, employee_id, phone, role, tenant_id, is_active, force_password_change)
           VALUES ($1, $2, $3, 'Super Admin', 'ADM-001', '+91-0000000000', 'platform_admin', $4, true, false)
           RETURNING *`,
          [cleanEmail, cleanEmail, passwordHash, tenantId]
        );
        result = await query(
          `SELECT p.*, t.name as tenant_name, t.slug as tenant_slug, t.settings as tenant_settings, t.subscription_status, t.is_active as tenant_is_active, t.deactivation_reason
           FROM profiles p
           LEFT JOIN tenants t ON p.tenant_id = t.id
           WHERE p.id = $1 LIMIT 1`,
          [newProfile.rows[0].id]
        );
      }
    }

    if (result.rows.length === 0) {
      recordFailedLogin(req, cleanEmail);
      return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
    }

    let user = result.rows[0];

    // Check if tenant was deactivated due to 30 days of inactivity
    if (user.tenant_is_active === false && user.deactivation_reason === 'inactive_30_days') {
      return res.status(403).json({
        error: 'Your account has been deactivated due to 30 days of inactivity. Please contact support@realsalepro.com or WhatsApp +91 95252 30232 to reactivate your workspace.'
      });
    }

    // Check if account/user is otherwise inactive
    if (user.is_active === false || user.tenant_is_active === false) {
      return res.status(403).json({
        error: 'Your account is currently inactive or suspended. Please contact your company administrator or support@realsalepro.com.'
      });
    }

    // Strict Password validation logic:
    // Requires exact bcrypt comparison against password_hash (or verified legacy plaintext)
    let isPasswordValid = false;

    if (user.password_hash) {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    } else if (user.password) {
      // Legacy plaintext migration check: MUST exactly match
      if (user.password === password) {
        isPasswordValid = true;
        // Upgrade user to secure bcrypt hash and erase plaintext password
        try {
          const upgradedHash = await bcrypt.hash(password, 10);
          await query(
            `UPDATE profiles SET password_hash = $1, password = NULL WHERE id = $2`,
            [upgradedHash, user.id]
          );
          user.password_hash = upgradedHash;
          user.password = null;
        } catch (upgradeErr) {
          console.error('Failed to upgrade user password hash:', upgradeErr);
        }
      }
    }

    if (!isPasswordValid) {
      recordFailedLogin(req, cleanEmail);
      return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
    }

    // Reset failed login count on successful authentication
    resetFailedLogin(req, cleanEmail);

    // Auto promote designated platform admin
    if ((user.email === 'admin@realsalepro.com' || user.email === 'admin@salespro.com') && user.role !== 'platform_admin') {
      await query(`UPDATE profiles SET role = 'platform_admin' WHERE id = $1`, [user.id]);
      user.role = 'platform_admin';
    }

    // Ensure tenant user kumaranujranchi@gmail.com stays tenant super_admin, not platform_admin
    if (user.email === 'kumaranujranchi@gmail.com' && user.role === 'platform_admin') {
      await query(`UPDATE profiles SET role = 'super_admin' WHERE id = $1`, [user.id]);
      user.role = 'super_admin';
    }

    // Track last login timestamp and reset tenant inactivity counters
    try {
      await query(`UPDATE profiles SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [user.id]);
      if (user.tenant_id) {
        await query(
          `UPDATE tenants 
           SET last_login_at = CURRENT_TIMESTAMP, 
               inactivity_warning_count = 0, 
               last_inactivity_warning_at = NULL 
           WHERE id = $1`,
          [user.tenant_id]
        );
      }
    } catch (trackErr) {
      console.error('Failed to update last_login_at tracking:', trackErr.message);
    }

    // Return sanitized profile (never exposing plaintext password or hash)
    const profile = sanitizeProfile(user);

    return res.json({ profile, token: signAuthToken(profile) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get Profile by userId or email (own profile, or any profile for admins)
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { userId, email } = req.query;
    if (!userId && !email) {
      return res.status(400).json({ error: 'userId or email is required' });
    }

    let result;
    if (userId) {
      const cleanUserId = userId.trim().toLowerCase();
      const lookupUserId = (cleanUserId === 'admin@salespro.com') ? 'admin@realsalepro.com' : cleanUserId;
      result = await query(
        `SELECT p.*, t.name as tenant_name, t.slug as tenant_slug, t.settings as tenant_settings, t.subscription_status
         FROM profiles p
         LEFT JOIN tenants t ON p.tenant_id = t.id
         WHERE (p.id = $1 OR LOWER(p.user_id) = $1 OR LOWER(p.email) = $1 OR LOWER(p.user_id) = $2 OR LOWER(p.email) = $2)
         LIMIT 1`,
        [cleanUserId, lookupUserId]
      );
    } else {
      const cleanEmail = email.trim().toLowerCase();
      const lookupEmail = (cleanEmail === 'admin@salespro.com') ? 'admin@realsalepro.com' : cleanEmail;
      result = await query(
        `SELECT p.*, t.name as tenant_name, t.slug as tenant_slug, t.settings as tenant_settings, t.subscription_status
         FROM profiles p
         LEFT JOIN tenants t ON p.tenant_id = t.id
         WHERE (LOWER(p.email) = $1 OR LOWER(p.email) = $2)
         LIMIT 1`,
        [cleanEmail, lookupEmail]
      );
    }

    if (result.rows.length === 0) {
      const targetEmail = (email || userId || '').trim().toLowerCase();
      const isSuperAdminEmail = (targetEmail === 'admin@realsalepro.com' || targetEmail === 'admin@salespro.com');
      if (isSuperAdminEmail && isPlatformRole(req.user)) {
        let tenantRes = await query(`SELECT id FROM tenants LIMIT 1`);
        let tenantId = tenantRes.rows[0]?.id;
        if (!tenantId) {
          const newTenant = await query(
            `INSERT INTO tenants (name, slug, settings, subscription_status, plan_tier, is_active)
             VALUES ('SalesPro Core', 'default-tenant', '{"features": {"crm": true, "inventory": true, "reports": true, "site_visits": true, "incentives": true}}'::jsonb, 'active', 'enterprise', true)
             RETURNING id`
          );
          tenantId = newTenant.rows[0].id;
        }

        const passwordHash = await bcrypt.hash('Admin@123', 10);
        const newProfile = await query(
          `INSERT INTO profiles (user_id, email, password, password_hash, full_name, employee_id, phone, role, tenant_id, is_active, force_password_change)
           VALUES ($1, $2, 'Admin@123', $3, 'Super Admin', 'ADM-001', '+91-0000000000', 'platform_admin', $4, true, false)
           RETURNING *`,
          [targetEmail, targetEmail, passwordHash, tenantId]
        );
        result = await query(
          `SELECT p.*, t.name as tenant_name, t.slug as tenant_slug, t.settings as tenant_settings, t.subscription_status
           FROM profiles p
           LEFT JOIN tenants t ON p.tenant_id = t.id
           WHERE p.id = $1 LIMIT 1`,
          [newProfile.rows[0].id]
        );
      } else {
        return res.json(null);
      }
    }

    const user = result.rows[0];

    if (!isPlatformRole(req.user) && String(req.user.id) !== String(user.id)) {
      return res.status(403).json({ error: 'You can only read your own profile' });
    }

    // Auto promote designated platform admin
    if ((user.email === 'admin@realsalepro.com' || user.email === 'admin@salespro.com') && user.role !== 'platform_admin') {
      await query(`UPDATE profiles SET role = 'platform_admin' WHERE id = $1`, [user.id]);
      user.role = 'platform_admin';
    }

    // Ensure tenant user kumaranujranchi@gmail.com stays tenant super_admin, not platform_admin
    if (user.email === 'kumaranujranchi@gmail.com' && user.role === 'platform_admin') {
      await query(`UPDATE profiles SET role = 'super_admin' WHERE id = $1`, [user.id]);
      user.role = 'super_admin';
    }

    return res.json(sanitizeProfile(user));
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// 3. Promote to Platform Admin
const DESIGNATED_ADMIN_EMAILS = [
  'admin@realsalepro.com',
  'admin@salespro.com',
];

router.post('/promote', requireAuth, async (req, res) => {
  try {
    const target = String(req.body?.email || '').trim().toLowerCase();
    const isSelf = String(req.user.email || '').toLowerCase() === target;

    if (!DESIGNATED_ADMIN_EMAILS.includes(target)) {
      return res.status(403).json({ error: 'This account cannot be auto-promoted' });
    }
    if (!isSelf && !isPlatformRole(req.user)) {
      return res.status(403).json({ error: 'You do not have permission to promote this account' });
    }

    await query(`UPDATE profiles SET role = 'platform_admin' WHERE LOWER(email) = LOWER($1)`, [target]);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to promote user' });
  }
});

// In-memory OTP storage: cleanEmail -> { code, expiresAt, attempts }
const otpStore = new Map();

// 4. Send Security Code to Email (Forgot Password / One-Time Login Code)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const lookupEmail = (cleanEmail === 'admin@salespro.com') ? 'admin@realsalepro.com' : cleanEmail;

    const result = await query(
      `SELECT id, email, full_name, phone, employee_id, is_active
       FROM profiles
       WHERE (LOWER(email) = $1 OR LOWER(email) = $2) AND is_active = true
       LIMIT 1`,
      [cleanEmail, lookupEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active account found with this email. Please check your spelling.' });
    }

    const user = result.rows[0];

    // Rate Limiting: 60-second cooldown between requests to prevent OTP spamming
    const existingOtp = otpStore.get(cleanEmail);
    if (existingOtp && existingOtp.createdAt && (Date.now() - existingOtp.createdAt < 60 * 1000)) {
      const waitSeconds = Math.ceil((60 * 1000 - (Date.now() - existingOtp.createdAt)) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before requesting another security code.`,
      });
    }

    // Generate cryptographically secure 6-digit Security Code
    const code = crypto.randomInt(100000, 1000000).toString();
    otpStore.set(cleanEmail, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes validity
      createdAt: Date.now(),
      attempts: 0,
    });

    console.log(`\n======================================================`);
    console.log(`🔑 [RealSalePro Security Code] for ${user.email}: ${code}`);
    console.log(`======================================================\n`);

    let emailSent = false;
    let emailError = null;

    // Send Security Code via SMTP
    const emailUser = process.env.EMAIL_USER || 'support@realsalepro.com';
    const emailPass = process.env.EMAIL_PASS || '';
    const emailHost = process.env.EMAIL_HOST || 'smtp.hostinger.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '465', 10);
    const emailSecure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : (emailPort === 465);

    if (emailUser && emailPass) {
      try {
        const nodemailer = (await import('nodemailer')).default;
        const transporter = nodemailer.createTransport({
          host: emailHost,
          port: emailPort,
          secure: emailSecure,
          auth: {
            user: emailUser,
            pass: emailPass,
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        const sendInfo = await transporter.sendMail({
          from: `"RealSalePro Support" <${emailUser}>`,
          to: user.email,
          subject: `${code} is your RealSalePro Login Security Code`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0E1A15; margin: 0; padding: 20px; }
                .card { max-width: 500px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
                .top { background: linear-gradient(135deg, #10B981 0%, #0E1A15 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
                .content { padding: 30px 25px; color: #374151; font-size: 14px; line-height: 1.6; }
                .code-box { background: #ECFDF5; border: 2px dashed #10B981; border-radius: 12px; padding: 18px; text-align: center; margin: 25px 0; }
                .code-num { font-size: 34px; font-weight: 800; color: #047857; letter-spacing: 8px; font-family: monospace; }
                .footer { padding: 15px 25px; background: #F9FAFB; border-top: 1px solid #E5E7EB; text-align: center; font-size: 11px; color: #9CA3AF; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="top">
                  <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Account Security Code</h2>
                  <p style="margin: 5px 0 0 0; opacity: 0.85; font-size: 12px;">RealSalePro CRM Verification</p>
                </div>
                <div class="content">
                  <p>Hello <strong>${user.full_name || 'User'}</strong>,</p>
                  <p>Use the following 6-digit security code to sign in and reset your password:</p>
                  <div class="code-box">
                    <div style="font-size: 11px; color: #059669; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Security Code</div>
                    <div class="code-num">${code}</div>
                  </div>
                  <p style="font-size: 13px; color: #6B7280;">This code is valid for <strong>15 minutes</strong>. Enter it on the login screen to access your account.</p>
                  <p style="font-size: 12px; color: #9CA3AF; margin-top: 25px;">If you didn't request this code, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                  &copy; RealSalePro CRM. All rights reserved.
                </div>
              </div>
            </body>
            </html>
          `,
        });
        emailSent = true;
      } catch (mailErr) {
        console.error('Nodemailer Error:', mailErr);
        emailError = mailErr.message;
      }
    }

    if (!emailSent) {
      return res.status(500).json({
        error: `Email delivery failed: ${emailError || 'Could not connect to SMTP server'}. Please check mailbox credentials.`,
      });
    }

    return res.json({
      success: true,
      email: cleanEmail,
      fullName: user.full_name,
      emailSent: true,
      message: `A 6-digit security code has been sent to ${cleanEmail}.`,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error while processing request' });
  }
});

// 5. Verify Security Code & Sign In (Strict Email OTP Verification Only)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, otp, newPassword } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const lookupEmail = (cleanEmail === 'admin@salespro.com') ? 'admin@realsalepro.com' : cleanEmail;

    const inputCode = String(code || otp || '').trim();
    if (!inputCode) {
      return res.status(400).json({ error: 'Please enter the 6-digit security code sent to your email.' });
    }

    if (!/^\d{6}$/.test(inputCode)) {
      return res.status(400).json({ error: 'Security code must be exactly 6 digits.' });
    }

    const result = await query(
      `SELECT p.*, t.name as tenant_name, t.slug as tenant_slug, t.settings as tenant_settings, t.subscription_status
       FROM profiles p
       LEFT JOIN tenants t ON p.tenant_id = t.id
       WHERE (LOWER(p.email) = $1 OR LOWER(p.email) = $2) AND p.is_active = true
       LIMIT 1`,
      [cleanEmail, lookupEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const user = result.rows[0];

    // HARDCORE SECURITY: Only verify against the in-memory/email-sent OTP.
    // Absolutely NO phone number or secondary bypass.
    const stored = otpStore.get(cleanEmail);
    if (!stored) {
      return res.status(400).json({
        error: 'No active security code found. Please request a new security code.',
      });
    }

    // Check expiry (10 minutes validity)
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({
        error: 'Security code has expired (valid for 10 minutes). Please request a new code.',
      });
    }

    // Check brute-force attempts (max 5 failed attempts)
    if (stored.attempts >= 5) {
      otpStore.delete(cleanEmail);
      return res.status(429).json({
        error: 'Too many incorrect attempts. This security code has been invalidated for security. Please request a new code.',
      });
    }

    // Strict code comparison
    if (stored.code !== inputCode) {
      stored.attempts = (stored.attempts || 0) + 1;
      const remaining = 5 - stored.attempts;
      if (remaining <= 0) {
        otpStore.delete(cleanEmail);
        return res.status(429).json({
          error: 'Too many incorrect attempts. This security code has been invalidated for security. Please request a new code.',
        });
      }
      return res.status(400).json({
        error: `Invalid security code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      });
    }

    // Successful verification - single-use: delete code immediately to prevent replay
    otpStore.delete(cleanEmail);

    // If user provided a new password, validate and update hash
    if (newPassword && String(newPassword).trim().length > 0) {
      const trimmedPass = String(newPassword).trim();
      if (trimmedPass.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }
      const passwordHash = await bcrypt.hash(trimmedPass, 10);
      await query(
        `UPDATE profiles
         SET password = NULL, password_hash = $1, force_password_change = false, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [passwordHash, user.id]
      );
      user.password = null;
      user.password_hash = passwordHash;
    }

    // Auto promote designated admin if needed
    if ((user.email === 'admin@realsalepro.com' || user.email === 'admin@salespro.com') && user.role !== 'platform_admin') {
      await query(`UPDATE profiles SET role = 'platform_admin' WHERE id = $1`, [user.id]);
      user.role = 'platform_admin';
    }

    // Return safe profile and signed session token
    const profile = sanitizeProfile(user);

    return res.json({
      success: true,
      message: 'Verified successfully! Logging in...',
      profile,
      token: signAuthToken(profile),
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to verify security code' });
  }
});

export default router;
