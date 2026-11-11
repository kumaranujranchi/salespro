import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { query } from '../db/index.js';

// Hostinger SMTP configuration via environment variables
const EMAIL_USER = process.env.EMAIL_USER || 'support@realsalepro.com';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.hostinger.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '465', 10);
const EMAIL_SECURE = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : (EMAIL_PORT === 465);

let schemaInitialized = false;

/**
 * Ensure database schema has required columns for inactivity tracking.
 * Safe, idempotent and runs once on startup.
 */
export async function initInactivitySchema() {
  if (schemaInitialized) return;
  try {
    await query(`
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS inactivity_warning_count INT DEFAULT 0;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_inactivity_warning_at TIMESTAMPTZ;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS inactivity_deactivated_at TIMESTAMPTZ;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deactivation_reason VARCHAR(100);

      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS temp_login_password VARCHAR(255);
    `);
    schemaInitialized = true;
    console.log('✔ Inactivity tracking schema verified on PostgreSQL.');
  } catch (err) {
    console.error('Warning: Error initializing inactivity schema columns:', err.message);
  }
}

/**
 * Get or generate a workable login password for the admin profile.
 * Guarantees the admin always receives a password they can immediately log in with.
 */
export async function getOrGenerateLoginPassword(profile) {
  if (!profile) return 'Admin@123';

  // 1. If explicit temp/initial password exists, use it
  if (profile.temp_login_password && typeof profile.temp_login_password === 'string' && profile.temp_login_password.trim()) {
    return profile.temp_login_password.trim();
  }

  // 2. If legacy plaintext password exists, use it
  if (profile.password && typeof profile.password === 'string' && profile.password.trim()) {
    return profile.password.trim();
  }

  // 3. Otherwise generate a fresh secure temporary password, update hash and return it
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const tempPass = `Rsp@${randomSuffix}`;
  try {
    const passwordHash = await bcrypt.hash(tempPass, 10);
    await query(
      `UPDATE profiles SET password_hash = $1, temp_login_password = $2 WHERE id = $3`,
      [passwordHash, tempPass, profile.id]
    );
    return tempPass;
  } catch (err) {
    console.error(`Error updating temporary password for profile ${profile.id}:`, err);
    return 'Admin@123';
  }
}

/**
 * Dispatch automated inactivity notification email.
 */
export async function sendInactivityEmail({
  adminEmail,
  adminName,
  companyName,
  inactiveDays,
  daysRemaining,
  warningNumber, // 1, 2, 3 or 'deactivated'
  loginPassword,
  loginUrl = 'https://realsalepro.com/login'
}) {
  if (!adminEmail) {
    console.warn('[Inactivity Email] Skipping: No admin email provided');
    return { success: false, reason: 'No admin email' };
  }

  const directLoginUrl = `${loginUrl}?email=${encodeURIComponent(adminEmail)}`;
  let subject = '';
  let badgeText = '';
  let badgeColor = '';
  let mainHeading = '';
  let urgencyMessage = '';

  if (warningNumber === 1) {
    subject = `⚠️ Action Required: You haven't used your RealSalePro account in ${inactiveDays} days`;
    badgeText = `Notice 1 of 3 • Inactive for ${inactiveDays} Days`;
    badgeColor = '#3B82F6'; // Blue
    mainHeading = `Keep Your RealSalePro Workspace Active`;
    urgencyMessage = `We noticed you haven't logged into your RealSalePro workspace for <strong>${companyName}</strong> in the last <strong>${inactiveDays} days</strong>. If left unused, your account is scheduled for automated deactivation in <strong>${daysRemaining} days</strong>.`;
  } else if (warningNumber === 2) {
    subject = `⏳ 2nd Notice: ${daysRemaining} days until your RealSalePro account is deactivated (Inactive for ${inactiveDays} days)`;
    badgeText = `Notice 2 of 3 • ${daysRemaining} Days Left`;
    badgeColor = '#F59E0B'; // Amber
    mainHeading = `Your Workspace Will Be Deactivated Soon`;
    urgencyMessage = `This is your second reminder. Your workspace <strong>${companyName}</strong> has been inactive for <strong>${inactiveDays} days</strong>. In <strong>${daysRemaining} days</strong>, your account and lead management pipeline will be automatically deactivated.`;
  } else if (warningNumber === 3) {
    subject = `🚨 FINAL NOTICE: Your RealSalePro account will be deactivated in 48 hours`;
    badgeText = `Final Notice • 48 Hours Remaining`;
    badgeColor = '#EF4444'; // Red
    mainHeading = `Final 48-Hour Notice Before Deactivation`;
    urgencyMessage = `This is your final notice. Your workspace <strong>${companyName}</strong> has been inactive for <strong>${inactiveDays} days</strong>. In <strong>48 hours</strong>, your workspace will be deactivated automatically. Log in now to cancel deactivation and keep all your leads safe.`;
  } else {
    // Deactivated Notice
    subject = `Your RealSalePro account for ${companyName} has been deactivated due to 30 days of inactivity`;
    badgeText = `Account Deactivated`;
    badgeColor = '#6B7280'; // Slate
    mainHeading = `Account Deactivated Due to Inactivity`;
    urgencyMessage = `Your workspace <strong>${companyName}</strong> has been automatically deactivated because it was not accessed for <strong>${inactiveDays} days</strong>. Your pipeline data is safely archived. If you wish to reactivate your workspace, please reach out to our support team.`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #04120C; margin: 0; padding: 24px; color: #1E293B; }
        .wrapper { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.25); }
        .header { background: #071E13; padding: 36px 30px; text-align: center; border-bottom: 2px solid #00E576; }
        .brand { font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; }
        .brand span { color: #00E576; }
        .tagline { color: #94A3B8; font-size: 13px; margin-top: 6px; }
        .content { padding: 32px 30px; }
        .badge { display: inline-block; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; color: #ffffff; background-color: ${badgeColor}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
        h1 { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 14px 0; line-height: 1.3; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; }
        
        .credentials-box { background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 20px; margin: 24px 0; }
        .credentials-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748B; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
        .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
        .cred-row:last-child { border-bottom: none; padding-bottom: 0; }
        .cred-label { color: #64748B; font-weight: 500; }
        .cred-val { color: #0F172A; font-weight: 700; font-family: monospace; font-size: 14px; }
        .password-highlight { background: #FEF3C7; color: #B45309; padding: 3px 8px; border-radius: 6px; font-weight: 800; }
        
        .cta-container { text-align: center; margin: 28px 0 16px 0; }
        .cta-btn { display: inline-block; background: #00E576; color: #04120C !important; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 6px 20px rgba(0, 229, 118, 0.35); }
        .cta-btn:hover { background: #00C865; }
        
        .features-list { background: #F0FDF4; border: 1px solid #DCFCE7; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
        .features-title { font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; margin-bottom: 8px; }
        .feature-item { font-size: 13px; color: #15803D; margin-bottom: 4px; }

        .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 30px; text-align: center; font-size: 12px; color: #94A3B8; line-height: 1.5; }
        .footer a { color: #059669; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="brand">RealSale<span>Pro</span></div>
          <div class="tagline">India's Leading Real Estate Sales CRM</div>
        </div>
        <div class="content">
          <span class="badge">${badgeText}</span>
          <h1>${mainHeading}</h1>
          <p>Hello <strong>${adminName || 'Admin'}</strong>,</p>
          <p>${urgencyMessage}</p>
          
          <div class="credentials-box">
            <div class="credentials-title">🔑 Your Login Credentials</div>
            <div class="cred-row">
              <span class="cred-label">Company Workspace</span>
              <span class="cred-val">${companyName}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Login Email</span>
              <span class="cred-val">${adminEmail}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Login Password</span>
              <span class="cred-val password-highlight">${loginPassword}</span>
            </div>
          </div>

          <div class="cta-container">
            <a href="${directLoginUrl}" class="cta-btn" target="_blank">
              ${warningNumber === 'deactivated' ? 'Contact Support to Reactivate →' : 'Log In & Keep Account Active →'}
            </a>
          </div>

          <div class="features-list">
            <div class="features-title">✨ What You Get with RealSalePro</div>
            <div class="feature-item">✔ WhatsApp &amp; Meta CAPI instant 30-second lead sync</div>
            <div class="feature-item">✔ 100% staff phone number masking to prevent lead theft</div>
            <div class="feature-item">✔ Visual kanban pipeline, site visit logs, and telecaller manager</div>
          </div>

          <p style="font-size: 12px; color: #64748B; margin-top: 16px;">
            Simply logging into your dashboard resets this inactivity timer and keeps your account active for another 30 days.
          </p>
        </div>
        <div class="footer">
          <p>RealSalePro CRM • High Performance Real Estate Software</p>
          <p>Need help? Contact <a href="mailto:support@realsalepro.com">support@realsalepro.com</a> or WhatsApp <a href="https://wa.me/917079737773">+91 70797 37773</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: `"RealSalePro Team" <${EMAIL_USER}>`,
      to: adminEmail,
      subject,
      html
    });

    console.log(`✔ [Inactivity Email] Sent notice #${warningNumber} to ${adminEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [Inactivity Email] Failed sending to ${adminEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Main Inactivity Engine:
 * Evaluates all active tenants and executes the 3-email warning sequence and 30-day deactivation.
 *
 * Rules:
 *  - 15 Days Inactive: Email 1 (15 days left)
 *  - 22 Days Inactive: Email 2 (8 days left)
 *  - 28 Days Inactive: Email 3 (48 hours left)
 *  - 30+ Days Inactive: Deactivate tenant & profiles, send deactivation email.
 */
export async function checkAndProcessInactivity() {
  await initInactivitySchema();

  console.log('\n[Inactivity Scheduler] Starting automated 30-day inactivity check...');

  // Query all active tenants (exclude system 'SalesPro Core' demo tenant)
  const result = await query(`
    SELECT t.id, t.name, t.slug, t.created_at, t.last_login_at,
           t.inactivity_warning_count, t.last_inactivity_warning_at,
           (
             SELECT jsonb_build_object(
               'id', p.id,
               'email', p.email,
               'full_name', p.full_name,
               'password', p.password,
               'temp_login_password', p.temp_login_password,
               'password_hash', p.password_hash
             )
             FROM profiles p
             WHERE p.tenant_id = t.id AND p.role IN ('super_admin', 'admin') AND p.email IS NOT NULL AND p.email != ''
             ORDER BY p.created_at ASC
             LIMIT 1
           ) as admin_profile
    FROM tenants t
    WHERE t.is_active = true AND LOWER(t.slug) != 'default-tenant'
  `);

  const tenants = result.rows;
  console.log(`[Inactivity Scheduler] Evaluating ${tenants.length} active tenants...`);

  const summary = {
    checked: tenants.length,
    warningsSent: 0,
    deactivated: 0,
    details: []
  };

  const now = Date.now();

  for (const tenant of tenants) {
    const admin = tenant.admin_profile;
    if (!admin || !admin.email) {
      continue;
    }

    // Baseline: last_login_at OR created_at
    const baseline = tenant.last_login_at || tenant.created_at || new Date();
    const inactiveMs = now - new Date(baseline).getTime();
    const inactiveDays = Math.max(0, Math.floor(inactiveMs / (1000 * 60 * 60 * 24)));
    const currentWarnings = parseInt(tenant.inactivity_warning_count || 0, 10);

    // Rule 1: 30+ Days Inactive -> Deactivate
    if (inactiveDays >= 30) {
      console.log(`🚨 [Inactivity] Tenant "${tenant.name}" (${tenant.id}) inactive for ${inactiveDays} days. Deactivating...`);

      // Deactivate tenant
      await query(`
        UPDATE tenants
        SET is_active = false,
            subscription_status = 'inactive',
            deactivation_reason = 'inactive_30_days',
            inactivity_deactivated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [tenant.id]);

      // Deactivate profiles under this tenant (except platform admin)
      await query(`
        UPDATE profiles
        SET is_active = false
        WHERE tenant_id = $1 AND role != 'platform_admin'
      `, [tenant.id]);

      // Get or create login password for final notice
      const loginPassword = await getOrGenerateLoginPassword(admin);

      // Send Deactivation Email
      await sendInactivityEmail({
        adminEmail: admin.email,
        adminName: admin.full_name,
        companyName: tenant.name,
        inactiveDays,
        daysRemaining: 0,
        warningNumber: 'deactivated',
        loginPassword
      });

      summary.deactivated++;
      summary.details.push({
        tenantId: tenant.id,
        tenantName: tenant.name,
        action: 'deactivated',
        inactiveDays
      });
      continue;
    }

    // Rule 2: 28 Days Inactive -> Warning 3 (Final 48-Hour Notice)
    if (inactiveDays >= 28 && currentWarnings < 3) {
      console.log(`⚠️ [Inactivity] Tenant "${tenant.name}" inactive for ${inactiveDays} days. Sending Warning 3 (Final Notice)...`);
      const loginPassword = await getOrGenerateLoginPassword(admin);
      const daysRemaining = Math.max(1, 30 - inactiveDays);

      await sendInactivityEmail({
        adminEmail: admin.email,
        adminName: admin.full_name,
        companyName: tenant.name,
        inactiveDays,
        daysRemaining,
        warningNumber: 3,
        loginPassword
      });

      await query(`
        UPDATE tenants
        SET inactivity_warning_count = 3,
            last_inactivity_warning_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [tenant.id]);

      summary.warningsSent++;
      summary.details.push({
        tenantId: tenant.id,
        tenantName: tenant.name,
        action: 'warning_3_sent',
        inactiveDays
      });
      continue;
    }

    // Rule 3: 22 Days Inactive -> Warning 2 (8 Days Remaining)
    if (inactiveDays >= 22 && currentWarnings < 2) {
      console.log(`⚠️ [Inactivity] Tenant "${tenant.name}" inactive for ${inactiveDays} days. Sending Warning 2 (8 Days Left)...`);
      const loginPassword = await getOrGenerateLoginPassword(admin);
      const daysRemaining = Math.max(1, 30 - inactiveDays);

      await sendInactivityEmail({
        adminEmail: admin.email,
        adminName: admin.full_name,
        companyName: tenant.name,
        inactiveDays,
        daysRemaining,
        warningNumber: 2,
        loginPassword
      });

      await query(`
        UPDATE tenants
        SET inactivity_warning_count = 2,
            last_inactivity_warning_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [tenant.id]);

      summary.warningsSent++;
      summary.details.push({
        tenantId: tenant.id,
        tenantName: tenant.name,
        action: 'warning_2_sent',
        inactiveDays
      });
      continue;
    }

    // Rule 4: 15 Days Inactive -> Warning 1 (15 Days Remaining)
    if (inactiveDays >= 15 && currentWarnings < 1) {
      console.log(`ℹ️ [Inactivity] Tenant "${tenant.name}" inactive for ${inactiveDays} days. Sending Warning 1...`);
      const loginPassword = await getOrGenerateLoginPassword(admin);
      const daysRemaining = Math.max(1, 30 - inactiveDays);

      await sendInactivityEmail({
        adminEmail: admin.email,
        adminName: admin.full_name,
        companyName: tenant.name,
        inactiveDays,
        daysRemaining,
        warningNumber: 1,
        loginPassword
      });

      await query(`
        UPDATE tenants
        SET inactivity_warning_count = 1,
            last_inactivity_warning_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [tenant.id]);

      summary.warningsSent++;
      summary.details.push({
        tenantId: tenant.id,
        tenantName: tenant.name,
        action: 'warning_1_sent',
        inactiveDays
      });
      continue;
    }
  }

  console.log(`[Inactivity Scheduler] Completed. Warnings Sent: ${summary.warningsSent}, Deactivated: ${summary.deactivated}\n`);
  return summary;
}

/**
 * Manually reactivate a deactivated tenant and their staff profiles.
 */
export async function reactivateTenant(tenantId) {
  await initInactivitySchema();
  await query(`
    UPDATE tenants
    SET is_active = true,
        subscription_status = 'active',
        deactivation_reason = NULL,
        inactivity_warning_count = 0,
        inactivity_deactivated_at = NULL,
        last_login_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [tenantId]);

  await query(`
    UPDATE profiles
    SET is_active = true
    WHERE tenant_id = $1
  `, [tenantId]);

  return { success: true, message: 'Tenant and staff profiles successfully reactivated' };
}

