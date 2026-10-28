import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { query } from '../db/index.js';
import { requirePlatformAdmin, requireRole, requireTenantAccess } from '../middleware/auth.js';

const router = Router();

// Get all tenants (for platform admin)
router.get('/', requirePlatformAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, 
        COALESCE(
          (SELECT email FROM profiles WHERE tenant_id = t.id AND role IN ('super_admin', 'admin') AND email IS NOT NULL AND email != '' ORDER BY created_at ASC LIMIT 1),
          (SELECT email FROM profiles WHERE tenant_id = t.id AND email IS NOT NULL AND email != '' ORDER BY created_at ASC LIMIT 1)
        ) AS contact_email,
        COALESCE(
          (SELECT phone FROM profiles WHERE tenant_id = t.id AND role IN ('super_admin', 'admin') AND phone IS NOT NULL AND phone != '' ORDER BY created_at ASC LIMIT 1),
          (SELECT phone FROM profiles WHERE tenant_id = t.id AND phone IS NOT NULL AND phone != '' ORDER BY created_at ASC LIMIT 1)
        ) AS contact_phone,
        COALESCE(
          (SELECT full_name FROM profiles WHERE tenant_id = t.id AND role IN ('super_admin', 'admin') ORDER BY created_at ASC LIMIT 1),
          (SELECT full_name FROM profiles WHERE tenant_id = t.id ORDER BY created_at ASC LIMIT 1)
        ) AS admin_name,
        COALESCE(
          (SELECT user_id FROM profiles WHERE tenant_id = t.id AND role IN ('super_admin', 'admin') ORDER BY created_at ASC LIMIT 1),
          (SELECT user_id FROM profiles WHERE tenant_id = t.id ORDER BY created_at ASC LIMIT 1)
        ) AS owner_id,
        (SELECT COUNT(*) FROM profiles WHERE tenant_id = t.id) as users_count,
        (SELECT COUNT(*) FROM leads WHERE tenant_id = t.id) as leads_count,
        (SELECT COUNT(*) FROM sales WHERE tenant_id = t.id) as sales_count,
        (SELECT COUNT(*) FROM projects WHERE tenant_id = t.id) as projects_count
       FROM tenants t ORDER BY created_at DESC`
    );
    return res.json(result.rows.map(r => ({
      ...r,
      _id: r.id,
      _creationTime: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      contact_email: r.contact_email || null,
      contact_phone: r.contact_phone || null,
      admin_name: r.admin_name || null,
      owner_id: r.owner_id || null,
      stats: {
        activeUsers: parseInt(r.users_count || 0),
        leadsCount: parseInt(r.leads_count || 0),
        salesCount: parseInt(r.sales_count || 0),
        projectsCount: parseInt(r.projects_count || 0),
      }
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Register new Tenant & Super Admin profile
export async function registerTenantHandler(req, res) {
  try {
    const {
      company_name,
      company_slug,
      user_full_name,
      contact_email,
      contact_phone,
      referral_code,
      userId,
      password,
    } = req.body;

    if (!company_name || !company_slug || !contact_email) {
      return res.status(400).json({ error: 'Company name, slug, and email are required' });
    }

    const cleanSlug = company_slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const existing = await query('SELECT id FROM tenants WHERE LOWER(slug) = $1 LIMIT 1', [cleanSlug]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A company with this URL slug already exists' });
    }

    // 1. Create Tenant
    const tenantRes = await query(
      `INSERT INTO tenants (name, slug, settings, subscription_status, plan_tier, is_active)
       VALUES ($1, $2, '{"general": {"target_model": "area"}, "branding": {"primary_color": "#3B82F6"}}'::jsonb, 'active', 'free', true)
       RETURNING *`,
      [company_name.trim(), cleanSlug]
    );
    const tenant = tenantRes.rows[0];

    // 2. Create Super Admin Profile
    const rawPass = password || 'Admin@123';
    const passwordHash = await bcrypt.hash(rawPass, 10);
    const profileEmail = contact_email.toLowerCase().trim();
    const profileUserId = userId ? String(userId).trim() : profileEmail;

    await query(
      `INSERT INTO profiles (user_id, email, password, password_hash, full_name, employee_id, phone, role, tenant_id, is_active, force_password_change)
       VALUES ($1, $2, $3, $4, $5, 'ADMIN-001', $6, 'super_admin', $7, true, false)`,
      [profileUserId, profileEmail, rawPass, passwordHash, user_full_name || 'Admin', contact_phone || null, tenant.id]
    );

    // 3. Handle referral if present
    if (referral_code) {
      const camp = await query('SELECT * FROM referral_campaigns WHERE code = $1 LIMIT 1', [referral_code.trim()]);
      if (camp.rows.length > 0) {
        await query(
          `INSERT INTO user_referrals (tenant_id, campaign_id, referred_tenant_id, status, metadata)
           VALUES ($1, $2, $3, 'pending', jsonb_build_object('registered_at', CURRENT_TIMESTAMP))`,
          [camp.rows[0].tenant_id, camp.rows[0].id, tenant.id]
        );
      }
    }

    return res.json({ success: true, tenant_id: tenant.id, tenant: { ...tenant, _id: tenant.id } });
  } catch (err) {
    console.error('Tenant register error:', err);
    return res.status(500).json({ error: err.message });
  }
}

router.post('/register', registerTenantHandler);

// Delete Tenant (platform admin only)
router.delete('/:id', requirePlatformAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM profiles WHERE tenant_id = $1', [id]);
    await query('DELETE FROM departments WHERE tenant_id = $1', [id]);
    await query('DELETE FROM tenants WHERE id = $1', [id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get Tenant by ID
router.get('/:id', requireTenantAccess, async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*,
        COALESCE(
          (SELECT email FROM profiles WHERE tenant_id = t.id AND role IN ('super_admin', 'admin') AND email IS NOT NULL AND email != '' ORDER BY created_at ASC LIMIT 1),
          (SELECT email FROM profiles WHERE tenant_id = t.id AND email IS NOT NULL AND email != '' ORDER BY created_at ASC LIMIT 1)
        ) AS contact_email,
        COALESCE(
          (SELECT phone FROM profiles WHERE tenant_id = t.id AND role IN ('super_admin', 'admin') AND phone IS NOT NULL AND phone != '' ORDER BY created_at ASC LIMIT 1),
          (SELECT phone FROM profiles WHERE tenant_id = t.id AND phone IS NOT NULL AND phone != '' ORDER BY created_at ASC LIMIT 1)
        ) AS contact_phone,
        COALESCE(
          (SELECT full_name FROM profiles WHERE tenant_id = t.id AND role IN ('super_admin', 'admin') ORDER BY created_at ASC LIMIT 1),
          (SELECT full_name FROM profiles WHERE tenant_id = t.id ORDER BY created_at ASC LIMIT 1)
        ) AS admin_name,
        COALESCE(
          (SELECT user_id FROM profiles WHERE tenant_id = t.id AND role IN ('super_admin', 'admin') ORDER BY created_at ASC LIMIT 1),
          (SELECT user_id FROM profiles WHERE tenant_id = t.id ORDER BY created_at ASC LIMIT 1)
        ) AS owner_id
       FROM tenants t WHERE t.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.json(null);
    const t = result.rows[0];
    return res.json({ ...t, _id: t.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update Tenant
router.patch('/:id', requireTenantAccess, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, settings, subscription_status, plan_tier, is_active } = req.body;
    
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (settings !== undefined) { fields.push(`settings = $${idx++}`); values.push(JSON.stringify(settings)); }
    if (subscription_status !== undefined) { fields.push(`subscription_status = $${idx++}`); values.push(subscription_status); }
    if (plan_tier !== undefined) { fields.push(`plan_tier = $${idx++}`); values.push(plan_tier); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }

    if (fields.length === 0) return res.json({ success: true });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(`UPDATE tenants SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get (or lazily create) the per-tenant token used by lead-capture webhooks.
// Keeping it separate from the tenant id means URLs cannot be guessed from an id.
router.get('/:id/webhook-secret', requireTenantAccess, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT settings FROM tenants WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });

    const current = existing.rows[0].settings?.integrations?.webhookSecret;
    if (current) return res.json({ secret: current });

    // Create it atomically so two admins opening the page never end up with
    // two different tokens.
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const created = await query(
      `UPDATE tenants
          SET settings = jsonb_set(
                jsonb_set(COALESCE(settings, '{}'::jsonb), '{integrations}',
                          COALESCE(settings->'integrations', '{}'::jsonb), true),
                '{integrations,webhookSecret}', to_jsonb($2::text), true),
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND COALESCE(settings->'integrations'->>'webhookSecret', '') = ''
        RETURNING settings->'integrations'->>'webhookSecret' AS secret`,
      [id, secret]
    );

    if (created.rows.length > 0) return res.json({ secret: created.rows[0].secret });

    // Someone else created one between our read and write.
    const again = await query(
      `SELECT settings->'integrations'->>'webhookSecret' AS secret FROM tenants WHERE id = $1`,
      [id]
    );
    return res.json({ secret: again.rows[0]?.secret || secret });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// List Billing History
router.get('/:id/billing-history', requireTenantAccess, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM billing_history WHERE tenant_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
