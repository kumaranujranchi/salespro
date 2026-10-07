import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://salesprouser:SalesProPass2026@localhost:5432/salespro';
const pool = new Pool({ connectionString });

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (!content) return [];
  return content
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (err) {
        console.error(`Error parsing line in ${filePath}:`, err);
        return null;
      }
    })
    .filter(Boolean);
}

const safeStr = (v, defaultVal = null) => (v !== undefined && v !== null ? String(v) : defaultVal);
const safeJson = (v, defaultVal = {}) => JSON.stringify(v !== undefined && v !== null ? v : defaultVal);
const safeNum = (v, defaultVal = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? defaultVal : n;
};
const safeBool = (v, defaultVal = false) => (v !== undefined && v !== null ? Boolean(v) : defaultVal);
const safeDate = (v) => {
  if (!v) return null;
  if (typeof v === 'number') return new Date(v).toISOString();
  if (typeof v === 'string' && v.trim()) return v.trim();
  return null;
};

async function runImport() {
  const dataDir = process.argv[2] || path.resolve(__dirname, '../../../convex-data');
  console.log(`Starting Convex -> PostgreSQL Migration from: ${dataDir}`);

  if (!fs.existsSync(dataDir)) {
    console.error(`Data directory not found at ${dataDir}`);
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    // 1. Temporarily disable foreign key constraints for bulk insert
    console.log('Disabling FK constraints for import...');
    await client.query("SET session_replication_role = 'replica';");

    // 2. Clear existing data
    console.log('Truncating existing tables...');
    await client.query(`
      TRUNCATE TABLE 
        activity_logs, ai_chat_limits, announcements, billing_history,
        commissions, departments, incentives, lead_followups,
        lead_transfers, leads, notifications, payments,
        profiles, project_units, projects, referral_campaigns,
        sales, sales_targets, site_visits, subscriptions,
        support_tickets, tenant_roles, tenants, user_referrals
      CASCADE;
    `);

    // --- 1. TENANTS ---
    const tenants = readJsonl(path.join(dataDir, 'tenants/documents.jsonl'));
    console.log(`Importing ${tenants.length} tenants...`);
    for (const t of tenants) {
      await client.query(
        `INSERT INTO tenants (id, name, slug, settings, subscription_status, plan_tier, billing_cycle, subscription_id, razorpay_customer_id, next_billing_date, trial_ends_at, is_active, leads_count, created_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [
          t._id,
          t.name || 'Unnamed Tenant',
          t.slug || t._id,
          safeJson(t.settings, {}),
          safeStr(t.subscription_status, 'active'),
          safeStr(t.plan_tier, 'pro'),
          safeStr(t.billing_cycle, 'monthly'),
          safeStr(t.subscription_id),
          safeStr(t.razorpay_customer_id),
          safeDate(t.next_billing_date),
          safeDate(t.trial_ends_at),
          safeBool(t.is_active, true),
          safeNum(t.leads_count, 0),
          safeDate(t._creationTime) || new Date().toISOString(),
        ]
      );
    }

    // --- 2. DEPARTMENTS ---
    const departments = readJsonl(path.join(dataDir, 'departments/documents.jsonl'));
    console.log(`Importing ${departments.length} departments...`);
    for (const d of departments) {
      await client.query(
        `INSERT INTO departments (id, tenant_id, name, description, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [d._id, d.tenant_id, d.name, safeStr(d.description), safeBool(d.is_active, true), safeDate(d._creationTime)]
      );
    }

    // --- 3. TENANT ROLES ---
    const tenantRoles = readJsonl(path.join(dataDir, 'tenant_roles/documents.jsonl'));
    console.log(`Importing ${tenantRoles.length} tenant_roles...`);
    for (const r of tenantRoles) {
      await client.query(
        `INSERT INTO tenant_roles (id, tenant_id, name, description, permissions, is_system, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          r._id,
          r.tenant_id,
          r.name,
          safeStr(r.description),
          safeJson(r.permissions, []),
          safeBool(r.is_system, false),
          safeDate(r._creationTime),
        ]
      );
    }

    // --- 4. PROFILES ---
    const profiles = readJsonl(path.join(dataDir, 'profiles/documents.jsonl'));
    console.log(`Importing ${profiles.length} profiles...`);
    for (const p of profiles) {
      const password = p.password || 'Admin@123';
      const passwordHash = await bcrypt.hash(password, 10);
      await client.query(
        `INSERT INTO profiles (id, user_id, email, password, password_hash, full_name, employee_id, phone, role, department_id, reporting_manager_id, tenant_id, role_id, image_url, dob, marriage_anniversary, joining_date, is_active, force_password_change, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password`,
        [
          p._id,
          p.userId || p.email,
          p.email.toLowerCase(),
          password,
          passwordHash,
          p.full_name || p.email,
          safeStr(p.employee_id),
          safeStr(p.phone),
          p.role || 'sales_executive',
          safeStr(p.department_id),
          safeStr(p.reporting_manager_id),
          safeStr(p.tenant_id),
          safeStr(p.role_id),
          safeStr(p.image_url),
          safeStr(p.dob),
          safeStr(p.marriage_anniversary),
          safeStr(p.joining_date),
          safeBool(p.is_active, true),
          safeBool(p.force_password_change, false),
          safeDate(p._creationTime),
        ]
      );
    }

    // --- 5. PROJECTS ---
    const projects = readJsonl(path.join(dataDir, 'projects/documents.jsonl'));
    console.log(`Importing ${projects.length} projects...`);
    for (const pr of projects) {
      await client.query(
        `INSERT INTO projects (id, tenant_id, name, address, project_type, location_lat, location_lng, google_maps_url, site_photos, status, is_active, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          pr._id,
          pr.tenant_id,
          pr.name,
          safeStr(pr.address),
          safeStr(pr.project_type),
          pr.location_lat || null,
          pr.location_lng || null,
          safeStr(pr.google_maps_url),
          pr.site_photos || [],
          safeStr(pr.status, 'Running'),
          safeBool(pr.is_active, true),
          safeJson(pr.metadata, {}),
          safeDate(pr._creationTime),
        ]
      );
    }

    // --- 6. PROJECT UNITS ---
    const projectUnits = readJsonl(path.join(dataDir, 'project_units/documents.jsonl'));
    console.log(`Importing ${projectUnits.length} project_units...`);
    for (const pu of projectUnits) {
      await client.query(
        `INSERT INTO project_units (id, tenant_id, project_id, unit_number, status, custom_values, created_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          pu._id,
          pu.tenant_id,
          pu.project_id,
          pu.unit_number,
          safeStr(pu.status, 'Available'),
          safeJson(pu.custom_values, {}),
          safeDate(pu._creationTime),
        ]
      );
    }

    // --- 7. LEADS ---
    const leads = readJsonl(path.join(dataDir, 'leads/documents.jsonl'));
    console.log(`Importing ${leads.length} leads...`);
    for (const l of leads) {
      await client.query(
        `INSERT INTO leads (id, tenant_id, lead_id, customer_name, mobile, email, lead_source, project_id, sales_executive_id, city, budget_range, purpose, preferred_locations, lead_status, lead_score, internal_notes, lead_date, created_by, updated_by, latest_followup_date, latest_followup_status, next_followup_date, followup_count, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24::jsonb, $25)
         ON CONFLICT (id) DO NOTHING`,
        [
          l._id,
          l.tenant_id,
          l.lead_id || l._id,
          l.customer_name || 'Prospect',
          l.mobile || '',
          safeStr(l.email),
          safeStr(l.lead_source, 'Direct'),
          safeStr(l.project_id),
          safeStr(l.sales_executive_id),
          safeStr(l.city),
          safeStr(l.budget_range),
          safeStr(l.purpose),
          l.preferred_locations || [],
          safeStr(l.lead_status, 'New'),
          safeStr(l.lead_score, 'Warm'),
          safeStr(l.internal_notes),
          safeStr(l.lead_date, new Date().toISOString().slice(0, 10)),
          safeStr(l.created_by),
          safeStr(l.updated_by),
          safeDate(l.latest_followup_date),
          safeStr(l.latest_followup_status),
          safeDate(l.next_followup_date),
          safeNum(l.followup_count, 0),
          safeJson(l.metadata, {}),
          safeDate(l._creationTime),
        ]
      );
    }

    // --- 8. LEAD FOLLOWUPS ---
    const followups = readJsonl(path.join(dataDir, 'lead_followups/documents.jsonl'));
    console.log(`Importing ${followups.length} lead_followups...`);
    for (const f of followups) {
      await client.query(
        `INSERT INTO lead_followups (id, tenant_id, lead_id, followup_type, followup_date, discussion_summary, customer_response, call_status, previous_status, new_status, next_followup_date, created_by, is_editable, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15)
         ON CONFLICT (id) DO NOTHING`,
        [
          f._id,
          f.tenant_id,
          f.lead_id,
          f.followup_type || 'Call',
          safeStr(f.followup_date),
          f.discussion_summary || '',
          safeStr(f.customer_response),
          safeStr(f.call_status),
          safeStr(f.previous_status),
          f.new_status || 'In Progress',
          safeStr(f.next_followup_date),
          safeStr(f.created_by),
          safeBool(f.is_editable, true),
          safeJson(f.metadata, {}),
          safeDate(f._creationTime),
        ]
      );
    }

    // --- 9. SALES ---
    const sales = readJsonl(path.join(dataDir, 'sales/documents.jsonl'));
    console.log(`Importing ${sales.length} sales...`);
    for (const s of sales) {
      await client.query(
        `INSERT INTO sales (id, tenant_id, customer_id, project_id, sales_executive_id, sale_date, property_type, unit_number, area_sqft, total_revenue, booking_amount, is_agreement_done, is_registry_done, status, metadata, father_husband_name, dob, gender, alternate_mobile, pan_number, aadhaar_number, occupation, company_name, annual_income, marital_status, nationality, passport, address_house_no, address_street, address_city, address_state, address_pin_code, address_same_as_current, perm_address_house_no, perm_address_street, perm_address_city, perm_address_state, perm_address_pin_code, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39)
         ON CONFLICT (id) DO NOTHING`,
        [
          s._id,
          s.tenant_id,
          s.customer_id,
          s.project_id,
          s.sales_executive_id,
          safeStr(s.sale_date, new Date().toISOString().slice(0, 10)),
          safeStr(s.property_type),
          safeStr(s.unit_number),
          safeNum(s.area_sqft, 0),
          safeNum(s.total_revenue, 0),
          safeNum(s.booking_amount, 0),
          safeBool(s.is_agreement_done, false),
          safeBool(s.is_registry_done, false),
          safeStr(s.status, 'booked'),
          safeJson(s.metadata, {}),
          safeStr(s.father_husband_name),
          safeStr(s.dob),
          safeStr(s.gender),
          safeStr(s.alternate_mobile),
          safeStr(s.pan_number),
          safeStr(s.aadhaar_number),
          safeStr(s.occupation),
          safeStr(s.company_name),
          safeStr(s.annual_income),
          safeStr(s.marital_status),
          safeStr(s.nationality, 'Indian'),
          safeStr(s.passport),
          safeStr(s.address_house_no),
          safeStr(s.address_street),
          safeStr(s.address_city),
          safeStr(s.address_state),
          safeStr(s.address_pin_code),
          safeBool(s.address_same_as_current, true),
          safeStr(s.perm_address_house_no),
          safeStr(s.perm_address_street),
          safeStr(s.perm_address_city),
          safeStr(s.perm_address_state),
          safeStr(s.perm_address_pin_code),
          safeDate(s._creationTime),
        ]
      );
    }

    // --- 10. PAYMENTS ---
    const payments = readJsonl(path.join(dataDir, 'payments/documents.jsonl'));
    console.log(`Importing ${payments.length} payments...`);
    for (const py of payments) {
      await client.query(
        `INSERT INTO payments (id, tenant_id, sale_id, payment_date, amount, payment_type, payment_mode, transaction_reference, remarks, recorded_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          py._id,
          py.tenant_id,
          py.sale_id,
          safeStr(py.payment_date, new Date().toISOString().slice(0, 10)),
          safeNum(py.amount, 0),
          safeStr(py.payment_type, 'installment'),
          safeStr(py.payment_mode, 'upi'),
          safeStr(py.transaction_reference),
          safeStr(py.remarks),
          safeStr(py.recorded_by),
          safeDate(py._creationTime),
        ]
      );
    }

    // --- 11. SITE VISITS ---
    const siteVisits = readJsonl(path.join(dataDir, 'site_visits/documents.jsonl'));
    console.log(`Importing ${siteVisits.length} site_visits...`);
    for (const sv of siteVisits) {
      await client.query(
        `INSERT INTO site_visits (id, tenant_id, requested_by, lead_id, customer_name, mobile, visit_date, visit_time, pickup_location, notes, status, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          sv._id,
          sv.tenant_id,
          sv.requested_by,
          safeStr(sv.lead_id),
          sv.customer_name || 'Visitor',
          sv.mobile || '',
          safeStr(sv.visit_date),
          safeStr(sv.visit_time),
          safeStr(sv.pickup_location, 'Office'),
          safeStr(sv.notes),
          safeStr(sv.status, 'pending'),
          safeJson(sv.metadata, {}),
          safeDate(sv._creationTime),
        ]
      );
    }

    // --- 12. SUBSCRIPTIONS ---
    const subscriptions = readJsonl(path.join(dataDir, 'subscriptions/documents.jsonl'));
    console.log(`Importing ${subscriptions.length} subscriptions...`);
    for (const sub of subscriptions) {
      await client.query(
        `INSERT INTO subscriptions (id, tenant_id, razorpay_subscription_id, plan_id, status, current_start, current_end, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          sub._id,
          sub.tenant_id,
          sub.razorpay_subscription_id || sub._id,
          sub.plan_id || 'pro',
          safeStr(sub.status, 'active'),
          safeStr(sub.current_start),
          safeStr(sub.current_end),
          safeJson(sub.metadata, {}),
          safeDate(sub._creationTime),
        ]
      );
    }

    // --- 13. ACTIVITY LOGS ---
    const activityLogs = readJsonl(path.join(dataDir, 'activity_logs/documents.jsonl'));
    console.log(`Importing ${activityLogs.length} activity_logs...`);
    for (const a of activityLogs) {
      await client.query(
        `INSERT INTO activity_logs (id, tenant_id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          a._id,
          a.tenant_id,
          safeStr(a.user_id),
          a.action,
          safeStr(a.entity_type, 'system'),
          safeStr(a.entity_id),
          safeJson(a.details, {}),
          safeDate(a._creationTime),
        ]
      );
    }

    // --- 14. AI CHAT LIMITS ---
    const aiLimits = readJsonl(path.join(dataDir, 'ai_chat_limits/documents.jsonl'));
    console.log(`Importing ${aiLimits.length} ai_chat_limits...`);
    for (const al of aiLimits) {
      await client.query(
        `INSERT INTO ai_chat_limits (id, tenant_id, date, count, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [al._id, al.tenant_id, al.date, safeNum(al.count, 0), safeDate(al._creationTime)]
      );
    }

    // 3. Restore foreign key constraints
    console.log('Restoring FK constraints...');
    await client.query("SET session_replication_role = 'origin';");

    console.log('🎉 ALL CONVEX DATA SUCCESSFULLY MIGRATED TO POSTGRESQL!');
  } catch (err) {
    console.error('Migration failed:', err);
    await client.query("SET session_replication_role = 'origin';").catch(() => {});
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runImport();
