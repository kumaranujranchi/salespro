import { Router } from 'express';
import crypto from 'crypto';
import { recordConsent, getLatestConsent, getConsentAuditLogs } from '../services/consentService.js';
import { requireAuth } from '../middleware/auth.js';

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

export default router;
