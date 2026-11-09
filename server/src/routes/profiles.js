import { Router } from 'express';
import { query } from '../db/index.js';
import bcrypt from 'bcryptjs';
import { isPlatformRole, requireRole, sanitizeProfile } from '../middleware/auth.js';

const router = Router();

// 1. List Users By Tenant
router.get('/', async (req, res) => {
  try {
    const { tenant_id, role, is_active } = req.query;
    const targetTenantId = tenant_id || req.user?.tenant_id;
    if (!targetTenantId) return res.status(400).json({ error: 'tenant_id required' });

    let sql = `
      SELECT p.*, d.name as department_name, r.name as role_name
      FROM profiles p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN tenant_roles r ON p.role_id = r.id
      WHERE p.tenant_id = $1
    `;
    const params = [targetTenantId];

    if (role) {
      params.push(role);
      sql += ` AND p.role = $${params.length}`;
    }
    if (is_active !== undefined) {
      params.push(is_active === 'true' || is_active === true);
      sql += ` AND p.is_active = $${params.length}`;
    }

    sql += ` ORDER BY p.created_at ASC`;

    const result = await query(sql, params);
    return res.json(result.rows.map(r => sanitizeProfile(r)));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Create User / Profile
router.post('/', requireRole('super_admin', 'admin', 'director'), async (req, res) => {
  try {
    const {
      tenant_id, email, full_name, employee_id, phone, role,
      department_id, reporting_manager_id, role_id, password,
      image_url, dob, marriage_anniversary, joining_date, is_active
    } = req.body;

    const targetTenantId = tenant_id || req.user?.tenant_id;
    if (!targetTenantId) return res.status(400).json({ error: 'tenant_id is required' });
    if (!email || !full_name) return res.status(400).json({ error: 'Full name and email are required' });

    // Check Free Plan User Limit (Maximum 5 users)
    const tenantRes = await query('SELECT plan_tier, subscription_status FROM tenants WHERE id = $1', [targetTenantId]);
    const tenantRow = tenantRes.rows[0];
    const isProOrEnterprise = tenantRow?.plan_tier === 'pro' || tenantRow?.plan_tier === 'enterprise' || tenantRow?.subscription_status === 'active';

    if (!isProOrEnterprise) {
      const countRes = await query('SELECT COUNT(*) as count FROM profiles WHERE tenant_id = $1', [targetTenantId]);
      const currentUsersCount = parseInt(countRes.rows[0]?.count || '0', 10);
      if (currentUsersCount >= 5) {
        return res.status(403).json({
          error: 'Free Plan limit reached (Maximum 5 users). Please delete an existing user or upgrade to Pro Plan for unlimited users.'
        });
      }
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validate phone number
    let normalizedPhone = null;
    if (phone && String(phone).trim()) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      normalizedPhone = cleanPhone.length === 12 && cleanPhone.startsWith('91')
        ? cleanPhone.slice(2)
        : (cleanPhone.length === 11 && cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone);

      if (normalizedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(normalizedPhone) || /^(\d)\1{9}$/.test(normalizedPhone)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
      }
    }

    // Check duplicate email
    const existing = await query('SELECT id FROM profiles WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A user with this email address already exists' });
    }

    const rawPass = password || 'Admin@123';
    const passwordHash = await bcrypt.hash(rawPass, 10);

    const result = await query(
      `INSERT INTO profiles 
        (tenant_id, user_id, email, password, password_hash, full_name, employee_id, phone, role, 
         department_id, reporting_manager_id, role_id, image_url, dob, marriage_anniversary, joining_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        targetTenantId, 
        cleanEmail, 
        cleanEmail, 
        null, 
        passwordHash, 
        full_name, 
        employee_id || null, 
        normalizedPhone || null, 
        role || 'sales_executive',
        department_id || null, 
        reporting_manager_id || null, 
        role_id || null,
        image_url || null,
        dob || null,
        marriage_anniversary || null,
        joining_date || null,
        is_active !== undefined ? Boolean(is_active) : true
      ]
    );

    const user = result.rows[0];
    return res.status(201).json(sanitizeProfile(user));
  } catch (err) {
    console.error('Create profile error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. Update Profile
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const canManageUsers =
      isPlatformRole(req.user) || ['super_admin', 'admin', 'director'].includes(req.user?.role);
    const isSelf = String(req.user?.id) === String(id);

    if (!canManageUsers && !isSelf) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const body = req.body || {};

    if (body.phone !== undefined && body.phone !== null && String(body.phone).trim() !== '') {
      const cleanPhone = String(body.phone).replace(/\D/g, '');
      const normalizedPhone = cleanPhone.length === 12 && cleanPhone.startsWith('91')
        ? cleanPhone.slice(2)
        : (cleanPhone.length === 11 && cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone);

      if (normalizedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(normalizedPhone) || /^(\d)\1{9}$/.test(normalizedPhone)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
      }
      body.phone = normalizedPhone;
    }

    const allowed = [
      'full_name', 'phone', 'image_url', 'dob', 'marriage_anniversary', 'joining_date'
    ];

    if (canManageUsers) {
      allowed.push('role', 'role_id', 'department_id', 'reporting_manager_id', 'employee_id', 'is_active');
    }

    const fields = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === 'is_active') {
          fields.push(`is_active = $${idx++}`);
          values.push(Boolean(body[key]));
        } else {
          fields.push(`${key} = $${idx++}`);
          values.push(body[key]);
        }
      }
    }

    // Handle password update if passed (strictly hashes with bcrypt and prevents plaintext storage)
    if (body.password) {
      const passwordHash = await bcrypt.hash(body.password, 10);
      fields.push(`password = NULL`);
      fields.push(`password_hash = $${idx++}`);
      values.push(passwordHash);
    }

    if (fields.length === 0) return res.json({ success: true });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateRes = await query(
      `UPDATE profiles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, 
      values
    );

    if (updateRes.rows.length === 0) return res.status(404).json({ error: 'User profile not found' });
    const user = updateRes.rows[0];
    return res.json({ success: true, ...sanitizeProfile(user) });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3b. Admin Reset User Password
router.post('/reset-password', requireRole('platform_admin', 'super_admin', 'admin', 'director'), async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'userId and newPassword are required' });
    }

    const trimmedPassword = String(newPassword).trim();
    if (trimmedPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const target = String(userId).trim().toLowerCase();

    let sql = `
      SELECT id, email, role, tenant_id, full_name
      FROM profiles
      WHERE (LOWER(email) = $1 OR LOWER(user_id) = $1 OR id::text = $1)
    `;
    const params = [target];

    if (!isPlatformRole(req.user)) {
      params.push(req.user.tenant_id);
      sql += ` AND tenant_id = $2`;
    }
    sql += ` LIMIT 1`;

    const profileRes = await query(sql, params);
    if (profileRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found in your organization' });
    }

    const targetUser = profileRes.rows[0];

    if (targetUser.role === 'platform_admin' && !isPlatformRole(req.user)) {
      return res.status(403).json({ error: 'Cannot reset credentials for a platform administrator' });
    }

    const passwordHash = await bcrypt.hash(trimmedPassword, 10);
    await query(
      `UPDATE profiles
       SET password = NULL, password_hash = $1, force_password_change = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, targetUser.id]
    );

    return res.json({
      success: true,
      message: `Password for ${targetUser.full_name || targetUser.email} updated successfully.`
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3c. Delete User / Profile
router.delete('/:id', requireRole('platform_admin', 'super_admin', 'admin', 'director'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'User ID is required' });

    // Prevent self-deletion
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    let sql = `SELECT id, full_name, email, tenant_id FROM profiles WHERE id = $1`;
    const params = [id];

    if (!isPlatformRole(req.user)) {
      params.push(req.user.tenant_id);
      sql += ` AND tenant_id = $2`;
    }

    const checkRes = await query(sql, params);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Set reporting_manager_id to NULL for any users reporting to this user
    await query(`UPDATE profiles SET reporting_manager_id = NULL WHERE reporting_manager_id = $1`, [id]);
    
    // Set sales_executive_id to NULL on leads assigned to this user so leads are preserved safely
    await query(`UPDATE leads SET sales_executive_id = NULL WHERE sales_executive_id = $1`, [id]);

    // Delete profile
    await query(`DELETE FROM profiles WHERE id = $1`, [id]);

    return res.json({ success: true, message: 'User deleted successfully', id });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. Roles List
router.get('/roles', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const targetTenantId = tenant_id || req.user?.tenant_id;
    if (!targetTenantId) return res.status(400).json({ error: 'tenant_id required' });

    const result = await query(
      'SELECT * FROM tenant_roles WHERE tenant_id = $1 ORDER BY name ASC',
      [targetTenantId]
    );
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Create Role
router.post('/roles', async (req, res) => {
  try {
    const { tenant_id, name, description, permissions } = req.body;
    const targetTenantId = tenant_id || req.user?.tenant_id;
    if (!targetTenantId || !name) return res.status(400).json({ error: 'tenant_id and name are required' });

    const permJson = permissions ? (typeof permissions === 'object' ? JSON.stringify(permissions) : permissions) : '{}';

    const result = await query(
      `INSERT INTO tenant_roles (tenant_id, name, description, permissions, is_system)
       VALUES ($1, $2, $3, $4::jsonb, false)
       RETURNING *`,
      [targetTenantId, String(name).trim(), description || null, permJson]
    );

    const r = result.rows[0];
    return res.status(201).json({ ...r, _id: r.id });
  } catch (err) {
    console.error('Create role error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 6. Update Role
router.patch('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (permissions !== undefined) {
      fields.push(`permissions = $${idx++}::jsonb`);
      values.push(typeof permissions === 'object' ? JSON.stringify(permissions) : permissions);
    }

    if (fields.length === 0) return res.json({ success: true });

    values.push(id);
    const result = await query(
      `UPDATE tenant_roles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Role not found' });
    const r = result.rows[0];
    return res.json({ ...r, _id: r.id });
  } catch (err) {
    console.error('Update role error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 7. Delete Role
router.delete('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM tenant_roles WHERE id = $1 AND (is_system = false OR is_system IS NULL)', [id]);
    return res.json({ success: true, id });
  } catch (err) {
    console.error('Delete role error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Ensure departments table has custom_fields and updated_at columns
query(`
  ALTER TABLE departments ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
`).catch(err => console.error('Migration note (departments custom_fields):', err.message));

// 8. Departments List
router.get('/departments', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const targetTenantId = tenant_id || req.user?.tenant_id;
    if (!targetTenantId) return res.status(400).json({ error: 'tenant_id required' });

    const result = await query(
      'SELECT * FROM departments WHERE tenant_id = $1 ORDER BY name ASC',
      [targetTenantId]
    );
    return res.json(result.rows.map(r => ({
      ...r,
      _id: r.id,
      custom_fields: typeof r.custom_fields === 'string'
        ? JSON.parse(r.custom_fields || '[]')
        : (r.custom_fields || [])
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 9. Create Department
router.post('/departments', async (req, res) => {
  try {
    const { tenant_id, name, description, custom_fields } = req.body;
    const targetTenantId = tenant_id || req.user?.tenant_id;
    if (!targetTenantId || !name) return res.status(400).json({ error: 'tenant_id and name are required' });

    const cleanCustomFields = Array.isArray(custom_fields)
      ? custom_fields.filter(f => f && (f.label?.trim() || f.value?.trim()))
      : [];

    const result = await query(
      `INSERT INTO departments (tenant_id, name, description, custom_fields, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [
        targetTenantId,
        String(name).trim(),
        description || null,
        JSON.stringify(cleanCustomFields)
      ]
    );

    const d = result.rows[0];
    return res.status(201).json({
      ...d,
      _id: d.id,
      custom_fields: typeof d.custom_fields === 'string'
        ? JSON.parse(d.custom_fields || '[]')
        : (d.custom_fields || [])
    });
  } catch (err) {
    console.error('Create department error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 10. Update Department
router.patch('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active, custom_fields } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(Boolean(is_active)); }
    if (custom_fields !== undefined) {
      const cleanCustomFields = Array.isArray(custom_fields)
        ? custom_fields.filter(f => f && (f.label?.trim() || f.value?.trim()))
        : [];
      fields.push(`custom_fields = $${idx++}`);
      values.push(JSON.stringify(cleanCustomFields));
    }

    if (fields.length === 0) return res.json({ success: true });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE departments SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found' });
    const d = result.rows[0];
    return res.json({
      ...d,
      _id: d.id,
      custom_fields: typeof d.custom_fields === 'string'
        ? JSON.parse(d.custom_fields || '[]')
        : (d.custom_fields || [])
    });
  } catch (err) {
    console.error('Update department error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 11. Delete Department
router.delete('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM departments WHERE id = $1', [id]);
    return res.json({ success: true, id });
  } catch (err) {
    console.error('Delete department error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
