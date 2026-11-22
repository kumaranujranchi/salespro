import crypto from 'crypto';
import { query } from '../db/index.js';

let schemaInitialized = false;

/**
 * Initializes the DPDP Act Consent Audit Table and Indexes.
 * Idempotent: safe to run on server boot.
 */
export async function initConsentSchema() {
  if (schemaInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS dpdp_consent_logs (
        id VARCHAR(64) PRIMARY KEY,
        anonymous_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(100),
        policy_version VARCHAR(50) NOT NULL DEFAULT 'v1.0-2026',
        language VARCHAR(10) NOT NULL DEFAULT 'en',
        action_type VARCHAR(50) NOT NULL,
        preferences_essential BOOLEAN NOT NULL DEFAULT true,
        preferences_analytics BOOLEAN NOT NULL DEFAULT false,
        preferences_marketing BOOLEAN NOT NULL DEFAULT false,
        notice_text_hash VARCHAR(100) NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        lead_id VARCHAR(100),
        identifier VARCHAR(100),
        purpose VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE dpdp_consent_logs ALTER COLUMN action_type TYPE VARCHAR(50);
      ALTER TABLE dpdp_consent_logs ADD COLUMN IF NOT EXISTS lead_id VARCHAR(100);
      ALTER TABLE dpdp_consent_logs ADD COLUMN IF NOT EXISTS identifier VARCHAR(100);
      ALTER TABLE dpdp_consent_logs ADD COLUMN IF NOT EXISTS purpose VARCHAR(255);

      CREATE INDEX IF NOT EXISTS idx_dpdp_consent_anon ON dpdp_consent_logs (anonymous_id);
      CREATE INDEX IF NOT EXISTS idx_dpdp_consent_action ON dpdp_consent_logs (action_type);
      CREATE INDEX IF NOT EXISTS idx_dpdp_consent_created ON dpdp_consent_logs (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_dpdp_consent_identifier ON dpdp_consent_logs (identifier);
      CREATE INDEX IF NOT EXISTS idx_dpdp_consent_lead ON dpdp_consent_logs (lead_id);

      -- 3-Year Statutory Retention & WORM (Write-Once-Read-Many) Immutability Trigger
      -- Completely prohibits UPDATE and DELETE operations at the database engine level
      CREATE OR REPLACE FUNCTION prevent_dpdp_consent_modification()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'DPDP Act Statutory Violation: dpdp_consent_logs is an immutable 3-year legal audit ledger. UPDATE and DELETE operations are strictly prohibited.';
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_prevent_dpdp_consent_update_delete ON dpdp_consent_logs;
      CREATE TRIGGER trg_prevent_dpdp_consent_update_delete
      BEFORE UPDATE OR DELETE ON dpdp_consent_logs
      FOR EACH ROW
      EXECUTE FUNCTION prevent_dpdp_consent_modification();
    `);
    schemaInitialized = true;
    console.log('✔ DPDP Act (India) Consent Audit Ledger (3-Year WORM Protected) initialized');
  } catch (err) {
    console.error('DPDP Consent schema initialization error:', err.message);
  }
}

/**
 * Anonymizes an IP address for DPDP privacy compliance (masks last octet / blocks).
 */
export function anonymizeIp(ip) {
  if (!ip) return '0.0.0.0';
  const cleanIp = String(ip).trim();
  // IPv4
  if (cleanIp.includes('.')) {
    const parts = cleanIp.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  // IPv6
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    return parts.slice(0, 3).join(':') + '::0';
  }
  return 'masked_ip';
}

/**
 * Verifies or computes SHA-256 hash of a string.
 */
export function computeSha256(text) {
  if (!text) return '';
  return crypto.createHash('sha256').update(String(text).trim()).digest('hex');
}

/**
 * Records a verifiable consent proof in compliance with India's DPDP Act, 2023.
 */
export async function recordConsent({
  anonymousId,
  userId = null,
  policyVersion = 'v1.0-2026',
  language = 'en',
  actionType,
  preferences,
  noticeTextHash,
  ipAddress,
  userAgent,
}) {
  await initConsentSchema();

  if (!anonymousId) {
    throw new Error('anonymous_id is required for DPDP consent tracking');
  }

  const validActionTypes = [
    'GRANTED',
    'REJECTED',
    'UPDATED',
    'WITHDRAWN',
    'LEAD_CONSENT_GRANTED',
    'LEAD_CONSENT_WITHDRAWN',
    'DATA_ERASED',
    'DATA_ERASURE_REQUESTED',
  ];
  const normalizedAction = String(actionType || '').toUpperCase().trim();
  if (!validActionTypes.includes(normalizedAction)) {
    throw new Error(`Invalid action_type: ${actionType}. Must be one of: ${validActionTypes.join(', ')}`);
  }

  const normalizedLang = language === 'hi' ? 'hi' : 'en';
  const consentId = `dpdp_${crypto.randomUUID()}`;
  const maskedIp = anonymizeIp(ipAddress);

  const essential = true; // Essential is always strictly required for session & CSRF security
  const analytics = Boolean(preferences?.analytics);
  const marketing = Boolean(preferences?.marketing);

  const cleanHash = String(noticeTextHash || '').trim() || computeSha256(`dpdp_notice_${policyVersion}_${normalizedLang}`);

  const res = await query(
    `
    INSERT INTO dpdp_consent_logs (
      id,
      anonymous_id,
      user_id,
      policy_version,
      language,
      action_type,
      preferences_essential,
      preferences_analytics,
      preferences_marketing,
      notice_text_hash,
      ip_address,
      user_agent,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
    RETURNING *
  `,
    [
      consentId,
      anonymousId,
      userId,
      policyVersion,
      normalizedLang,
      normalizedAction,
      essential,
      analytics,
      marketing,
      cleanHash,
      maskedIp,
      String(userAgent || '').slice(0, 500),
    ]
  );

  return res.rows[0];
}

/**
 * Retrieves the latest recorded consent state for a given anonymous_id.
 */
export async function getLatestConsent(anonymousId) {
  await initConsentSchema();
  if (!anonymousId) return null;

  const res = await query(
    `
    SELECT * FROM dpdp_consent_logs
    WHERE anonymous_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `,
    [anonymousId]
  );

  return res.rows[0] || null;
}

/**
 * Retrieves paginated consent logs for compliance audit reporting.
 */
export async function getConsentAuditLogs({ limit = 50, offset = 0, actionType = null, language = null }) {
  await initConsentSchema();

  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (actionType) {
    conditions.push(`action_type = $${paramIdx++}`);
    params.push(actionType.toUpperCase().trim());
  }

  if (language) {
    conditions.push(`language = $${paramIdx++}`);
    params.push(language.toLowerCase().trim());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) as total FROM dpdp_consent_logs ${whereClause}`, params);
  const total = parseInt(countRes.rows[0]?.total || '0', 10);

  const listParams = [...params, Math.min(Math.max(limit, 1), 200), Math.max(offset, 0)];
  const listRes = await query(
    `
    SELECT 
      id,
      anonymous_id,
      user_id,
      policy_version,
      language,
      action_type,
      preferences_essential,
      preferences_analytics,
      preferences_marketing,
      notice_text_hash,
      ip_address,
      user_agent,
      created_at
    FROM dpdp_consent_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `,
    listParams
  );

  // Summary statistics for compliance review
  const statsRes = await query(`
    SELECT
      COUNT(*) as total_records,
      COUNT(CASE WHEN action_type = 'GRANTED' THEN 1 END) as granted_count,
      COUNT(CASE WHEN action_type = 'REJECTED' THEN 1 END) as rejected_count,
      COUNT(CASE WHEN action_type = 'UPDATED' THEN 1 END) as updated_count,
      COUNT(CASE WHEN action_type = 'WITHDRAWN' THEN 1 END) as withdrawn_count,
      COUNT(CASE WHEN preferences_analytics = true THEN 1 END) as analytics_granted_count,
      COUNT(CASE WHEN preferences_marketing = true THEN 1 END) as marketing_granted_count
    FROM dpdp_consent_logs
  `);

  return {
    total,
    limit,
    offset,
    logs: listRes.rows,
    summary: statsRes.rows[0] || {},
  };
}

/**
 * Records an immutable consent proof for a captured lead (Web Form, Meta Ads, WhatsApp, Portal).
 * DPDP Act, 2023 Section 5 (Notice) & Section 6 (Consent Burden of Proof).
 */
export async function recordLeadConsent({
  leadId = null,
  identifier, // Mobile number or email address
  actionType = 'LEAD_CONSENT_GRANTED',
  purpose = 'Real Estate Inquiry, CRM Walkthrough & Communications',
  policyVersion = 'v1.0-2026',
  language = 'en',
  noticeText = 'I consent to receiving property details and communications via WhatsApp/Call under DPDP Act, 2023.',
  ipAddress = '0.0.0.0',
  userAgent = 'Lead Form / Webhook',
  anonymousId = null,
}) {
  await initConsentSchema();

  const noticeHash = computeSha256(noticeText);
  const maskedIp = anonymizeIp(ipAddress);
  const id = `dpdp_${crypto.randomUUID()}`;
  const cleanIdentifier = String(identifier || '').trim();
  const anonId =
    anonymousId ||
    `lead_${crypto.createHash('sha256').update(cleanIdentifier || id).digest('hex').slice(0, 32)}`;

  const res = await query(
    `
    INSERT INTO dpdp_consent_logs (
      id,
      anonymous_id,
      user_id,
      policy_version,
      language,
      action_type,
      preferences_essential,
      preferences_analytics,
      preferences_marketing,
      notice_text_hash,
      ip_address,
      user_agent,
      lead_id,
      identifier,
      purpose,
      created_at
    )
    VALUES ($1, $2, NULL, $3, $4, $5, true, true, true, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
    RETURNING *
  `,
    [
      id,
      anonId,
      policyVersion,
      language === 'hi' ? 'hi' : 'en',
      actionType,
      noticeHash,
      maskedIp,
      String(userAgent || '').slice(0, 500),
      leadId ? String(leadId) : null,
      cleanIdentifier ? cleanIdentifier.slice(0, 100) : null,
      purpose ? String(purpose).slice(0, 255) : null,
    ]
  );

  return res.rows[0];
}

/**
 * Executes Data Principal Right to Erasure & Consent Withdrawal.
 * DPDP Act, 2023 Section 12 (Right to Erasure) & Section 6(4) (Withdrawal of Consent).
 * Anonymizes PII across leads and stops all automated communications.
 */
export async function processDataErasureRequest({
  identifier, // Phone number or email
  reason = 'Data Principal requested erasure under DPDP Act Section 12',
  ipAddress = '0.0.0.0',
  userAgent = 'DSR Portal / WhatsApp STOP',
}) {
  await initConsentSchema();

  if (!identifier) {
    throw new Error('Identifier (mobile number or email) is required for data erasure');
  }

  const rawIdent = String(identifier).trim();
  const last10Digits = rawIdent.replace(/\D/g, '').slice(-10);
  const emailMatch = rawIdent.includes('@') ? rawIdent.toLowerCase() : null;

  let erasedLeadsCount = 0;
  let erasedConversationsCount = 0;

  // 1. Anonymize matching leads in the leads table
  if (last10Digits.length === 10 || emailMatch) {
    try {
      const leadConditions = [];
      const leadParams = [];
      let pIdx = 1;

      if (last10Digits.length === 10) {
        leadConditions.push(`mobile LIKE $${pIdx++}`);
        leadParams.push(`%${last10Digits}`);
      }
      if (emailMatch) {
        leadConditions.push(`LOWER(email) = $${pIdx++}`);
        leadParams.push(emailMatch);
      }

      const matchingLeadsRes = await query(
        `SELECT id, lead_id FROM leads WHERE ${leadConditions.join(' OR ')}`,
        leadParams
      );

      const matchingLeadIds = (matchingLeadsRes.rows || []).map((r) => r.id);
      if (matchingLeadIds.length > 0) {
        // Anonymize personal identifiable information (PII)
        const maskedPhone = last10Digits.length === 10 ? `${last10Digits.slice(0, 3)}•••••${last10Digits.slice(-2)}` : 'ERASED';
        await query(
          `
          UPDATE leads
          SET customer_name = 'Anonymized Data Principal',
              mobile = $1,
              email = NULL,
              lead_status = 'Lost / Disqualified',
              internal_notes = COALESCE(internal_notes, '') || ' [DPDP Act Sec 12: Data erased & consent withdrawn]',
              metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                'dpdp_erased', true,
                'dpdp_erased_at', CURRENT_TIMESTAMP,
                'dpdp_erasure_reason', $2::text
              )
          WHERE id = ANY($3::text[])
        `,
          [maskedPhone, reason, matchingLeadIds]
        );
        erasedLeadsCount = matchingLeadIds.length;
      }
    } catch (leadErr) {
      console.warn('[DPDP Erasure] Warning while updating leads table:', leadErr.message);
    }
  }

  // 2. Mark matching WhatsApp conversations as opted out
  if (last10Digits.length === 10) {
    try {
      const convRes = await query(
        `SELECT id FROM whatsapp_conversations WHERE phone LIKE $1`,
        [`%${last10Digits}`]
      );
      const convIds = (convRes.rows || []).map((r) => r.id);
      if (convIds.length > 0) {
        await query(
          `
          UPDATE whatsapp_conversations
          SET status = 'opted_out',
              customer_name = 'Opted-Out Visitor',
              metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                'opted_out', true,
                'opted_out_at', CURRENT_TIMESTAMP,
                'dpdp_status', 'WITHDRAWN'
              ),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($1::text[])
        `,
          [convIds]
        );
        erasedConversationsCount = convIds.length;
      }
    } catch (convErr) {
      console.warn('[DPDP Erasure] Warning while updating conversations:', convErr.message);
    }
  }

  // 3. Record permanent, immutable audit entry in dpdp_consent_logs
  const consentRecord = await recordLeadConsent({
    leadId: null,
    identifier: rawIdent,
    actionType: 'DATA_ERASURE_REQUESTED',
    purpose: 'Data Principal Erasure & Consent Withdrawal (DPDP Act Section 12)',
    noticeText: reason,
    ipAddress,
    userAgent,
  });

  return {
    success: true,
    erasure_proof_id: consentRecord.id,
    identifier: rawIdent,
    erased_leads_count: erasedLeadsCount,
    erased_conversations_count: erasedConversationsCount,
    recorded_at: consentRecord.created_at,
  };
}

/**
 * Safely looks up privacy information for a Data Principal (Right to Access - DPDP Section 11).
 * Never leaks sensitive data; returns high-level verification and audit logs.
 */
export async function lookupDataPrincipalData({ identifier }) {
  await initConsentSchema();

  if (!identifier) {
    throw new Error('Identifier is required');
  }

  const rawIdent = String(identifier).trim();
  const last10Digits = rawIdent.replace(/\D/g, '').slice(-10);
  const emailMatch = rawIdent.includes('@') ? rawIdent.toLowerCase() : null;

  // Search consent logs
  const logsRes = await query(
    `
    SELECT id, action_type, purpose, policy_version, created_at
    FROM dpdp_consent_logs
    WHERE identifier = $1 OR identifier LIKE $2
    ORDER BY created_at DESC
    LIMIT 20
  `,
    [rawIdent, `%${last10Digits}`]
  );

  // Check if lead exists
  let leadFound = false;
  let isErased = false;
  if (last10Digits.length === 10 || emailMatch) {
    const leadCheck = await query(
      `
      SELECT id, lead_status, metadata
      FROM leads
      WHERE (mobile LIKE $1 OR LOWER(COALESCE(email, '')) = $2)
      LIMIT 1
    `,
      [`%${last10Digits}`, emailMatch || '']
    );

    if (leadCheck.rows[0]) {
      leadFound = true;
      isErased = Boolean(leadCheck.rows[0].metadata?.dpdp_erased);
    }
  }

  return {
    identifier: rawIdent,
    has_stored_records: leadFound || logsRes.rows.length > 0,
    is_erased: isErased,
    consent_history: logsRes.rows,
  };
}
