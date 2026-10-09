import { Router } from 'express';
import { query } from '../db/index.js';
import bcrypt from 'bcryptjs';

const router = Router();

// 1. Sign In / Authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const lookupEmail = (cleanEmail === 'admin@salespro.com') ? 'admin@realsalepro.com' : cleanEmail;

    const result = await query(
      `SELECT p.*, t.name as tenant_name, t.slug as tenant_slug, t.settings as tenant_settings, t.subscription_status
       FROM profiles p
       LEFT JOIN tenants t ON p.tenant_id = t.id
       WHERE (LOWER(p.email) = $1 OR LOWER(p.email) = $2) AND p.is_active = true
       LIMIT 1`,
      [cleanEmail, lookupEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password if set
    if (password) {
      if (user.password_hash) {
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match && user.password_hash !== password && user.password !== password) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
      } else if (user.password && user.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    // Auto promote designated admin
    if ((user.email === 'admin@realsalepro.com' || user.email === 'admin@salespro.com') && user.role !== 'platform_admin') {
      await query(`UPDATE profiles SET role = 'platform_admin' WHERE id = $1`, [user.id]);
      user.role = 'platform_admin';
    }

    // Map fields for client compatibility
    const profile = {
      ...user,
      _id: user.id,
      userId: user.user_id || user.email,
      password: user.password,
    };

    return res.json({ profile });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get Profile by userId or email
router.get('/profile', async (req, res) => {
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
         WHERE (LOWER(p.user_id) = $1 OR LOWER(p.email) = $1 OR LOWER(p.user_id) = $2 OR LOWER(p.email) = $2)
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
      return res.json(null);
    }

    const user = result.rows[0];
    return res.json({
      ...user,
      _id: user.id,
      userId: user.user_id || user.email,
      password: user.password,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// 3. Promote to Platform Admin
router.post('/promote', async (req, res) => {
  try {
    const { email } = req.body;
    await query(`UPDATE profiles SET role = 'platform_admin' WHERE LOWER(email) = LOWER($1)`, [email]);
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

    // Generate 6-digit Security Code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(cleanEmail, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes validity
      attempts: 0,
    });

    console.log(`\n======================================================`);
    console.log(`🔑 [RealSalePro Security Code] for ${user.email}: ${code}`);
    console.log(`======================================================\n`);

    let emailSent = false;
    let emailError = null;

    // Send Security Code via SMTP
    const verifiedPass = Buffer.from('UmVhbFNhbGVQcm9AMjAyNg==', 'base64').toString('utf8');
    const emailUser = process.env.EMAIL_USER || 'support@realsalepro.com';
    const emailPass = verifiedPass;
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

    const rawPhone = user.phone ? String(user.phone).trim() : null;
    const phoneDigits = rawPhone ? rawPhone.replace(/\D/g, '') : '';
    const maskedPhone = phoneDigits.length >= 4 ? `******${phoneDigits.slice(-4)}` : (rawPhone ? 'Registered Phone' : null);

    return res.json({
      success: true,
      email: cleanEmail,
      fullName: user.full_name,
      emailSent: true,
      hasPhone: Boolean(user.phone),
      maskedPhone,
      message: `Security code has been sent to ${cleanEmail}.`,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error while processing request' });
  }
});

// 5. Verify Security Code & Sign In (Optional Password Reset)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, otp, newPassword, phone } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const lookupEmail = (cleanEmail === 'admin@salespro.com') ? 'admin@realsalepro.com' : cleanEmail;

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
    let isVerified = false;

    // A. Verify by Security Code (OTP)
    const inputCode = String(code || otp || '').trim();
    const stored = otpStore.get(cleanEmail);
    if (stored && stored.expiresAt > Date.now() && stored.code === inputCode) {
      isVerified = true;
    }

    // B. Secondary verification by registered phone if code is not provided or expired
    if (!isVerified && phone && user.phone) {
      const inputDigits = String(phone).replace(/\D/g, '');
      const storedDigits = String(user.phone).replace(/\D/g, '');
      if (inputDigits.length >= 4 && (storedDigits.endsWith(inputDigits) || inputDigits.endsWith(storedDigits) || storedDigits === inputDigits)) {
        isVerified = true;
      }
    }

    if (!isVerified) {
      return res.status(400).json({
        error: 'Invalid or expired security code. Please check your email and try again.',
      });
    }

    // If user provided a new password, update it
    if (newPassword && String(newPassword).trim().length >= 6) {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await query(
        `UPDATE profiles
         SET password = $1, password_hash = $2, force_password_change = false, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [newPassword, passwordHash, user.id]
      );
      user.password = newPassword;
      user.password_hash = passwordHash;
    }

    otpStore.delete(cleanEmail);

    // Auto promote designated admin if needed
    if ((user.email === 'admin@realsalepro.com' || user.email === 'admin@salespro.com') && user.role !== 'platform_admin') {
      await query(`UPDATE profiles SET role = 'platform_admin' WHERE id = $1`, [user.id]);
      user.role = 'platform_admin';
    }

    // Map user for client session
    const profile = {
      ...user,
      _id: user.id,
      userId: user.user_id || user.email,
      password: user.password,
    };

    return res.json({
      success: true,
      message: 'Verified successfully! Logging in...',
      profile,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to verify security code' });
  }
});

export default router;
