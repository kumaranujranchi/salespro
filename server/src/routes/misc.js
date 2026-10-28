import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// Followups
router.get('/followups', async (req, res) => {
  try {
    const { lead_id, tenant_id } = req.query;
    let sql = 'SELECT * FROM lead_followups WHERE 1=1';
    const params = [];

    if (lead_id) {
      params.push(lead_id);
      sql += ` AND lead_id = $${params.length}`;
    }
    if (tenant_id) {
      params.push(tenant_id);
      sql += ` AND tenant_id = $${params.length}`;
    }

    sql += ' ORDER BY followup_date DESC';
    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/followups', async (req, res) => {
  try {
    const {
      tenant_id, lead_id, followup_type, followup_date, discussion_summary,
      customer_response, call_status, previous_status, new_status, next_followup_date, created_by
    } = req.body;

    const result = await query(
      `INSERT INTO lead_followups
        (tenant_id, lead_id, followup_type, followup_date, discussion_summary, customer_response, call_status, previous_status, new_status, next_followup_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [tenant_id, lead_id, followup_type, followup_date, discussion_summary, customer_response || null, call_status || null, previous_status || null, new_status, next_followup_date || null, created_by || null]
    );

    // Also update lead's latest followup info
    await query(
      `UPDATE leads SET
        lead_status = $1,
        latest_followup_date = $2,
        latest_followup_status = $3,
        next_followup_date = $4,
        followup_count = followup_count + 1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [new_status, followup_date, call_status || new_status, next_followup_date || null, lead_id]
    );

    return res.status(201).json({ ...result.rows[0], _id: result.rows[0].id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Notifications
router.get('/notifications', async (req, res) => {
  try {
    const { user_id } = req.query;
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [user_id]
    );
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = true WHERE id = $1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Announcements
router.get('/announcements', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const result = await query(
      'SELECT * FROM announcements WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenant_id]
    );
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/announcements/published', async (req, res) => {
  try {
    const { tenant_id, limit = 10 } = req.query;
    if (!tenant_id) return res.json([]);
    const result = await query(
      `SELECT * FROM announcements 
       WHERE tenant_id = $1 AND (is_published = true OR is_published IS NULL)
       ORDER BY created_at DESC 
       LIMIT $2`,
      [tenant_id, parseInt(limit)]
    );
    return res.json(result.rows.map(r => ({
      ...r,
      _id: r.id,
      _creationTime: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    })));
  } catch (err) {
    return res.json([]);
  }
});

// Activity Logs
router.get('/activity-logs', async (req, res) => {
  try {
    const { tenant_id, limit = 50 } = req.query;
    if (!tenant_id) return res.json([]);
    const result = await query(
      `SELECT al.*, p.full_name as user_name, p.image_url as user_image
       FROM activity_logs al
       LEFT JOIN profiles p ON al.user_id = p.id
       WHERE al.tenant_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2`,
      [tenant_id, parseInt(limit)]
    );
    return res.json(result.rows.map(r => ({
      ...r,
      _id: r.id,
      _creationTime: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      userName: r.user_name || 'System',
      user: {
        full_name: r.user_name || 'System',
        image_url: r.user_image || null,
      }
    })));
  } catch (err) {
    return res.json([]);
  }
});

// Incentives
router.get('/incentives', async (req, res) => {
  try {
    const { tenant_id, executive_id, year } = req.query;
    if (!tenant_id) return res.json([]);
    let sql = 'SELECT * FROM incentives WHERE tenant_id = $1';
    const params = [tenant_id];
    if (executive_id) {
      params.push(executive_id);
      sql += ` AND sales_executive_id = $${params.length}`;
    }
    if (year) {
      params.push(parseInt(year));
      sql += ` AND calculation_year = $${params.length}`;
    }
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.json([]);
  }
});

router.get('/incentives/calculation-data', async (req, res) => {
  try {
    const { tenant_id, executive_id } = req.query;
    return res.json({
      totalIncentives: 0,
      pendingIncentives: 0,
      approvedIncentives: 0,
      paidIncentives: 0,
      slabs: [],
    });
  } catch (err) {
    return res.json({ totalIncentives: 0, pendingIncentives: 0, approvedIncentives: 0, paidIncentives: 0, slabs: [] });
  }
});

// Support Tickets
router.get('/support-tickets', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    let sql = `
      SELECT st.*, 
        p.full_name as profile_full_name, p.email as profile_email,
        t.name as tenant_name
      FROM support_tickets st
      LEFT JOIN profiles p ON st.created_by = p.id
      LEFT JOIN tenants t ON st.tenant_id = t.id
    `;
    const params = [];
    if (tenant_id) {
      params.push(tenant_id);
      sql += ' WHERE st.tenant_id = $1';
    }
    sql += ' ORDER BY st.created_at DESC';
    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({
      ...r,
      _id: r.id,
      _creationTime: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      profiles: {
        full_name: r.profile_full_name || 'Admin',
        email: r.profile_email || ''
      },
      tenants: {
        name: r.tenant_name || 'Platform'
      }
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/support-tickets/:id', async (req, res) => {
  try {
    const { status, resolution_notes } = req.body;
    await query(
      'UPDATE support_tickets SET status = COALESCE($1, status), resolution_notes = COALESCE($2, resolution_notes), updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [status || 'resolved', resolution_notes || null, req.params.id]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Referral Campaigns
router.get('/referrals/campaigns', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    let sql = 'SELECT * FROM referral_campaigns';
    const params = [];
    if (tenant_id) {
      params.push(tenant_id);
      sql += ' WHERE tenant_id = $1';
    }
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({
      ...r,
      _id: r.id,
      _creationTime: r.created_at ? new Date(r.created_at).getTime() : Date.now()
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/referrals/analytics', async (req, res) => {
  try {
    return res.json({
      totalReferrals: 0,
      totalCommissions: 0,
      pendingCommissions: 0,
      ledger: []
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/referrals/campaign', async (req, res) => {
  try {
    const { userId, code } = req.query;
    let result;
    if (code) {
      result = await query('SELECT * FROM referral_campaigns WHERE code = $1', [code]);
    } else if (userId) {
      result = await query('SELECT * FROM referral_campaigns WHERE created_by_user_id = $1', [userId]);
    } else {
      result = await query('SELECT * FROM referral_campaigns ORDER BY created_at DESC');
    }
    if (result.rows.length === 0) return res.json(null);
    return res.json({
      ...result.rows[0],
      _id: result.rows[0].id,
      _creationTime: result.rows[0].created_at ? new Date(result.rows[0].created_at).getTime() : Date.now()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
