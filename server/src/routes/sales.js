import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// 1. List Sales
router.get('/', async (req, res) => {
  try {
    const { tenant_id, executive_id, project_id, status } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    let sql = `
      SELECT s.*, 
        l.customer_name as lead_customer_name, l.mobile as lead_mobile,
        p.name as project_name,
        pr.full_name as executive_name
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

    sql += ` ORDER BY s.sale_date DESC`;

    const result = await query(sql, params);
    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
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

export default router;
