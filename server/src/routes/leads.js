import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// 1. List Leads with filtering and search
router.get('/', async (req, res) => {
  try {
    const { tenant_id, status, executive_id, search, project_id, limit = 100, offset = 0 } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id is required' });

    let sql = `
      SELECT l.*, 
        p.full_name as sales_executive_name,
        pr.name as project_name
      FROM leads l
      LEFT JOIN profiles p ON l.sales_executive_id = p.id
      LEFT JOIN projects pr ON l.project_id = pr.id
      WHERE l.tenant_id = $1
    `;
    const params = [tenant_id];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND l.lead_status = $${params.length}`;
    }
    if (executive_id && executive_id !== 'all') {
      params.push(executive_id);
      sql += ` AND l.sales_executive_id = $${params.length}`;
    }
    if (project_id && project_id !== 'all') {
      params.push(project_id);
      sql += ` AND l.project_id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (l.customer_name ILIKE $${params.length} OR l.mobile ILIKE $${params.length} OR l.lead_id ILIKE $${params.length})`;
    }

    sql += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    const { tenant_id, executive_id } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    let filterClause = 'tenant_id = $1';
    const params = [tenant_id];

    if (executive_id) {
      params.push(executive_id);
      filterClause += ` AND sales_executive_id = $2`;
    }

    const counts = await query(
      `SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE lead_status = 'New') as new_leads,
        COUNT(*) FILTER (WHERE lead_status = 'Contacted') as contacted_leads,
        COUNT(*) FILTER (WHERE lead_status = 'Site Visit Scheduled' OR lead_status = 'Site Visit Done') as site_visit_leads,
        COUNT(*) FILTER (WHERE lead_status = 'Negotiation') as negotiation_leads,
        COUNT(*) FILTER (WHERE lead_status = 'Converted') as converted_leads,
        COUNT(*) FILTER (WHERE lead_status = 'Lost') as lost_leads
       FROM leads WHERE ${filterClause}`,
      params
    );

    return res.json(counts.rows[0] || {});
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Create Lead
router.post('/', async (req, res) => {
  try {
    const {
      tenant_id, customer_name, mobile, email, lead_source,
      project_id, sales_executive_id, budget_range, city, purpose,
      lead_status = 'New', lead_score = 'Warm', internal_notes
    } = req.body;

    const leadId = `LEAD-${Date.now().toString().slice(-6)}`;

    const result = await query(
      `INSERT INTO leads
        (tenant_id, lead_id, customer_name, mobile, email, lead_source,
         project_id, sales_executive_id, budget_range, city, purpose,
         lead_status, lead_score, internal_notes, lead_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_DATE)
       RETURNING *`,
      [
        tenant_id, leadId, customer_name, mobile, email || null, lead_source || 'Direct',
        project_id || null, sales_executive_id || null, budget_range || null,
        city || null, purpose || null, lead_status, lead_score, internal_notes || null
      ]
    );

    const lead = result.rows[0];
    return res.status(201).json({ ...lead, _id: lead.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Update Lead
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const allowed = [
      'customer_name', 'mobile', 'email', 'lead_source', 'project_id',
      'sales_executive_id', 'budget_range', 'city', 'purpose',
      'lead_status', 'lead_score', 'internal_notes'
    ];

    const fields = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(body[key]);
      }
    }

    if (fields.length === 0) return res.json({ success: true });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(`UPDATE leads SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Assign Lead
router.post('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { sales_executive_id } = req.body;
    await query(
      `UPDATE leads SET sales_executive_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [sales_executive_id, id]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
