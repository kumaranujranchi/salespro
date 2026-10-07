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

// Set Target
router.post('/', async (req, res) => {
  try {
    const { tenant_id, user_id, period_type, target_sqft, target_amount, target_units, start_date, end_date, created_by } = req.body;

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

export default router;
