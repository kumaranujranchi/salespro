import { Router } from 'express';
import { query } from '../db/index.js';
import { createSaleFromLead } from '../services/leadToSale.js';
import { dispatchCrmConversionEvent } from '../services/capiService.js';
import { sendLeadWelcomeWhatsApp } from '../services/whatsappService.js';

const router = Router();

// 1. List Leads with filtering and search
router.get('/', async (req, res) => {
  try {
    const { 
      tenant_id, 
      status, statusFilter, 
      executive_id, executiveFilter, 
      search, searchQuery, 
      project_id, 
      score, scoreFilter,
      date_filter, dateFilter,
      start_date, startDate,
      end_date, endDate,
      showOnlyMyLeads,
      profileId,
      limit = 200, offset = 0 
    } = req.query;

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

    // Status filter
    const effStatus = status || statusFilter;
    if (effStatus && effStatus !== 'all') {
      if (effStatus === 'active') {
        sql += ` AND l.lead_status NOT IN ('Lost', 'Disqualified', 'Closed')`;
      } else {
        params.push(effStatus);
        sql += ` AND l.lead_status = $${params.length}`;
      }
    }

    // Score filter
    const effScore = score || scoreFilter;
    if (effScore && effScore !== 'all') {
      params.push(effScore);
      sql += ` AND l.lead_score ILIKE $${params.length}`;
    }

    // Executive filter
    let effExec = executive_id || executiveFilter;
    if (showOnlyMyLeads === 'true' || showOnlyMyLeads === true) {
      effExec = profileId || req.user?.id;
    }
    if (effExec && effExec !== 'all') {
      params.push(effExec);
      sql += ` AND l.sales_executive_id = $${params.length}`;
    }

    // Project filter
    if (project_id && project_id !== 'all') {
      params.push(project_id);
      sql += ` AND l.project_id = $${params.length}`;
    }

    // Search query
    const effSearch = search || searchQuery;
    if (effSearch && String(effSearch).trim()) {
      params.push(`%${String(effSearch).trim()}%`);
      sql += ` AND (l.customer_name ILIKE $${params.length} OR l.mobile ILIKE $${params.length} OR l.lead_id ILIKE $${params.length} OR l.city ILIKE $${params.length})`;
    }

    // Date filter
    const effDateFilter = date_filter || dateFilter;
    const effStart = start_date || startDate;
    const effEnd = end_date || endDate;

    if (effDateFilter === 'today') {
      sql += ` AND DATE(COALESCE(l.created_at, NOW())) = CURRENT_DATE`;
    } else if (effDateFilter === 'yesterday') {
      sql += ` AND DATE(COALESCE(l.created_at, NOW())) = CURRENT_DATE - INTERVAL '1 day'`;
    } else if (effDateFilter === 'this_week') {
      sql += ` AND COALESCE(l.created_at, NOW()) >= date_trunc('week', CURRENT_TIMESTAMP)`;
    } else if (effDateFilter === 'this_month') {
      sql += ` AND COALESCE(l.created_at, NOW()) >= date_trunc('month', CURRENT_TIMESTAMP)`;
    } else if (effDateFilter === 'last_30_days') {
      sql += ` AND COALESCE(l.created_at, NOW()) >= CURRENT_TIMESTAMP - INTERVAL '30 days'`;
    } else if (effDateFilter === 'custom' || effStart || effEnd) {
      if (effStart) {
        params.push(effStart);
        sql += ` AND DATE(COALESCE(l.created_at, NOW())) >= $${params.length}::date`;
      }
      if (effEnd) {
        params.push(effEnd);
        sql += ` AND DATE(COALESCE(l.created_at, NOW())) <= $${params.length}::date`;
      }
    }

    sql += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({
      ...r,
      _id: r.id,
      project: r.project_name ? { id: r.project_id, _id: r.project_id, name: r.project_name } : (r.project_id ? { id: r.project_id, _id: r.project_id, name: 'Project' } : null),
      sales_executive: r.sales_executive_name ? { id: r.sales_executive_id, _id: r.sales_executive_id, full_name: r.sales_executive_name } : (r.sales_executive_id ? { id: r.sales_executive_id, _id: r.sales_executive_id, full_name: 'Executive' } : null)
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    const { 
      tenant_id, 
      executive_id, executiveFilter,
      date_filter, dateFilter,
      start_date, startDate,
      end_date, endDate 
    } = req.query;

    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    let filterClause = 'tenant_id = $1';
    const params = [tenant_id];

    const effExec = executive_id || executiveFilter;
    if (effExec && effExec !== 'all') {
      params.push(effExec);
      filterClause += ` AND sales_executive_id = $${params.length}`;
    }

    const effDateFilter = date_filter || dateFilter;
    const effStart = start_date || startDate;
    const effEnd = end_date || endDate;

    if (effDateFilter === 'today') {
      filterClause += ` AND DATE(COALESCE(created_at, NOW())) = CURRENT_DATE`;
    } else if (effDateFilter === 'yesterday') {
      filterClause += ` AND DATE(COALESCE(created_at, NOW())) = CURRENT_DATE - INTERVAL '1 day'`;
    } else if (effDateFilter === 'this_week') {
      filterClause += ` AND COALESCE(created_at, NOW()) >= date_trunc('week', CURRENT_TIMESTAMP)`;
    } else if (effDateFilter === 'this_month') {
      filterClause += ` AND COALESCE(created_at, NOW()) >= date_trunc('month', CURRENT_TIMESTAMP)`;
    } else if (effDateFilter === 'last_30_days') {
      filterClause += ` AND COALESCE(created_at, NOW()) >= CURRENT_TIMESTAMP - INTERVAL '30 days'`;
    } else if (effDateFilter === 'custom' || effStart || effEnd) {
      if (effStart) {
        params.push(effStart);
        filterClause += ` AND DATE(COALESCE(created_at, NOW())) >= $${params.length}::date`;
      }
      if (effEnd) {
        params.push(effEnd);
        filterClause += ` AND DATE(COALESCE(created_at, NOW())) <= $${params.length}::date`;
      }
    }

    const counts = await query(
      `SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE lead_status = 'New') as new_leads,
        COUNT(*) FILTER (WHERE lead_status = 'Contacted') as contacted_leads,
        COUNT(*) FILTER (WHERE lead_status IN ('In Progress', 'Contacted', 'Negotiation', 'Site Visit Scheduled')) as in_progress_leads,
        COUNT(*) FILTER (WHERE lead_status = 'Qualified') as qualified_leads,
        COUNT(*) FILTER (WHERE lead_status IN ('Site Visit Scheduled', 'Site Visit Done')) as site_visit_leads,
        COUNT(*) FILTER (WHERE lead_status = 'Negotiation') as negotiation_leads,
        COUNT(*) FILTER (WHERE lead_status = 'Converted') as converted_leads,
        COUNT(*) FILTER (WHERE lead_status IN ('Lost', 'Disqualified')) as lost_leads,
        -- Sources
        COUNT(*) FILTER (WHERE lead_source ILIKE '%referral%') as referral_leads,
        COUNT(*) FILTER (WHERE lead_source ILIKE '%99acres%') as acres_leads,
        COUNT(*) FILTER (WHERE lead_source ILIKE '%magic%') as magic_brick_leads,
        COUNT(*) FILTER (WHERE lead_source ILIKE '%housing%') as housing_leads,
        COUNT(*) FILTER (WHERE lead_source ILIKE '%meta%' OR lead_source ILIKE '%facebook%' OR lead_source ILIKE '%instagram%') as meta_leads,
        COUNT(*) FILTER (WHERE lead_source ILIKE '%google%') as google_leads,
        COUNT(*) FILTER (WHERE lead_source ILIKE '%walk%') as walk_in_leads
       FROM leads WHERE ${filterClause}`,
      params
    );

    const r = counts.rows[0] || {};
    const total = parseInt(r.total_leads || 0, 10);
    const newL = parseInt(r.new_leads || 0, 10);
    const qual = parseInt(r.qualified_leads || 0, 10);
    const inProg = parseInt(r.in_progress_leads || 0, 10);
    const conv = parseInt(r.converted_leads || 0, 10);
    const cont = parseInt(r.contacted_leads || 0, 10);
    const sv = parseInt(r.site_visit_leads || 0, 10);
    const lost = parseInt(r.lost_leads || 0, 10);

    return res.json({
      // snake_case
      total_leads: total,
      new_leads: newL,
      qualified_leads: qual,
      in_progress_leads: inProg,
      converted_leads: conv,
      contacted_leads: cont,
      site_visit_leads: sv,
      lost_leads: lost,

      // camelCase
      totalLeads: total,
      newLeads: newL,
      qualified: qual,
      inProgress: inProg,
      converted: conv,
      contacted: cont,
      siteVisitDone: sv,
      lost: lost,

      // Sources
      referralLeads: parseInt(r.referral_leads || 0, 10),
      acresLeads: parseInt(r.acres_leads || 0, 10),
      magicBrickLeads: parseInt(r.magic_brick_leads || 0, 10),
      housingLeads: parseInt(r.housing_leads || 0, 10),
      metaLeads: parseInt(r.meta_leads || 0, 10),
      googleLeads: parseInt(r.google_leads || 0, 10),
      walkInLeads: parseInt(r.walk_in_leads || 0, 10),

      // Call & Activity Overview structures for CRMDashboardPage
      callOverview: {
        all_time: { total: total, connected: conv + inProg + cont },
        today: { total: newL, connected: cont },
        yesterday: { total: 0, connected: 0 },
        this_week: { total: total, connected: cont },
        this_month: { total: total, connected: conv + cont }
      },
      agentActivity: {
        total: total,
        today: newL,
        yesterday: 0,
        this_week: total,
        this_month: total,
        all_time: total
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2b. Per-Executive Lead Statistics (for Assign modal & executive lead distribution)
router.get('/executive-stats', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const targetTenantId = tenant_id || req.user?.tenant_id;
    if (!targetTenantId) return res.status(400).json({ error: 'tenant_id required' });

    // 1. Fetch active profiles for this tenant
    const profilesResult = await query(
      `SELECT p.id, p.full_name, p.role, p.image_url, r.name as role_name
       FROM profiles p
       LEFT JOIN tenant_roles r ON p.role_id = r.id
       WHERE p.tenant_id = $1 AND (p.is_active = true OR p.is_active IS NULL)
       ORDER BY p.full_name ASC`,
      [targetTenantId]
    );

    // 2. Fetch lead status counts grouped by sales_executive_id
    const leadStatsResult = await query(
      `SELECT 
        sales_executive_id,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE lead_status = 'New') as new_count,
        COUNT(*) FILTER (WHERE lead_status = 'Contacted') as contacted_count,
        COUNT(*) FILTER (WHERE lead_status IN ('In Progress', 'Negotiation', 'Site Visit Scheduled')) as in_progress_count,
        COUNT(*) FILTER (WHERE lead_status = 'Qualified') as qualified_count,
        COUNT(*) FILTER (WHERE lead_status = 'Converted') as converted_count,
        COUNT(*) FILTER (WHERE lead_status IN ('Lost', 'Disqualified')) as lost_count
       FROM leads
       WHERE tenant_id = $1 AND sales_executive_id IS NOT NULL
       GROUP BY sales_executive_id`,
      [targetTenantId]
    );

    const statsByExecId = new Map();
    for (const row of leadStatsResult.rows) {
      statsByExecId.set(String(row.sales_executive_id), row);
    }

    // Role check helper (case-insensitive & space/underscore agnostic)
    const isSalesRole = (role, roleName) => {
      const combined = `${role || ''} ${roleName || ''}`.toLowerCase().replace(/[\s_-]+/g, '');
      return (
        combined.includes('sales') ||
        combined.includes('executive') ||
        combined.includes('manager') ||
        combined.includes('leader') ||
        combined.includes('agent') ||
        combined.includes('advisor') ||
        combined.includes('caller') ||
        combined.includes('telecaller')
      );
    };

    let eligibleProfiles = profilesResult.rows.filter(p => isSalesRole(p.role, p.role_name));
    if (eligibleProfiles.length === 0) {
      eligibleProfiles = profilesResult.rows;
    }

    const executiveStats = eligibleProfiles.map(p => {
      const stat = statsByExecId.get(String(p.id)) || {};
      const total = parseInt(stat.total || 0, 10);
      const newL = parseInt(stat.new_count || 0, 10);
      const cont = parseInt(stat.contacted_count || 0, 10);
      const inProg = parseInt(stat.in_progress_count || 0, 10);
      const qual = parseInt(stat.qualified_count || 0, 10);
      const conv = parseInt(stat.converted_count || 0, 10);
      const lost = parseInt(stat.lost_count || 0, 10);

      return {
        id: p.id,
        _id: p.id,
        name: p.full_name || 'Executive',
        role: p.role_name || p.role || 'Sales Executive',
        avatar: p.image_url || null,
        total,
        new: newL,
        contacted: cont,
        inProgress: inProg,
        qualified: qual,
        converted: conv,
        lost,
      };
    });

    return res.json(executiveStats);
  } catch (err) {
    console.error('getExecutiveLeadStats error:', err);
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

    const targetTenantId = tenant_id || req.user?.tenant_id;
    if (!targetTenantId) return res.status(400).json({ error: 'tenant_id is required' });

    // Check Free Plan Lead Limit (Maximum 1,000 leads)
    const tenantRes = await query('SELECT plan_tier, subscription_status FROM tenants WHERE id = $1', [targetTenantId]);
    const tenantRow = tenantRes.rows[0];
    const isProOrEnterprise = tenantRow?.plan_tier === 'pro' || tenantRow?.plan_tier === 'enterprise' || tenantRow?.subscription_status === 'active';

    if (!isProOrEnterprise) {
      const countRes = await query('SELECT COUNT(*) as count FROM leads WHERE tenant_id = $1', [targetTenantId]);
      const currentLeadsCount = parseInt(countRes.rows[0]?.count || '0', 10);
      if (currentLeadsCount >= 1000) {
        return res.status(403).json({
          error: 'Free Plan limit reached (Maximum 1,000 leads). Please delete older leads or upgrade to Pro Plan to add more leads.'
        });
      }
    }

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

    // If lead is created directly as Converted, create corresponding Sale record
    if (lead_status && String(lead_status).toLowerCase() === 'converted') {
      try {
        await createSaleFromLead(lead, req.user?.id);
      } catch (saleErr) {
        console.error('Error creating sale from converted lead on creation:', saleErr);
      }
    }

    // Asynchronously trigger automated WhatsApp welcome if enabled
    sendLeadWelcomeWhatsApp({
      tenantId: tenant_id,
      lead,
    }).catch(waErr => {
      console.warn('[Leads] WhatsApp auto-welcome async warning:', waErr.message);
    });

    return res.status(201).json({ ...lead, _id: lead.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3b. Bulk Insert Leads with duplicate detection and row-by-row error report
router.post('/bulk-insert', async (req, res) => {
  try {
    const { tenant_id, leads = [], created_by } = req.body;
    const targetTenantId = tenant_id || req.user?.tenant_id;

    if (!targetTenantId) {
      return res.status(400).json({ error: 'tenant_id is required' });
    }

    // Check Free Plan Lead Limit for bulk insert
    const tenantRes = await query('SELECT plan_tier, subscription_status FROM tenants WHERE id = $1', [targetTenantId]);
    const tenantRow = tenantRes.rows[0];
    const isProOrEnterprise = tenantRow?.plan_tier === 'pro' || tenantRow?.plan_tier === 'enterprise' || tenantRow?.subscription_status === 'active';

    if (!isProOrEnterprise) {
      const countRes = await query('SELECT COUNT(*) as count FROM leads WHERE tenant_id = $1', [targetTenantId]);
      const currentLeadsCount = parseInt(countRes.rows[0]?.count || '0', 10);
      if (currentLeadsCount + leads.length > 1000) {
        return res.status(403).json({
          error: `Free Plan limit exceeded. You currently have ${currentLeadsCount} leads (Maximum limit is 1,000). Adding ${leads.length} leads would exceed your limit. Please delete older leads or upgrade to Pro Plan.`
        });
      }
    }

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.json({
        success: true,
        total: 0,
        inserted: 0,
        failed: 0,
        details: []
      });
    }

    // Fetch existing mobile numbers in this tenant to identify duplicates
    const existingRes = await query(
      `SELECT mobile FROM leads WHERE tenant_id = $1`,
      [targetTenantId]
    );

    const existingMobiles = new Set();
    for (const r of existingRes.rows) {
      if (r.mobile) {
        const digits = String(r.mobile).replace(/\D/g, '');
        if (digits.length >= 10) {
          existingMobiles.add(digits.slice(-10));
        } else if (digits.length > 0) {
          existingMobiles.add(digits);
        }
      }
    }

    const batchMobiles = new Set();
    const details = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < leads.length; i++) {
      const item = leads[i];
      const rowNum = i + 2; // Row 1 is header in Excel
      const rawMobile = item.mobile !== undefined && item.mobile !== null ? String(item.mobile).trim() : '';
      const mobileDigits = rawMobile.replace(/\D/g, '');
      const customerName = String(item.customer_name || 'Unknown').trim();

      // Validation 1: Missing or too short mobile number
      if (!rawMobile || mobileDigits.length < 10) {
        failedCount++;
        details.push({
          row: rowNum,
          customer_name: customerName,
          mobile: rawMobile || 'Empty',
          status: 'failed',
          reason: 'Invalid or missing mobile number (must have at least 10 digits)'
        });
        continue;
      }

      const normalized10 = mobileDigits.slice(-10);

      // Validation 2: Duplicate within the uploaded file itself
      if (batchMobiles.has(normalized10)) {
        failedCount++;
        details.push({
          row: rowNum,
          customer_name: customerName,
          mobile: rawMobile,
          status: 'failed',
          reason: 'Duplicate entry in current upload file'
        });
        continue;
      }

      // Validation 3: Duplicate with an existing lead in the CRM
      if (existingMobiles.has(normalized10)) {
        failedCount++;
        details.push({
          row: rowNum,
          customer_name: customerName,
          mobile: rawMobile,
          status: 'failed',
          reason: 'Duplicate: Mobile number already exists in CRM'
        });
        continue;
      }

      // Passed validations: insert into database
      batchMobiles.add(normalized10);
      existingMobiles.add(normalized10);

      const leadId = `LEAD-${Date.now().toString().slice(-6)}-${successCount + 1}`;
      const leadDate = item.lead_date ? String(item.lead_date).split('T')[0] : new Date().toISOString().split('T')[0];

      try {
        const insertRes = await query(
          `INSERT INTO leads
            (tenant_id, lead_id, customer_name, mobile, email, lead_source,
             project_id, sales_executive_id, budget_range, city, purpose,
             lead_status, lead_score, internal_notes, lead_date, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           RETURNING id, lead_id`,
          [
            targetTenantId,
            leadId,
            customerName,
            rawMobile,
            item.email ? String(item.email).trim() : null,
            item.lead_source || 'Walk-in',
            item.project_id || null,
            item.sales_executive_id || null,
            item.budget_range || '<50L',
            item.city ? String(item.city).trim() : null,
            item.purpose || 'Investment',
            item.lead_status || 'New',
            item.lead_score || 'Warm',
            item.internal_notes || null,
            leadDate,
            created_by || req.user?.id || null
          ]
        );

        successCount++;
        details.push({
          row: rowNum,
          customer_name: customerName,
          mobile: rawMobile,
          status: 'success',
          lead_id: insertRes.rows[0].lead_id
        });
      } catch (insertErr) {
        failedCount++;
        details.push({
          row: rowNum,
          customer_name: customerName,
          mobile: rawMobile,
          status: 'failed',
          reason: insertErr.message || 'Database error during insertion'
        });
      }
    }

    return res.json({
      success: true,
      total: leads.length,
      inserted: successCount,
      failed: failedCount,
      details
    });
  } catch (err) {
    console.error('Bulk lead insert error:', err);
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
      'lead_status', 'lead_score', 'internal_notes', 'lead_date', 'preferred_locations'
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

    // If status updated, fetch lead and handle side effects (CAPI & Sale creation)
    if (body.lead_status) {
      try {
        const leadRes = await query('SELECT * FROM leads WHERE id = $1', [id]);
        if (leadRes.rows.length > 0) {
          const updatedLead = leadRes.rows[0];

          // 1. Dispatch CAPI conversion event in background
          dispatchCrmConversionEvent(updatedLead, body.lead_status, updatedLead.tenant_id).catch(() => {});

          // 2. If status updated to Converted, automatically create/link Sale record
          if (String(body.lead_status).toLowerCase() === 'converted') {
            const saleId = await createSaleFromLead(updatedLead, req.user?.id);
            return res.json({ success: true, sale_id: saleId });
          }
        }
      } catch (err) {
        console.error('Error handling lead status update side effects:', err);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4a. Explicit Convert Lead to Sale Endpoint
router.post('/:id/convert', async (req, res) => {
  try {
    const { id } = req.params;
    const overrides = req.body || {};

    await query(
      `UPDATE leads SET lead_status = 'Converted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    const leadRes = await query('SELECT * FROM leads WHERE id = $1', [id]);
    if (leadRes.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });

    const saleId = await createSaleFromLead(leadRes.rows[0], req.user?.id, overrides);

    // Dispatch CAPI Purchase / Converted event in background
    dispatchCrmConversionEvent(leadRes.rows[0], 'Converted', leadRes.rows[0].tenant_id, {
      total_revenue: overrides.total_revenue
    }).catch(() => {});

    return res.json({ success: true, lead_id: id, sale_id: saleId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4b. Bulk Update Status
router.post('/bulk-status', async (req, res) => {
  try {
    const { ids, lead_status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    await query(
      `UPDATE leads SET lead_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)`,
      [lead_status, ids]
    );

    if (lead_status && String(lead_status).toLowerCase() === 'converted') {
      try {
        const leadsRes = await query(`SELECT * FROM leads WHERE id = ANY($1)`, [ids]);
        for (const l of leadsRes.rows) {
          await createSaleFromLead(l, req.user?.id);
        }
      } catch (saleErr) {
        console.error('Bulk conversion sale creation warning:', saleErr);
      }
    }

    return res.json({ success: true, count: ids.length });
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
      [sales_executive_id || null, id]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5b. Bulk Assign Leads to Sales Executive
router.post('/bulk-assign', async (req, res) => {
  try {
    const { ids, sales_executive_id, updated_by } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const updater = updated_by || req.user?.id || null;
    await query(
      `UPDATE leads 
       SET sales_executive_id = $1, 
           updated_by = COALESCE($3, updated_by), 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ANY($2::text[])`,
      [sales_executive_id || null, ids, updater]
    );
    return res.json({ success: true, count: ids.length });
  } catch (err) {
    console.error('Bulk assign error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 5c. Bulk Update Project for Leads
router.post('/bulk-project', async (req, res) => {
  try {
    const { ids, project_id } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    await query(
      `UPDATE leads SET project_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)`,
      [project_id || null, ids]
    );
    return res.json({ success: true, count: ids.length });
  } catch (err) {
    console.error('Bulk project error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 6. Delete Lead
router.delete('/:id', async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'super_admin' && role !== 'platform_admin') {
      return res.status(403).json({ error: 'Only Super Admin can delete leads' });
    }
    const { id } = req.params;
    await query(`DELETE FROM leads WHERE id = $1`, [id]);
    return res.json({ success: true, id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6b. Bulk Delete Leads
router.post('/bulk-delete', async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'super_admin' && role !== 'platform_admin') {
      return res.status(403).json({ error: 'Only Super Admin can delete leads' });
    }
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    await query(`DELETE FROM leads WHERE id = ANY($1)`, [ids]);
    return res.json({ success: true, count: ids.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
