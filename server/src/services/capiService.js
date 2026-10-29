import crypto from 'node:crypto';
import { query } from '../db/index.js';

let tableChecked = false;
async function ensureCapiTableExists() {
  if (tableChecked) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS capi_events_log (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        lead_id VARCHAR(255) REFERENCES leads(id) ON DELETE SET NULL,
        platform VARCHAR(50) NOT NULL DEFAULT 'meta',
        event_name VARCHAR(100) NOT NULL,
        event_id VARCHAR(255),
        event_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'success',
        payload JSONB DEFAULT '{}'::jsonb,
        response JSONB DEFAULT '{}'::jsonb,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_capi_events_tenant ON capi_events_log(tenant_id, created_at DESC);
    `);
    tableChecked = true;
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Standard SHA-256 hashing required by Meta Conversions API & Google Ads
 */
export function sha256(val) {
  if (!val) return undefined;
  const str = String(val).trim().toLowerCase();
  if (!str) return undefined;
  return crypto.createHash('sha256').update(str).digest('hex');
}
export const hashSha256 = sha256;

/**
 * Normalizes phone number to E.164 standard without plus/spaces for Meta CAPI
 * E.g. "9876543210" -> "919876543210"
 */
export function normalizePhoneForCapi(phone) {
  if (!phone) return undefined;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return undefined;

  // If 10 digits (Standard Indian mobile), prepend 91 country code
  if (digits.length === 10) {
    digits = `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Sends a server-side conversion event to Meta Conversions API (Graph API v19.0)
 */
export async function sendMetaCAPIEvent({
  pixelId,
  accessToken,
  eventName,
  eventId,
  lead,
  customData = {},
  testEventCode,
  tenantId
}) {
  if (!pixelId || !accessToken) {
    throw new Error('Meta Pixel ID and Access Token are required');
  }

  await ensureCapiTableExists();

  const metadata = (typeof lead?.metadata === 'object' && lead?.metadata) ? lead.metadata : {};
  const nowUnix = Math.floor(Date.now() / 1000);

  // Extract name parts
  let fn = undefined;
  let ln = undefined;
  if (lead?.customer_name) {
    const parts = lead.customer_name.trim().split(/\s+/);
    fn = parts[0] ? sha256(parts[0]) : undefined;
    ln = parts.length > 1 ? sha256(parts.slice(1).join(' ')) : undefined;
  }

  // Construct Meta CAPI user_data with SHA-256 hashed values
  const userData = {
    ph: lead?.mobile ? [sha256(normalizePhoneForCapi(lead.mobile))] : undefined,
    em: lead?.email ? [sha256(lead.email)] : undefined,
    fn: fn ? [fn] : undefined,
    ln: ln ? [ln] : undefined,
    ct: lead?.city ? [sha256(lead.city)] : undefined,
    country: [sha256('in')],
    client_ip_address: metadata.client_ip || metadata.ip || undefined,
    client_user_agent: metadata.user_agent || undefined,
    fbp: metadata.fbp || undefined,
    fbc: metadata.fbc ? (metadata.fbc.startsWith('fb.') ? metadata.fbc : `fb.1.${nowUnix}.${metadata.fbc}`) : (metadata.fbclid ? `fb.1.${nowUnix}.${metadata.fbclid}` : undefined),
    lead_id: metadata.leadgen_id ? Number(metadata.leadgen_id) || undefined : undefined,
  };

  // Remove undefined keys in user_data
  Object.keys(userData).forEach((k) => userData[k] === undefined && delete userData[k]);

  const eventPayload = {
    event_name: eventName,
    event_time: nowUnix,
    event_id: eventId || `lead_${lead?.id || 'test'}_${eventName.toLowerCase()}_${nowUnix}`,
    action_source: 'system_generated',
    user_data: userData,
    custom_data: {
      currency: customData.currency || 'INR',
      value: customData.value !== undefined ? Number(customData.value) : 0,
      lead_status: customData.lead_status || lead?.lead_status || undefined,
      content_name: customData.content_name || customData.project_name || undefined,
      status: customData.status || undefined,
    }
  };

  const bodyData = {
    data: [eventPayload],
  };

  if (testEventCode) {
    bodyData.test_event_code = testEventCode;
  }

  const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

  let resData = null;
  let isSuccess = false;
  let errorMsg = null;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    });

    resData = await response.json();

    if (response.ok && !resData.error) {
      isSuccess = true;
    } else {
      errorMsg = resData.error?.message || 'Meta CAPI returned an error';
    }
  } catch (netErr) {
    errorMsg = netErr.message;
  }

  // Audit log
  if (tenantId) {
    try {
      await query(
        `INSERT INTO capi_events_log
          (tenant_id, lead_id, platform, event_name, event_id, status, payload, response, error_message)
         VALUES ($1, $2, 'meta', $3, $4, $5, $6, $7, $8)`,
        [
          tenantId,
          lead?.id || null,
          eventName,
          eventPayload.event_id,
          isSuccess ? 'success' : 'failed',
          JSON.stringify(eventPayload),
          JSON.stringify(resData || {}),
          errorMsg
        ]
      );
    } catch {
      // Non-blocking log
    }
  }

  if (!isSuccess) {
    throw new Error(errorMsg || 'Failed to dispatch Meta CAPI event');
  }

  return { success: true, response: resData, event_id: eventPayload.event_id };
}

/**
 * High-level CRM Conversion Event Dispatcher.
 * Inspects tenant configuration and triggers Meta CAPI & Google Offline Conversions.
 */
export async function dispatchCrmConversionEvent(lead, newStatus, tenantOrTenantId, extraData = {}) {
  if (!lead || !newStatus) return;

  try {
    // 1. Resolve tenant settings
    let tenant = null;
    const tenantId = typeof tenantOrTenantId === 'string' ? tenantOrTenantId : tenantOrTenantId?.id;
    if (typeof tenantOrTenantId === 'object' && tenantOrTenantId?.settings) {
      tenant = tenantOrTenantId;
    } else if (tenantId) {
      const tRes = await query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      if (tRes.rows.length > 0) tenant = tRes.rows[0];
    }

    if (!tenant) return;

    const metaConfig = tenant.settings?.integrations?.meta_capi;
    if (!metaConfig || !metaConfig.enabled || !metaConfig.pixelId || !metaConfig.accessToken) {
      return; // CAPI not enabled for this tenant
    }

    const statusNorm = String(newStatus).toLowerCase().replace(/[\s_-]+/g, '_');

    let eventName = null;
    let eventValue = 0;

    // 2. Map CRM Status to Meta CAPI standard events
    if (statusNorm === 'qualified' && metaConfig.sendQualified !== false) {
      eventName = 'Qualified_Lead';
    } else if (statusNorm === 'site_visit_scheduled' && metaConfig.sendSiteVisit !== false) {
      eventName = 'Schedule';
    } else if (statusNorm === 'site_visit_done' && metaConfig.sendSiteVisit !== false) {
      eventName = 'Site_Visit_Done';
      eventValue = metaConfig.siteVisitValue ? Number(metaConfig.siteVisitValue) : 0;
    } else if (statusNorm === 'converted' && metaConfig.sendSale !== false) {
      eventName = 'Purchase';
      eventValue = extraData.total_revenue !== undefined
        ? Number(extraData.total_revenue)
        : (Number(lead.budget_range?.replace(/[^0-9.]/g, '')) || 0);
    } else if (statusNorm === 'contacted' && metaConfig.sendContacted) {
      eventName = 'Lead';
    }

    if (!eventName) return;

    // 3. Dispatch to Meta CAPI
    await sendMetaCAPIEvent({
      pixelId: metaConfig.pixelId,
      accessToken: metaConfig.accessToken,
      eventName,
      lead,
      tenantId: tenant.id,
      testEventCode: metaConfig.testEventCode || undefined,
      customData: {
        value: eventValue,
        currency: 'INR',
        lead_status: newStatus,
        project_name: extraData.project_name || lead.project_name,
      }
    });

  } catch (err) {
    console.warn(`[CAPI Dispatch Warning] Lead ${lead?.id} event failed:`, err.message);
  }
}
