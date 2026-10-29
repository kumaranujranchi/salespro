import { query } from '../db/index.js';

let columnsChecked = false;
async function ensureSalesColumnsFlexible() {
  if (columnsChecked) return;
  try {
    // Ensure project_id and sales_executive_id can be nullable so conversion never crashes
    await query('ALTER TABLE sales ALTER COLUMN project_id DROP NOT NULL').catch(() => {});
    await query('ALTER TABLE sales ALTER COLUMN sales_executive_id DROP NOT NULL').catch(() => {});
    columnsChecked = true;
  } catch {
    // Ignore if not permitted or already flexible
  }
}

/**
 * Parses numeric value from a budget string like "<50L", "50L-1Cr", "₹ 75,00,000", "7500000"
 */
export function parseEstimatedRevenue(budget) {
  if (!budget) return 0;
  const str = String(budget).trim();
  const digits = str.replace(/[^0-9.]/g, '');
  const num = parseFloat(digits);
  if (isNaN(num) || num <= 0) return 0;

  if (/cr/i.test(str)) {
    return num * 10000000;
  }
  if (/l/i.test(str) || num < 500) {
    return num * 100000;
  }
  return num;
}

/**
 * Creates or reactivates a Sale record from a converted CRM Lead.
 * Preserves all lead information: customer contact info, project, executive, budget, etc.
 */
export async function createSaleFromLead(lead, actorUserId, overrides = {}) {
  if (!lead || !lead.id || !lead.tenant_id) return null;

  await ensureSalesColumnsFlexible();

  // 1. Check if a sale already exists for this lead
  const existing = await query(
    `SELECT id, status FROM sales WHERE customer_id = $1 AND tenant_id = $2 LIMIT 1`,
    [lead.id, lead.tenant_id]
  );

  if (existing.rows.length > 0) {
    const saleId = existing.rows[0].id;
    if (existing.rows[0].status === 'cancelled') {
      await query(`UPDATE sales SET status = 'booked', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [saleId]);
    }
    return saleId;
  }

  // 2. Resolve Project ID
  let projectId = overrides.project_id || lead.project_id || null;
  if (!projectId) {
    try {
      const activeProj = await query(
        `SELECT id FROM projects WHERE tenant_id = $1 AND is_active = true ORDER BY created_at ASC LIMIT 1`,
        [lead.tenant_id]
      );
      if (activeProj.rows.length > 0) {
        projectId = activeProj.rows[0].id;
      } else {
        const anyProj = await query(
          `SELECT id FROM projects WHERE tenant_id = $1 ORDER BY created_at ASC LIMIT 1`,
          [lead.tenant_id]
        );
        if (anyProj.rows.length > 0) {
          projectId = anyProj.rows[0].id;
        }
      }
    } catch (e) {
      console.warn('Could not resolve fallback project for converted sale:', e.message);
    }
  }

  // 3. Resolve Sales Executive ID
  let executiveId = overrides.sales_executive_id || lead.sales_executive_id || null;
  let teamLeaderId = null;

  if (!executiveId && actorUserId) {
    try {
      const actorRes = await query(
        `SELECT id, role, reporting_manager_id FROM profiles WHERE (id = $1 OR user_id = $1) AND tenant_id = $2 LIMIT 1`,
        [actorUserId, lead.tenant_id]
      );
      if (actorRes.rows.length > 0) {
        executiveId = actorRes.rows[0].id;
        teamLeaderId = actorRes.rows[0].reporting_manager_id || null;
      }
    } catch (e) {
      console.warn('Could not resolve actor profile for converted sale:', e.message);
    }
  }

  if (!executiveId) {
    try {
      const fallbackExec = await query(
        `SELECT id, reporting_manager_id FROM profiles 
         WHERE tenant_id = $1 
         ORDER BY (CASE WHEN role='sales_executive' THEN 1 WHEN role='team_leader' THEN 2 ELSE 3 END)
         LIMIT 1`,
        [lead.tenant_id]
      );
      if (fallbackExec.rows.length > 0) {
        executiveId = fallbackExec.rows[0].id;
        teamLeaderId = fallbackExec.rows[0].reporting_manager_id || null;
      }
    } catch (e) {
      console.warn('Could not resolve fallback executive for converted sale:', e.message);
    }
  }

  if (executiveId && !teamLeaderId) {
    try {
      const mgrRes = await query(`SELECT reporting_manager_id FROM profiles WHERE id = $1`, [executiveId]);
      if (mgrRes.rows.length > 0) {
        teamLeaderId = mgrRes.rows[0].reporting_manager_id || null;
      }
    } catch {}
  }

  // 4. Calculate estimated revenue
  const revenue = overrides.total_revenue !== undefined
    ? Number(overrides.total_revenue) || 0
    : parseEstimatedRevenue(lead.budget_range);

  const bookingAmount = overrides.booking_amount !== undefined
    ? Number(overrides.booking_amount) || 0
    : 0;

  const unitNumber = overrides.unit_number || 'Pending Assignment';
  const saleDate = overrides.sale_date || new Date().toISOString().split('T')[0];

  // 5. Insert Sale record
  const result = await query(
    `INSERT INTO sales
      (tenant_id, customer_id, project_id, sales_executive_id, team_leader_id,
       sale_date, property_type, unit_number, area_sqft, rate_per_sqft,
       base_price, total_revenue, booking_amount, status,
       address_city, metadata)
     VALUES
      ($1, $2, $3, $4, $5,
       $6, $7, $8, $9, $10,
       $11, $12, $13, 'booked',
       $14, $15)
     RETURNING id`,
    [
      lead.tenant_id,
      lead.id,
      projectId,
      executiveId,
      teamLeaderId,
      saleDate,
      lead.purpose || 'Residential',
      unitNumber,
      0, // area_sqft to be updated in sales panel
      0, // rate_per_sqft to be updated in sales panel
      revenue, // base_price
      revenue, // total_revenue
      bookingAmount,
      lead.city || null,
      JSON.stringify({
        auto_converted_from_crm: true,
        crm_lead_id: lead.lead_id || lead.id,
        converted_at: new Date().toISOString(),
        customer_name: lead.customer_name,
        mobile: lead.mobile,
        email: lead.email,
        lead_source: lead.lead_source,
        budget_range: lead.budget_range,
        notes: lead.internal_notes || null,
      })
    ]
  );

  return result.rows[0]?.id;
}

/**
 * Self-healing sync: ensures every lead marked 'Converted' in this tenant has a Sale record.
 */
export async function syncConvertedLeadsForTenant(tenantId) {
  if (!tenantId) return 0;
  try {
    const unsynced = await query(
      `SELECT * FROM leads 
       WHERE tenant_id = $1 
         AND LOWER(COALESCE(lead_status, '')) = 'converted'
         AND id NOT IN (SELECT customer_id FROM sales WHERE tenant_id = $1 AND customer_id IS NOT NULL)`,
      [tenantId]
    );

    let createdCount = 0;
    for (const lead of unsynced.rows) {
      const saleId = await createSaleFromLead(lead);
      if (saleId) createdCount++;
    }
    return createdCount;
  } catch (err) {
    console.error('syncConvertedLeadsForTenant error:', err.message);
    return 0;
  }
}
