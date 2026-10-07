import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// List Site Visits
router.get('/', async (req, res) => {
  try {
    const { tenant_id, status, driver_id, executive_id } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    let sql = `
      SELECT sv.*, 
        p.full_name as requested_by_name,
        d.full_name as driver_name
      FROM site_visits sv
      LEFT JOIN profiles p ON sv.requested_by = p.id
      LEFT JOIN profiles d ON sv.driver_id = d.id
      WHERE sv.tenant_id = $1
    `;
    const params = [tenant_id];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND sv.status = $${params.length}`;
    }
    if (driver_id) {
      params.push(driver_id);
      sql += ` AND sv.driver_id = $${params.length}`;
    }
    if (executive_id) {
      params.push(executive_id);
      sql += ` AND sv.requested_by = $${params.length}`;
    }

    sql += ' ORDER BY sv.visit_date DESC';
    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Request / Create Site Visit
router.post('/', async (req, res) => {
  try {
    const {
      tenant_id, requested_by, lead_id, customer_name, mobile,
      visit_date, visit_time, pickup_location, notes
    } = req.body;

    const result = await query(
      `INSERT INTO site_visits
        (tenant_id, requested_by, lead_id, customer_name, mobile, visit_date, visit_time, pickup_location, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING *`,
      [tenant_id, requested_by, lead_id || null, customer_name, mobile, visit_date, visit_time, pickup_location, notes || null]
    );

    const visit = result.rows[0];
    return res.status(201).json({ ...visit, _id: visit.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update Site Visit (Approval / Driver Assignment / Trip updates)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    for (const [k, v] of Object.entries(b)) {
      if (k !== 'id' && k !== '_id' && v !== undefined) {
        fields.push(`${k} = $${idx++}`);
        values.push(v);
      }
    }

    if (fields.length === 0) return res.json({ success: true });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(`UPDATE site_visits SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
