import { Router } from 'express';
import crypto from 'crypto';
import { recordConsent, getLatestConsent, getConsentAuditLogs } from '../services/consentService.js';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/index.js';

const router = Router();

/**
 * POST /api/v1/consent & /api/consent
 * Logs verifiable consent proof in compliance with India's DPDP Act, 2023.
 * Public endpoint (anonymous visitors can record consent before signing in).
 */
router.post('/', async (req, res) => {
  try {
    const {
      anonymous_id,
      policy_version,
      language,
      preferences,
      action_type,
      notice_text_hash,
      user_id,
    } = req.body || {};

    const anonId = anonymous_id || req.cookies?.dpdp_consent_id || crypto.randomUUID();
    const action = action_type || (preferences?.analytics || preferences?.marketing ? 'GRANTED' : 'REJECTED');

    // Extract client IP and User Agent
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      '0.0.0.0';

    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    const saved = await recordConsent({
      anonymousId: anonId,
      userId: user_id || (req.user?.id ? String(req.user.id) : null),
      policyVersion: policy_version || 'v1.0-2026',
      language: language === 'hi' ? 'hi' : 'en',
      actionType: action,
      preferences: preferences || { essential: true, analytics: false, marketing: false },
      noticeTextHash: notice_text_hash,
      ipAddress: clientIp,
      userAgent,
    });

    // Set secure long-lived cookie for persistent identifier (1 year)
    res.cookie('dpdp_consent_id', anonId, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: false, // Accessible to client-side JS for consent manager state
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return res.status(201).json({
      success: true,
      consent_id: saved.id,
      anonymous_id: saved.anonymous_id,
      action_type: saved.action_type,
      preferences: {
        essential: saved.preferences_essential,
        analytics: saved.preferences_analytics,
        marketing: saved.preferences_marketing,
      },
      policy_version: saved.policy_version,
      language: saved.language,
      recorded_at: saved.created_at,
    });
  } catch (err) {
    console.error('DPDP Consent logging error:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to record DPDP consent proof',
    });
  }
});

/**
 * GET /api/v1/consent/status
 * Retrieves latest recorded consent for an anonymous ID.
 */
router.get('/status', async (req, res) => {
  try {
    const anonymousId = req.query.anonymous_id || req.cookies?.dpdp_consent_id;
    if (!anonymousId) {
      return res.json({ success: true, consent: null });
    }

    const latest = await getLatestConsent(anonymousId);
    return res.json({
      success: true,
      consent: latest
        ? {
            id: latest.id,
            anonymous_id: latest.anonymous_id,
            policy_version: latest.policy_version,
            language: latest.language,
            action_type: latest.action_type,
            preferences: {
              essential: latest.preferences_essential,
              analytics: latest.preferences_analytics,
              marketing: latest.preferences_marketing,
            },
            recorded_at: latest.created_at,
          }
        : null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/consent/audit-logs
 * Protected admin route for DPDP Act audit ledger inspection & exports.
 */
router.get('/audit-logs', requireAuth, async (req, res) => {
  try {
    const role = req.user?.role;
    const isAllowed = ['super_admin', 'platform_admin', 'admin'].includes(role);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied: requires Admin role for DPDP audit records' });
    }

    const limit = parseInt(req.query.limit || '50', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const actionType = req.query.action_type || null;
    const language = req.query.language || null;

    const data = await getConsentAuditLogs({ limit, offset, actionType, language });
    return res.json({
      success: true,
      ...data,
    });
  } catch (err) {
    console.error('Failed to retrieve DPDP audit logs:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/consent/export-csv
 * Generates an immutable 3-year statutory compliance CSV audit report
 */
router.get('/export-csv', requireAuth, async (req, res) => {
  try {
    const role = req.user?.role;
    const isAllowed = ['super_admin', 'platform_admin', 'admin'].includes(role);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied: requires Admin role for DPDP audit exports' });
    }

    const { logs } = await getConsentAuditLogs({ limit: 10000, offset: 0 });

    const headers = [
      'Proof ID',
      'Anonymous Identifier',
      'User ID',
      'Policy Version',
      'Language',
      'Consent Action',
      'Essential Cookies',
      'Analytics Cookies',
      'Marketing Cookies',
      'Notice Text SHA256 Hash',
      'Masked IP Address',
      'User Agent',
      'Timestamp (UTC)',
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = logs.map((log) => [
      escapeCsv(log.id),
      escapeCsv(log.anonymous_id),
      escapeCsv(log.user_id || 'N/A'),
      escapeCsv(log.policy_version),
      escapeCsv(log.language),
      escapeCsv(log.action_type),
      escapeCsv(log.preferences_essential ? 'TRUE' : 'FALSE'),
      escapeCsv(log.preferences_analytics ? 'TRUE' : 'FALSE'),
      escapeCsv(log.preferences_marketing ? 'TRUE' : 'FALSE'),
      escapeCsv(log.notice_text_hash),
      escapeCsv(log.ip_address),
      escapeCsv(log.user_agent),
      escapeCsv(new Date(log.created_at).toISOString()),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="DPDP_Consent_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv"`
    );
    return res.send(csvContent);
  } catch (err) {
    console.error('Failed to export DPDP CSV audit logs:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/consent/delete-account & /api/consent/delete-account
 * Registered User Self-Service Account & Personal Data Deletion
 * Statutory implementation of DPDP Act, 2023 Section 12 (Right to Erasure)
 */
router.post('/delete-account', requireAuth, async (req, res) => {
  try {
    const { confirmation } = req.body || {};
    if (confirmation !== 'DELETE') {
      return res.status(400).json({ error: 'Please type DELETE to confirm permanent account and personal data erasure.' });
    }

    const profileId = req.user?.id;
    if (!profileId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify profile exists
    const checkRes = await query(`SELECT id, full_name, email, role, tenant_id FROM profiles WHERE id = $1`, [profileId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const profile = checkRes.rows[0];

    // Safety guard: platform administrator root accounts cannot be erased via self-service
    if (profile.role === 'platform_admin') {
      return res.status(403).json({ error: 'Platform administrator accounts cannot be self-deleted. Contact root technical support.' });
    }

    // Unlink any subordinate profiles reporting to this user
    await query(`UPDATE profiles SET reporting_manager_id = NULL WHERE reporting_manager_id = $1`, [profileId]);

    // Unassign leads assigned to this user to preserve lead pipeline history safely
    await query(`UPDATE leads SET sales_executive_id = NULL WHERE sales_executive_id = $1`, [profileId]);

    // Attempt clean row deletion; if foreign keys from sales/invoices prevent full delete, anonymize all personal data
    const anonymizedEmail = `erased_${profileId.slice(0, 8)}@privacy-erased.invalid`;
    let isFullyDeleted = false;

    try {
      await query(`DELETE FROM profiles WHERE id = $1`, [profileId]);
      isFullyDeleted = true;
    } catch (delErr) {
      // Retain only non-PII row with all personal identifying data permanently wiped
      await query(`
        UPDATE profiles 
        SET full_name = 'Erased User',
            email = $1,
            phone = NULL,
            password = NULL,
            password_hash = NULL,
            image_url = NULL,
            dob = NULL,
            marriage_anniversary = NULL,
            is_active = false
        WHERE id = $2
      `, [anonymizedEmail, profileId]);
    }

    // Log the statutory DPDP erasure event in the immutable audit ledger
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      '0.0.0.0';

    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    await recordConsent({
      anonymousId: req.cookies?.dpdp_consent_id || crypto.randomUUID(),
      userId: String(profileId),
      policyVersion: 'v1.0-2026',
      language: 'en',
      actionType: 'DATA_ERASED',
      preferences: { essential: false, analytics: false, marketing: false },
      noticeTextHash: 'USER_INITIATED_RIGHT_TO_ERASURE_DPDP_SEC_12',
      ipAddress: clientIp,
      userAgent,
    });

    // Clear client-side DPDP tracking cookie
    res.clearCookie('dpdp_consent_id', { path: '/' });

    return res.json({
      success: true,
      message: 'Account and personal data have been permanently erased in compliance with Section 12 of the DPDP Act, 2023.',
      is_fully_deleted: isFullyDeleted,
    });
  } catch (err) {
    console.error('Account erasure error:', err);
    return res.status(500).json({ error: err.message || 'Failed to erase account data' });
  }
});

export default router;
