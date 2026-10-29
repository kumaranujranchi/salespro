import { Router } from 'express';
import { query } from '../db/index.js';
import { syncConvertedLeadsForTenant } from '../services/leadToSale.js';

const router = Router();

// 1. List Sales
router.get('/', async (req, res) => {
  try {
    const { tenant_id, executive_id, project_id, status } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    // Self-healing: automatically ensure every converted CRM lead has a Sale record
    try {
      await syncConvertedLeadsForTenant(tenant_id);
    } catch (syncErr) {
      console.warn('Auto-sync converted leads warning:', syncErr.message);
    }

    let sql = `
      SELECT s.*, 
        l.customer_name as lead_customer_name, 
        l.mobile as lead_mobile,
        l.email as lead_email,
        l.lead_id as lead_code,
        l.city as lead_city,
        p.name as project_name,
        pr.full_name as executive_name,
        pr.email as executive_email
      FROM sales s
      LEFT JOIN leads l ON s.customer_id = l.id
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN profiles pr ON s.sales_executive_id = pr.id
      WHERE s.tenant_id = $1
    `;
    const params = [tenant_id];

    if (executive_id && executive_id !== 'all') {
      params.push(executive_id);
      sql += ` AND s.sales_executive_id = $${params.length}`;
    }
    if (project_id && project_id !== 'all') {
      params.push(project_id);
      sql += ` AND s.project_id = $${params.length}`;
    }
    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND s.status = $${params.length}`;
    }

    sql += ` ORDER BY s.sale_date DESC, s.created_at DESC`;

    const result = await query(sql, params);

    return res.json(result.rows.map(r => {
      const custName = r.lead_customer_name || r.co_applicant_name || 'Customer';
      const custPhone = r.lead_mobile || r.alternate_mobile || '';
      const custEmail = r.lead_email || '';
      const projName = r.project_name || 'General Project';
      const execName = r.executive_name || 'Assigned Executive';

      return {
        ...r,
        _id: r.id,
        // Nested structure required by SalesPage, SalesDetailsModal & SalesFormModal
        customer: {
          name: custName,
          phone: custPhone,
          email: custEmail,
          lead_id: r.lead_code || '',
          city: r.lead_city || r.address_city || '',
        },
        project: {
          name: projName,
          id: r.project_id,
        },
        sales_executive: {
          name: execName,
          email: r.executive_email || '',
          id: r.sales_executive_id,
        },
        // Flat convenience fields
        customer_name: custName,
        customer_phone: custPhone,
        customer_email: custEmail,
        project_name: projName,
        executive_name: execName,
      };
    }));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 1a. Sales Overview for Dashboards
router.get('/overview', async (req, res) => {
  try {
    const { tenant_id, executive_id, view = 'overall' } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const yearStart = `${currentYear}-01-01`;

    // 1. Determine which executive IDs to include
    let executiveIds = [];
    if (view === 'self' && executive_id) {
      executiveIds = [executive_id];
    } else if (view === 'team' && executive_id) {
      try {
        const teamRes = await query(
          `WITH RECURSIVE subordinates AS (
             SELECT id FROM profiles WHERE id = $1
             UNION ALL
             SELECT p.id FROM profiles p
             INNER JOIN subordinates s ON p.reporting_manager_id = s.id
           ) SELECT id FROM subordinates`,
          [executive_id]
        );
        executiveIds = teamRes.rows.map(r => r.id);
      } catch (e) {
        executiveIds = [executive_id];
      }
    } else {
      const allRes = await query('SELECT id FROM profiles WHERE tenant_id = $1', [tenant_id]);
      executiveIds = allRes.rows.map(r => r.id);
    }

    if (executiveIds.length === 0 && executive_id) {
      executiveIds = [executive_id];
    }

    // 2. Fetch sales for these executives in this year
    let salesRows = [];
    if (executiveIds.length > 0) {
      const salesRes = await query(
        `SELECT s.*, p.name as project_name
         FROM sales s
         LEFT JOIN projects p ON s.project_id = p.id
         WHERE s.tenant_id = $1 
           AND s.sales_executive_id = ANY($2)
           AND s.sale_date >= $3
         ORDER BY s.sale_date DESC`,
        [tenant_id, executiveIds, yearStart]
      );
      salesRows = salesRes.rows;
    }

    const monthlySales = salesRows.filter(s => {
      const dStr = s.sale_date && s.sale_date.toISOString ? s.sale_date.toISOString().slice(0, 10) : String(s.sale_date || '').slice(0, 10);
      return dStr >= monthStart;
    });
    const ytdSales = salesRows;

    const monthlyRevenue = monthlySales.reduce((sum, s) => sum + Number(s.total_revenue || 0), 0);
    const ytdRevenue = ytdSales.reduce((sum, s) => sum + Number(s.total_revenue || 0), 0);
    const ytdTotalArea = ytdSales.reduce((sum, s) => sum + Number(s.area_sqft || 0), 0);

    // 3. Target for current user
    let targetAmount = 0;
    if (executive_id) {
      try {
        const targetRes = await query(
          `SELECT target_amount, target_sqft FROM sales_targets 
           WHERE user_id = $1 AND start_date <= $2 AND end_date >= $2
           ORDER BY created_at DESC LIMIT 1`,
          [executive_id, monthStart]
        );
        targetAmount = Number(targetRes.rows[0]?.target_amount || targetRes.rows[0]?.target_sqft || 0);
      } catch (e) {}
    }

    // 4. Incentives for current user or team
    let totalIncentives = 0;
    if (executive_id) {
      try {
        const incRes = await query(
          `SELECT COALESCE(SUM(total_incentive_amount), 0) as total
           FROM incentives 
           WHERE sales_executive_id = $1 AND calculation_year = $2`,
          [executive_id, currentYear]
        );
        totalIncentives = Number(incRes.rows[0]?.total || 0);
      } catch (e) {}
    }

    // 5. Project Stats
    const projectMap = new Map();
    for (const s of ytdSales) {
      const pName = s.project_name || 'Project';
      projectMap.set(pName, (projectMap.get(pName) || 0) + Number(s.area_sqft || 0));
    }
    const projectStats = Array.from(projectMap.entries())
      .map(([name, area]) => ({ name, area }))
      .sort((a, b) => b.area - a.area)
      .slice(0, 4);

    // 6. Trend (Last 6 Months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const name = d.toLocaleString('en-US', { month: 'short' });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthRev = salesRows
        .filter(s => {
          const sDate = s.sale_date && s.sale_date.toISOString ? s.sale_date.toISOString().slice(0, 7) : String(s.sale_date || '').slice(0, 7);
          return sDate === yearMonth;
        })
        .reduce((sum, s) => sum + Number(s.total_revenue || 0), 0);
      months.push({ name, sales: monthRev });
    }

    // 7. Team Targets & Site Visits
    let teamTargets = [];
    let siteVisits = { total: 0, avgPerExec: 0, conversionRate: 0 };

    if (view === 'team' || view === 'overall') {
      try {
        const targetsRes = await query(
          `SELECT st.*, p.full_name as user_name
           FROM sales_targets st
           JOIN profiles p ON st.user_id = p.id
           WHERE st.tenant_id = $1 AND st.user_id = ANY($2)`,
          [tenant_id, executiveIds]
        );
        teamTargets = targetsRes.rows.map(t => {
          const achieved = monthlySales
            .filter(s => s.sales_executive_id === t.user_id)
            .reduce((sum, s) => sum + Number(s.area_sqft || 0), 0);
          const targetSqft = Number(t.target_sqft || t.target_amount || 0);
          return {
            id: t.user_id,
            name: t.user_name || 'Unknown',
            targetAmount: targetSqft,
            achievedAmount: achieved,
            percentage: targetSqft > 0 ? Math.round((achieved / targetSqft) * 100) : 0
          };
        });

        const visitsRes = await query(
          `SELECT count(*) FROM site_visits 
           WHERE tenant_id = $1 AND requested_by = ANY($2)`,
          [tenant_id, executiveIds]
        );
        const totalVisits = Number(visitsRes.rows[0]?.count || 0);
        siteVisits = {
          total: totalVisits,
          avgPerExec: executiveIds.length > 0 ? Math.round(totalVisits / executiveIds.length) : 0,
          conversionRate: totalVisits > 0 ? Math.round((salesRows.length / totalVisits) * 100) : 0
        };
      } catch (e) {}
    }

    return res.json({
      mySales: monthlySales.length,
      monthlyRevenue,
      myTarget: targetAmount,
      achievementPercent: targetAmount > 0 ? Math.round((monthlyRevenue / targetAmount) * 100) : 0,
      totalIncentives,
      ytdSalesCount: ytdSales.length,
      ytdTotalArea,
      ytdRevenue,
      projectStats,
      salesTrend: months,
      teamTargets,
      siteVisits
    });
  } catch (err) {
    console.error('getSalesOverview error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 1b. Sales Analytics (Monthly breakdown for the year)
router.get('/analytics', async (req, res) => {
  try {
    const { tenant_id, executive_id, year } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    const targetYear = parseInt(year) || new Date().getFullYear();
    const startOfYear = `${targetYear}-01-01`;
    const endOfYear = `${targetYear}-12-31 23:59:59`;

    let salesSql = `
      SELECT sale_date, total_revenue 
      FROM sales 
      WHERE tenant_id = $1 AND sale_date >= $2 AND sale_date <= $3
    `;
    const salesParams = [tenant_id, startOfYear, endOfYear];
    if (executive_id && executive_id !== 'all') {
      salesParams.push(executive_id);
      salesSql += ` AND sales_executive_id = $${salesParams.length}`;
    }
    const salesRes = await query(salesSql, salesParams);

    const paymentsRes = await query(
      `SELECT payment_date, amount 
       FROM payments 
       WHERE tenant_id = $1 AND payment_date >= $2 AND payment_date <= $3`,
      [tenant_id, startOfYear, endOfYear]
    );

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const statsByMonth = monthNames.map((month, idx) => {
      const monthSales = salesRes.rows.filter(s => {
        const d = new Date(s.sale_date);
        return d.getFullYear() === targetYear && d.getMonth() === idx;
      });
      const monthPayments = paymentsRes.rows.filter(p => {
        const d = new Date(p.payment_date);
        return d.getFullYear() === targetYear && d.getMonth() === idx;
      });

      return {
        name: month,
        sales: monthSales.length,
        revenue: monthSales.reduce((sum, s) => sum + Number(s.total_revenue || 0), 0),
        collections: monthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      };
    });

    return res.json(statsByMonth);
  } catch (err) {
    console.error('getSalesAnalytics error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 1c. Sales Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { tenant_id, timeFilter = 'this_month', roleFilter = 'all' } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    const now = new Date();
    let startDate = new Date(now.getFullYear(), 0, 1);
    if (timeFilter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeFilter === 'this_week') {
      const day = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    } else if (timeFilter === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startStr = startDate.toISOString().slice(0, 10);

    let sql = `
      SELECT s.sales_executive_id, 
             p.full_name, p.role, p.image_url,
             count(s.id) as sales_count,
             COALESCE(sum(s.total_revenue), 0) as total_revenue
      FROM sales s
      JOIN profiles p ON s.sales_executive_id = p.id
      WHERE s.tenant_id = $1 AND s.sale_date >= $2
    `;
    const params = [tenant_id, startStr];

    if (roleFilter !== 'all') {
      params.push(roleFilter);
      sql += ` AND p.role = $${params.length}`;
    }

    sql += `
      GROUP BY s.sales_executive_id, p.full_name, p.role, p.image_url
      ORDER BY total_revenue DESC
      LIMIT 10
    `;

    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({
      id: r.sales_executive_id,
      name: r.full_name || 'Executive',
      salesCount: parseInt(r.sales_count || 0),
      revenue: parseFloat(r.total_revenue || 0),
      image_url: r.image_url || null,
    })));
  } catch (err) {
    console.error('getLeaderboard error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. Create Sale
router.post('/', async (req, res) => {
  try {
    const b = req.body;
    const result = await query(
      `INSERT INTO sales
        (tenant_id, customer_id, project_id, sales_executive_id, team_leader_id,
         sale_date, property_type, unit_number, area_sqft, rate_per_sqft,
         base_price, total_revenue, booking_amount, status,
         father_husband_name, dob, gender, alternate_mobile, pan_number, aadhaar_number,
         occupation, company_name, annual_income, marital_status, nationality,
         address_house_no, address_street, address_city, address_state, address_pin_code,
         perm_address_house_no, perm_address_street, perm_address_city, perm_address_state, perm_address_pin_code,
         co_applicant_name, co_applicant_relation, co_applicant_mobile, co_applicant_aadhaar)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
         $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
         $26, $27, $28, $29, $30, $31, $32, $33, $34, $35,
         $36, $37, $38, $39)
       RETURNING *`,
      [
        b.tenant_id, b.customer_id || null, b.project_id, b.sales_executive_id, b.team_leader_id || null,
        b.sale_date || new Date().toISOString().split('T')[0], b.property_type || null, b.unit_number || null,
        b.area_sqft || 0, b.rate_per_sqft || 0, b.base_price || 0, b.total_revenue || 0, b.booking_amount || 0,
        b.status || 'booked',
        b.father_husband_name || null, b.dob || null, b.gender || null, b.alternate_mobile || null,
        b.pan_number || null, b.aadhaar_number || null, b.occupation || null, b.company_name || null,
        b.annual_income || null, b.marital_status || null, b.nationality || 'Indian',
        b.address_house_no || null, b.address_street || null, b.address_city || null, b.address_state || null, b.address_pin_code || null,
        b.perm_address_house_no || null, b.perm_address_street || null, b.perm_address_city || null, b.perm_address_state || null, b.perm_address_pin_code || null,
        b.co_applicant_name || null, b.co_applicant_relation || null, b.co_applicant_mobile || null, b.co_applicant_aadhaar || null
      ]
    );

    const sale = result.rows[0];
    return res.status(201).json({ ...sale, _id: sale.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Update Sale
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

    await query(`UPDATE sales SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Payments for Sales
router.get('/payments', async (req, res) => {
  try {
    const { tenant_id, sale_id } = req.query;
    let sql = 'SELECT * FROM payments WHERE tenant_id = $1';
    const params = [tenant_id];

    if (sale_id) {
      params.push(sale_id);
      sql += ` AND sale_id = $${params.length}`;
    }

    sql += ' ORDER BY payment_date DESC';
    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Add Payment
router.post('/payments', async (req, res) => {
  try {
    const {
      tenant_id, sale_id, payment_date, amount, payment_type,
      payment_mode, transaction_reference, remarks, recorded_by
    } = req.body;

    const result = await query(
      `INSERT INTO payments
        (tenant_id, sale_id, payment_date, amount, payment_type, payment_mode, transaction_reference, remarks, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [tenant_id, sale_id, payment_date, amount, payment_type, payment_mode, transaction_reference || null, remarks || null, recorded_by || null]
    );

    const payment = result.rows[0];
    return res.status(201).json({ ...payment, _id: payment.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete Payment
router.delete('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM payments WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
