import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// List Targets
router.get('/', async (req, res) => {
  try {
    const { tenant_id, user_id, start_date } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    let sql = `
      SELECT t.*, p.full_name as user_name
      FROM sales_targets t
      LEFT JOIN profiles p ON t.user_id = p.id
      WHERE t.tenant_id = $1
    `;
    const params = [tenant_id];

    if (user_id) {
      params.push(user_id);
      sql += ` AND t.user_id = $${params.length}`;
    }
    if (start_date) {
      params.push(start_date);
      sql += ` AND t.start_date >= $${params.length}`;
    }

    sql += ' ORDER BY t.start_date DESC';
    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Set or Upsert Target
router.post('/', async (req, res) => {
  try {
    const { tenant_id, user_id, period_type, target_sqft, target_amount, target_units, start_date, end_date, created_by } = req.body;

    // Check if target already exists for this tenant, user, and start_date
    const existing = await query(
      `SELECT * FROM sales_targets WHERE tenant_id = $1 AND user_id = $2 AND start_date = $3 LIMIT 1`,
      [tenant_id, user_id, start_date]
    );

    if (existing.rows.length > 0) {
      const updateResult = await query(
        `UPDATE sales_targets 
         SET target_sqft = $1, target_amount = $2, target_units = $3, end_date = $4, period_type = $5
         WHERE id = $6 RETURNING *`,
        [target_sqft || 0, target_amount || 0, target_units || 0, end_date, period_type || 'monthly', existing.rows[0].id]
      );
      const t = updateResult.rows[0];
      return res.status(200).json({ ...t, _id: t.id });
    }

    const result = await query(
      `INSERT INTO sales_targets
        (tenant_id, user_id, period_type, target_sqft, target_amount, target_units, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [tenant_id, user_id, period_type || 'monthly', target_sqft || 0, target_amount || 0, target_units || 0, start_date, end_date, created_by || null]
    );

    const t = result.rows[0];
    return res.status(201).json({ ...t, _id: t.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update Target by ID
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { target_sqft, target_amount, target_units, start_date, end_date, period_type } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (target_sqft !== undefined) { fields.push(`target_sqft = $${idx++}`); values.push(Number(target_sqft) || 0); }
    if (target_amount !== undefined) { fields.push(`target_amount = $${idx++}`); values.push(Number(target_amount) || 0); }
    if (target_units !== undefined) { fields.push(`target_units = $${idx++}`); values.push(Number(target_units) || 0); }
    if (start_date !== undefined) { fields.push(`start_date = $${idx++}`); values.push(start_date); }
    if (end_date !== undefined) { fields.push(`end_date = $${idx++}`); values.push(end_date); }
    if (period_type !== undefined) { fields.push(`period_type = $${idx++}`); values.push(period_type); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const sql = `UPDATE sales_targets SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Target not found' });
    }
    const t = result.rows[0];
    return res.json({ ...t, _id: t.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { target_sqft, target_amount, target_units, start_date, end_date, period_type } = req.body;

    const result = await query(
      `UPDATE sales_targets 
       SET target_sqft = $1, target_amount = $2, target_units = $3, start_date = COALESCE($4, start_date), end_date = COALESCE($5, end_date), period_type = COALESCE($6, period_type)
       WHERE id = $7 RETURNING *`,
      [Number(target_sqft) || 0, Number(target_amount) || 0, Number(target_units) || 0, start_date, end_date, period_type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Target not found' });
    }
    const t = result.rows[0];
    return res.json({ ...t, _id: t.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete Target by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM sales_targets WHERE id = $1`, [id]);
    return res.json({ success: true, id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
