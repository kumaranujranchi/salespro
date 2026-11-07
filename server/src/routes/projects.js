import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// 1. List Projects
router.get('/', async (req, res) => {
  try {
    const { tenant_id, is_active } = req.query;
    const targetTenantId = tenant_id || req.user?.tenant_id;
    if (!targetTenantId) return res.status(400).json({ error: 'tenant_id required' });

    let sql = 'SELECT * FROM projects WHERE tenant_id = $1';
    const params = [targetTenantId];

    if (is_active !== undefined && is_active !== 'all') {
      params.push(is_active === 'true' || is_active === true);
      sql += ` AND is_active = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. List Units for a Project
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
    if (status && status !== 'all' && status !== 'All') {
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

// 3. Create or Update Single Unit
router.post('/units', async (req, res) => {
  try {
    const { id, tenant_id, project_id, unit_number, status, custom_values } = req.body;
    let targetTenantId = tenant_id || req.user?.tenant_id;

    if (!targetTenantId && project_id) {
      const pRes = await query('SELECT tenant_id FROM projects WHERE id = $1', [project_id]);
      if (pRes.rows.length > 0) {
        targetTenantId = pRes.rows[0].tenant_id;
      }
    }

    const customJson = custom_values ? (typeof custom_values === 'object' ? JSON.stringify(custom_values) : custom_values) : '{}';

    if (id) {
      const updateRes = await query(
        `UPDATE project_units 
         SET unit_number = COALESCE($1, unit_number), 
             status = COALESCE($2, status), 
             custom_values = $3::jsonb, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $4 
         RETURNING *`,
        [unit_number, status, customJson, id]
      );
      if (updateRes.rows.length === 0) return res.status(404).json({ error: 'Unit not found' });
      const u = updateRes.rows[0];
      return res.json({ ...u, _id: u.id });
    }

    if (!targetTenantId || !project_id || !unit_number) {
      return res.status(400).json({ error: 'tenant_id, project_id, and unit_number are required' });
    }

    const insertRes = await query(
      `INSERT INTO project_units (tenant_id, project_id, unit_number, status, custom_values)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING *`,
      [targetTenantId, project_id, unit_number, status || 'Available', customJson]
    );

    const u = insertRes.rows[0];
    return res.status(201).json({ ...u, _id: u.id });
  } catch (err) {
    console.error('Error creating/updating unit:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. Delete Single Unit
router.delete('/units/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM project_units WHERE id = $1', [id]);
    return res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting unit:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 5. Bulk Add Units
router.post('/units/bulk', async (req, res) => {
  try {
    const { tenant_id, project_id, units } = req.body;
    const targetTenantId = tenant_id || req.user?.tenant_id;
    if (!Array.isArray(units)) return res.status(400).json({ error: 'units array required' });
    if (!targetTenantId || !project_id) return res.status(400).json({ error: 'tenant_id and project_id required' });

    for (const u of units) {
      const customJson = u.custom_values ? (typeof u.custom_values === 'object' ? JSON.stringify(u.custom_values) : u.custom_values) : '{}';
      await query(
        `INSERT INTO project_units (tenant_id, project_id, unit_number, status, custom_values)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT DO NOTHING`,
        [targetTenantId, project_id, u.unit_number, u.status || 'Available', customJson]
      );
    }

    return res.json({ success: true, count: units.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. Get Single Project
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const p = result.rows[0];
    return res.json({ ...p, _id: p.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Create Project
router.post('/', async (req, res) => {
  try {
    const { 
      tenant_id, 
      name, 
      address, 
      project_type, 
      location_lat, 
      location_lng, 
      google_maps_url, 
      image_url, 
      status, 
      is_active, 
      metadata 
    } = req.body;

    const targetTenantId = tenant_id || req.user?.tenant_id;
    if (!targetTenantId) return res.status(400).json({ error: 'tenant_id is required' });
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Project name is required' });

    const activeStatus = is_active !== undefined ? Boolean(is_active) : (status !== 'Closed');
    const projectStatus = status || (activeStatus ? 'Running' : 'Closed');
    const metaJson = metadata ? (typeof metadata === 'object' ? JSON.stringify(metadata) : metadata) : '{}';

    const result = await query(
      `INSERT INTO projects (
        tenant_id, name, address, project_type, location_lat, location_lng, 
        google_maps_url, image_url, status, is_active, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
       RETURNING *`,
      [
        targetTenantId,
        String(name).trim(),
        address || null,
        project_type || 'Flat/Apartment',
        location_lat || null,
        location_lng || null,
        google_maps_url || null,
        image_url || null,
        projectStatus,
        activeStatus,
        metaJson
      ]
    );

    const p = result.rows[0];
    return res.status(201).json({ ...p, _id: p.id });
  } catch (err) {
    console.error('Error creating project:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. Update Project
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const allowed = [
      'name', 'address', 'project_type', 'location_lat', 'location_lng',
      'google_maps_url', 'image_url', 'status', 'is_active', 'metadata'
    ];

    const fields = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === 'metadata') {
          fields.push(`metadata = $${idx++}::jsonb`);
          values.push(typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key]);
        } else if (key === 'is_active') {
          fields.push(`is_active = $${idx++}`);
          values.push(Boolean(body[key]));
        } else {
          fields.push(`${key} = $${idx++}`);
          values.push(body[key]);
        }
      }
    }

    if (fields.length === 0) {
      const current = await query('SELECT * FROM projects WHERE id = $1', [id]);
      if (current.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
      return res.json({ ...current.rows[0], _id: current.rows[0].id });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const p = result.rows[0];
    return res.json({ ...p, _id: p.id });
  } catch (err) {
    console.error('Error updating project:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 5. Delete Project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM projects WHERE id = $1', [id]);
    return res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting project:', err);
    return res.status(500).json({ error: err.message });
  }
});



export default router;
