import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// List Projects
router.get('/', async (req, res) => {
  try {
    const { tenant_id, is_active } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    let sql = 'SELECT * FROM projects WHERE tenant_id = $1';
    const params = [tenant_id];

    if (is_active !== undefined) {
      params.push(is_active === 'true');
      sql += ` AND is_active = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Create Project
router.post('/', async (req, res) => {
  try {
    const { tenant_id, name, address, project_type, location_lat, location_lng, google_maps_url, image_url } = req.body;

    const result = await query(
      `INSERT INTO projects (tenant_id, name, address, project_type, location_lat, location_lng, google_maps_url, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [tenant_id, name, address || null, project_type || 'Residential', location_lat || null, location_lng || null, google_maps_url || null, image_url || null]
    );

    const p = result.rows[0];
    return res.status(201).json({ ...p, _id: p.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// List Units for a Project
router.get('/units', async (req, res) => {
  try {
    const { project_id, tenant_id, status } = req.query;
    if (!project_id && !tenant_id) return res.status(400).json({ error: 'project_id or tenant_id required' });

    let sql = 'SELECT * FROM project_units WHERE 1=1';
    const params = [];

    if (project_id) {
      params.push(project_id);
      sql += ` AND project_id = $${params.length}`;
    }
    if (tenant_id) {
      params.push(tenant_id);
      sql += ` AND tenant_id = $${params.length}`;
    }
    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY unit_number ASC';
    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Create / Bulk Add Units
router.post('/units/bulk', async (req, res) => {
  try {
    const { tenant_id, project_id, units } = req.body;
    if (!Array.isArray(units)) return res.status(400).json({ error: 'units array required' });

    for (const u of units) {
      await query(
        `INSERT INTO project_units (tenant_id, project_id, unit_number, status, custom_values)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [tenant_id, project_id, u.unit_number, u.status || 'Available', JSON.stringify(u.custom_values || {})]
      );
    }

    return res.json({ success: true, count: units.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
