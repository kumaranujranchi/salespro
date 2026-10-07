import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// List Users By Tenant
router.get('/', async (req, res) => {
  try {
    const { tenant_id, role, is_active } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    let sql = `
      SELECT p.*, d.name as department_name, r.name as role_name
      FROM profiles p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN tenant_roles r ON p.role_id = r.id
      WHERE p.tenant_id = $1
    `;
    const params = [tenant_id];

    if (role) {
      params.push(role);
      sql += ` AND p.role = $${params.length}`;
    }
    if (is_active !== undefined) {
      params.push(is_active === 'true');
      sql += ` AND p.is_active = $${params.length}`;
    }

    sql += ` ORDER BY p.created_at ASC`;

    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Create User / Profile
router.post('/', async (req, res) => {
  try {
    const {
      tenant_id, email, full_name, employee_id, phone, role,
      department_id, reporting_manager_id, role_id
    } = req.body;

    const result = await query(
      `INSERT INTO profiles 
        (tenant_id, user_id, email, full_name, employee_id, phone, role, department_id, reporting_manager_id, role_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       RETURNING *`,
      [
        tenant_id, email, email, full_name, employee_id, phone, role,
        department_id || null, reporting_manager_id || null, role_id || null
      ]
    );

    const user = result.rows[0];
    return res.status(201).json({ ...user, _id: user.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update Profile
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role, department_id, reporting_manager_id, is_active } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (full_name !== undefined) { fields.push(`full_name = $${idx++}`); values.push(full_name); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (role !== undefined) { fields.push(`role = $${idx++}`); values.push(role); }
    if (department_id !== undefined) { fields.push(`department_id = $${idx++}`); values.push(department_id); }
    if (reporting_manager_id !== undefined) { fields.push(`reporting_manager_id = $${idx++}`); values.push(reporting_manager_id); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }

    if (fields.length === 0) return res.json({ success: true });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(`UPDATE profiles SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Roles List
router.get('/roles', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const result = await query(
      'SELECT * FROM tenant_roles WHERE tenant_id = $1 ORDER BY name ASC',
      [tenant_id]
    );
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Departments List
router.get('/departments', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const result = await query(
      'SELECT * FROM departments WHERE tenant_id = $1 ORDER BY name ASC',
      [tenant_id]
    );
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
