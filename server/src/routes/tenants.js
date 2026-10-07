import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// Get all tenants (for platform admin)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM profiles WHERE tenant_id = t.id) as users_count,
        (SELECT COUNT(*) FROM leads WHERE tenant_id = t.id) as leads_count
       FROM tenants t ORDER BY created_at DESC`
    );
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get Tenant by ID
router.get('/:id', async (req, res) => {
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
router.patch('/:id', async (req, res) => {
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

// List Billing History
router.get('/:id/billing-history', async (req, res) => {
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
