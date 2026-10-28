import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// Supported lead sources -> { integration settings key, canonical lead_source label }
const PORTALS = {
  meta: { integrationKey: 'meta', leadSource: 'Meta' },
  facebook: { integrationKey: 'meta', leadSource: 'Meta' },
  google_ads: { integrationKey: 'google', leadSource: 'Google' },
  google: { integrationKey: 'google', leadSource: 'Google' },
  nine_nine_acres: { integrationKey: 'nineNineAcres', leadSource: '99acres' },
  '99acres': { integrationKey: 'nineNineAcres', leadSource: '99acres' },
  magicbricks: { integrationKey: 'magicbricks', leadSource: 'MagicBrick' },
  housing: { integrationKey: 'housing', leadSource: 'Housing' },
  whatsapp: { integrationKey: 'whatsapp', leadSource: 'WhatsApp' },
  google_form: { integrationKey: 'googleForm', leadSource: 'Google Form' },
  google_sheet: { integrationKey: 'googleSheet', leadSource: 'Google Sheet' },
};

const FIELD_KEYS = {
  name: ['customer_name', 'full_name', 'fullname', 'name', 'your_name', 'customer name',
    'full name', 'name of the customer', 'sender_name', 'first_name'],
  mobile: ['mobile', 'mobile_number', 'mobile number', 'phone', 'phone_number', 'phone number',
    'contact', 'contact_number', 'contact number', 'contact_no', 'whatsapp', 'whatsapp_number',
    'wa_id', 'mobile_no', 'phone_no', 'your mobile number'],
  email: ['email', 'email_address', 'email address', 'e_mail', 'e-mail', 'your email', 'emailid'],
  city: ['city', 'location', 'preferred_location', 'preferred location', 'your city'],
  budget: ['budget', 'budget_range', 'budget range', 'your budget'],
  purpose: ['purpose', 'requirement', 'interested_in', 'property_type', 'interest'],
  notes: ['message', 'remarks', 'comments', 'comment', 'notes', 'query', 'description', 'details', 'text', 'enquiry'],
};

function compactKey(key) {
  return String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Portals send wildly different shapes. Flatten everything we can recognise.
function flattenPayload(payload, out = {}) {
  if (!payload || typeof payload !== 'object') return out;

  if (Array.isArray(payload)) {
    payload.forEach((item) => flattenPayload(item, out));
    return out;
  }

  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'object') {
      // Meta lead ads: field_data: [{ name, values: [] }]
      if (Array.isArray(value) && value.length && (value[0]?.name || value[0]?.column_name || value[0]?.key)) {
        value.forEach((entry) => {
          const fieldName = entry.name || entry.column_name || entry.key;
          const fieldValue = entry.values
            ? (Array.isArray(entry.values) ? entry.values[0] : entry.values)
            : (entry.string_value ?? entry.value);
          if (fieldName && fieldValue !== undefined && fieldValue !== null) {
            out[compactKey(fieldName)] = fieldValue;
          }
        });
        continue;
      }
      flattenPayload(value, out);
      continue;
    }

    const compact = compactKey(key);
    if (compact && out[compact] === undefined) out[compact] = value;
  }

  return out;
}

function pick(fields, keys) {
  for (const key of keys) {
    const value = fields[compactKey(key)];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return null;
}

export function normalizeLead(payload) {
  const fields = flattenPayload(payload);

  let name = pick(fields, FIELD_KEYS.name);
  const lastName = pick(fields, ['last_name', 'surname']);
  if (name && lastName && !name.toLowerCase().includes(lastName.toLowerCase())) {
    name = `${name} ${lastName}`;
  }

  return {
    customer_name: name || 'Unknown',
    mobile: pick(fields, FIELD_KEYS.mobile),
    email: pick(fields, FIELD_KEYS.email),
    city: pick(fields, FIELD_KEYS.city),
    budget_range: pick(fields, FIELD_KEYS.budget),
    purpose: pick(fields, FIELD_KEYS.purpose),
    notes: pick(fields, FIELD_KEYS.notes),
    externalId: pick(fields, ['lead_id', 'entry_id']),
    recognizedKeys: Object.keys(fields).length,
  };
}

async function pickRoundRobinExecutive(tenantId) {
  const result = await query(
    `SELECT p.id, COUNT(l.id) AS active_leads
       FROM profiles p
       LEFT JOIN leads l
         ON l.sales_executive_id = p.id
        AND COALESCE(l.lead_status, 'New') NOT IN ('Converted', 'Lost')
      WHERE p.tenant_id = $1
        AND p.is_active = true
        AND LOWER(REPLACE(COALESCE(p.role, ''), ' ', '_')) NOT IN ('super_admin', 'platform_admin', 'admin', 'director')
      GROUP BY p.id
      ORDER BY active_leads ASC, p.created_at ASC
      LIMIT 1`,
    [tenantId]
  );
  return result.rows[0]?.id || null;
}

async function handleInboundLead(req, res) {
  try {
    const portalParam = String(req.query.portal || req.query.source || 'direct').toLowerCase();
    const portal = PORTALS[portalParam] || { integrationKey: null, leadSource: req.query.portal || 'Direct' };
    const tenantId = req.query.token || req.query.tenantId || req.query.tenant_id || req.body?.tenant_id;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Missing tenant token. Use /api/v1/inbound-leads?portal=<portal>&token=<tenant_id>',
      });
    }

    const tenantResult = await query('SELECT id, name, settings FROM tenants WHERE id = $1', [tenantId]);
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Unknown tenant token' });
    }

    const settings = tenantResult.rows[0].settings || {};
    const integration = portal.integrationKey ? settings.integrations?.[portal.integrationKey] : null;

    if (integration && integration.enabled === false) {
      return res.status(403).json({ error: `The ${portal.leadSource} integration is disabled for this workspace` });
    }

    // Google Ads appends the configured passphrase so we can reject spoofed posts.
    if (portal.integrationKey === 'google' && integration?.googleKey) {
      const payloadKey = req.body?.google_key || req.query.google_key;
      if (payloadKey !== integration.googleKey) {
        return res.status(401).json({ error: 'Invalid google_key' });
      }
    }

    const payload = req.body && Object.keys(req.body).length ? req.body : req.query;
    const lead = normalizeLead(payload);

    if (!lead.mobile && !lead.email) {
      return res.status(400).json({
        error: 'Could not find a mobile number or email in the payload',
        received_fields: lead.recognizedKeys,
      });
    }

    if (lead.externalId) {
      const duplicate = await query(
        `SELECT id FROM leads WHERE tenant_id = $1 AND metadata->>'external_id' = $2 LIMIT 1`,
        [tenantId, lead.externalId]
      );
      if (duplicate.rows.length > 0) {
        return res.json({ success: true, duplicate: true, id: duplicate.rows[0].id });
      }
    }

    const salesExecutiveId = integration?.assignmentRule === 'round_robin'
      ? await pickRoundRobinExecutive(tenantId)
      : null;

    const leadId = `LEAD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
    const metadata = {
      source: 'webhook',
      portal: portalParam,
      external_id: lead.externalId,
      received_at: new Date().toISOString(),
      raw: payload,
    };

    const inserted = await query(
      `INSERT INTO leads
        (tenant_id, lead_id, customer_name, mobile, email, lead_source, sales_executive_id,
         budget_range, city, purpose, internal_notes, lead_status, lead_score, lead_date, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'New', 'Warm', CURRENT_DATE::text, $12)
       RETURNING id, lead_id`,
      [
        tenantId,
        leadId,
        lead.customer_name,
        lead.mobile,
        lead.email,
        portal.leadSource,
        salesExecutiveId,
        lead.budget_range,
        lead.city,
        lead.purpose,
        lead.notes,
        JSON.stringify(metadata),
      ]
    );

    return res.status(201).json({
      success: true,
      id: inserted.rows[0].id,
      lead_id: inserted.rows[0].lead_id,
      assigned_to: salesExecutiveId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Google Ads can also be pointed at the /api/google-webhook?tenantId=<id> URL.
function handleGoogleWebhook(req, res) {
  req.query.portal = 'google_ads';
  if (!req.query.token) req.query.token = req.query.tenantId || req.query.tenant_id;
  return handleInboundLead(req, res);
}

router.post('/v1/inbound-leads', handleInboundLead);
router.post('/google-webhook', handleGoogleWebhook);

// Opening the URL in a browser should explain how to use it instead of 404-ing.
const usage = (_req, res) => res.json({
  endpoint: 'POST /api/v1/inbound-leads',
  example: '/api/v1/inbound-leads?portal=meta&token=<tenant_id>',
  portals: Object.keys(PORTALS),
});

router.get('/v1/inbound-leads', usage);
router.get('/google-webhook', usage);

export default router;
