import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// List Site Visits
router.get('/', async (req, res) => {
  try {
    const { tenant_id, status, driver_id, executive_id, role, userId, filterStatus, scope, visit_date } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    // Check Tenant's Site Visit Visibility Setting (Global vs Private)
    const tenantRes = await query('SELECT settings FROM tenants WHERE id = $1', [tenant_id]);
    const tenantSettings = tenantRes.rows[0]?.settings || {};
    // Default is true (Global company schedule), unless tenant admin toggled it to false
    const isGlobalVisibility = tenantSettings?.site_visits?.global_visibility !== false;

    let sql = `
      SELECT sv.*, 
        p.full_name as requested_by_name,
        p.phone as requested_by_phone,
        d.full_name as driver_name,
        d.phone as driver_phone,
        l.customer_name as lead_customer_name,
        l.mobile as lead_mobile,
        l.lead_status as lead_status
      FROM site_visits sv
      LEFT JOIN profiles p ON sv.requested_by = p.id
      LEFT JOIN profiles d ON sv.driver_id = d.id
      LEFT JOIN leads l ON sv.lead_id = l.id
      WHERE sv.tenant_id = $1
    `;
    const params = [tenant_id];

    // Status filter
    const effectiveStatus = status || filterStatus;
    if (effectiveStatus && effectiveStatus !== 'all') {
      params.push(effectiveStatus);
      sql += ` AND sv.status = $${params.length}`;
    }

    // Date filter (e.g. for checking availability on a specific date)
    if (visit_date) {
      params.push(visit_date);
      sql += ` AND sv.visit_date = $${params.length}`;
    }

    const normRole = String(role || '').toLowerCase().trim();

    // Driver filter
    const effectiveDriverId = driver_id || (normRole.includes('driver') ? userId : null);
    if (effectiveDriverId) {
      params.push(effectiveDriverId);
      sql += ` AND sv.driver_id = $${params.length}`;
    }

    // Role-based visibility and scope filtering
    if (executive_id) {
      params.push(executive_id);
      sql += ` AND sv.requested_by = $${params.length}`;
    } else if (['sales_executive', 'team_leader'].includes(normRole)) {
      if (scope === 'my' || !isGlobalVisibility) {
        // Private / Isolated Mode: requester only sees their own visits
        if (userId) {
          params.push(userId);
          sql += ` AND sv.requested_by = $${params.length}`;
        }
      } else {
        // Global Mode (Default ON): Sales reps see all approved/scheduled/completed visits across the company
        // to check fleet/car/driver availability + their own requests (even if pending or clarification)
        if (userId) {
          params.push(userId);
          sql += ` AND (sv.status IN ('approved', 'trip_started', 'completed') OR sv.requested_by = $${params.length})`;
        } else {
          sql += ` AND sv.status IN ('approved', 'trip_started', 'completed')`;
        }
      }
    }

    sql += ' ORDER BY sv.visit_date DESC, sv.visit_time ASC';
    const result = await query(sql, params);
    return res.json(
      result.rows.map(r => ({
        ...r,
        _id: r.id,
        driver: r.driver_name
          ? { full_name: r.driver_name, phone: r.driver_phone }
          : null,
        lead: r.lead_id
          ? {
              id: r.lead_id,
              _id: r.lead_id,
              customer_name: r.lead_customer_name || r.customer_name,
              mobile: r.lead_mobile || r.mobile,
              lead_status: r.lead_status,
            }
          : null,
      }))
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Count Pending Visits
router.get('/count-pending', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    if (!tenant_id) return res.json(0);
    const result = await query(
      "SELECT count(*) FROM site_visits WHERE tenant_id = $1 AND status = 'pending'",
      [tenant_id]
    );
    return res.json(parseInt(result.rows[0]?.count || 0));
  } catch (err) {
    return res.json(0);
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

// Delete Site Visit
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM site_visits WHERE id = $1', [id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
