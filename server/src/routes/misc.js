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

// Support Tickets
router.get('/support-tickets', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    let sql = 'SELECT * FROM support_tickets';
    const params = [];
    if (tenant_id) {
      params.push(tenant_id);
      sql += ' WHERE tenant_id = $1';
    }
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Referral Campaigns
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
    return res.json({ ...result.rows[0], _id: result.rows[0].id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
