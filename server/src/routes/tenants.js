import { Router } from 'express';
import crypto from 'node:crypto';
import { query } from '../db/index.js';
import { requirePlatformAdmin, requireRole, requireTenantAccess } from '../middleware/auth.js';

const router = Router();

// Get all tenants (for platform admin)
router.get('/', requirePlatformAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM profiles WHERE tenant_id = t.id) as users_count,
        (SELECT COUNT(*) FROM leads WHERE tenant_id = t.id) as leads_count
       FROM tenants t ORDER BY created_at DESC`
    );
    return res.json(result.rows.map(r => ({
      ...r,
      _id: r.id,
      _creationTime: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      stats: {
        activeUsers: parseInt(r.users_count || 0),
        leadsCount: parseInt(r.leads_count || 0),
        salesCount: 0
      }
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get Tenant by ID
router.get('/:id', requireTenantAccess, async (req, res) => {
  try {
    const result = await query('SELECT * FROM tenants WHERE id = $1', [req.params.id]);
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
