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
        action_type VARCHAR(20) NOT NULL,
        preferences_essential BOOLEAN NOT NULL DEFAULT true,
        preferences_analytics BOOLEAN NOT NULL DEFAULT false,
        preferences_marketing BOOLEAN NOT NULL DEFAULT false,
        notice_text_hash VARCHAR(100) NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_dpdp_consent_anon ON dpdp_consent_logs (anonymous_id);
      CREATE INDEX IF NOT EXISTS idx_dpdp_consent_action ON dpdp_consent_logs (action_type);
      CREATE INDEX IF NOT EXISTS idx_dpdp_consent_created ON dpdp_consent_logs (created_at DESC);
    `);
    schemaInitialized = true;
    console.log('✔ DPDP Act (India) Consent Audit Ledger & Schema initialized');
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

  const validActionTypes = ['GRANTED', 'REJECTED', 'UPDATED', 'WITHDRAWN'];
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
