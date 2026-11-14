import { Router } from 'express';
import { query } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { sendMetaCloudMessage, sendWatiMessage } from '../services/whatsappService.js';

const router = Router();

const DEFAULT_FACEBOOK_APP_ID = '1574456310724339';
const DEFAULT_FACEBOOK_APP_SECRET = '73b2d2fb9c45ed22d763aac80c24a46d';

/**
 * Exchange Facebook OAuth code for access token and fetch pages
 * POST /api/meta/exchange-code
 */
router.post('/exchange-code', requireAuth, async (req, res) => {
  try {
    const { code, redirectUri, appId: clientAppId, appSecret: clientAppSecret } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'OAuth code is required' });
    }

    let appId = clientAppId || process.env.VITE_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID;
    let appSecret = clientAppSecret || process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      if (req.user?.tenant_id) {
        const tenantRes = await query('SELECT settings FROM tenants WHERE id = $1', [req.user.tenant_id]);
        const metaCfg = tenantRes.rows[0]?.settings?.integrations?.meta;
        if (metaCfg?.appId && !appId) appId = metaCfg.appId;
        if (metaCfg?.appSecret && !appSecret) appSecret = metaCfg.appSecret;
      }
    }

    // Fallback to built-in default Meta credentials if default app ID is in use or no credentials provided
    if (!appId || appId === DEFAULT_FACEBOOK_APP_ID) {
      appId = DEFAULT_FACEBOOK_APP_ID;
      if (!appSecret) {
        appSecret = DEFAULT_FACEBOOK_APP_SECRET;
      }
    }

    if (!appId || !appSecret) {
      return res.status(400).json({
        error: 'Facebook App ID and App Secret must be set in server environment variables or Meta settings.'
      });
    }

    // 1. Exchange code for user access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      return res.status(400).json({
        error: tokenData.error?.message || 'Failed to exchange Facebook code',
      });
    }

    const userAccessToken = tokenData.access_token;

    // 2. Fetch all pages the user manages (handling pagination up to 100+ pages)
    let allPages = [];
    let pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token,tasks&limit=100`;

    while (pagesUrl) {
      const pagesRes = await fetch(pagesUrl);
      const pagesData = await pagesRes.json();

      if (!pagesRes.ok || pagesData.error) {
        if (allPages.length > 0) break; // keep already fetched pages if subsequent page fails
        return res.status(400).json({
          error: pagesData.error?.message || 'Failed to fetch Facebook pages',
        });
      }

      const currentPages = (pagesData.data || []).map((p) => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token,
      }));
      allPages = allPages.concat(currentPages);

      // Follow next pagination URL if user has more than 100 pages
      pagesUrl = pagesData.paging?.next || null;
    }

    return res.json({ success: true, pages: allPages });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * Verify Direct Page Access Token and retrieve page info
 * POST /api/meta/verify-page-token
 */
router.post('/verify-page-token', requireAuth, async (req, res) => {
  try {
    const { pageId, pageAccessToken } = req.body;
    if (!pageId || !pageAccessToken) {
      return res.status(400).json({ error: 'Page ID and Page Access Token are required' });
    }

    const checkUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}?fields=id,name,category&access_token=${encodeURIComponent(pageAccessToken)}`;
    const checkRes = await fetch(checkUrl);
    const checkData = await checkRes.json();

    if (!checkRes.ok || checkData.error) {
      return res.status(400).json({
        error: checkData.error?.message || 'Failed to verify Facebook Page with Meta Graph API. Please check your Page ID and Token.',
      });
    }

    // Auto-subscribe to leadgen webhooks
    let subscribed = false;
    try {
      const subUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/subscribed_apps?subscribed_fields=leadgen&access_token=${encodeURIComponent(pageAccessToken)}`;
      const subRes = await fetch(subUrl, { method: 'POST' });
      const subData = await subRes.json();
      subscribed = subRes.ok && (subData.success === true || (Array.isArray(subData.data) && subData.data.length > 0));
    } catch {
      subscribed = false;
    }

    return res.json({
      success: true,
      page: {
        id: checkData.id,
        name: checkData.name,
        category: checkData.category,
      },
      subscribed,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * Subscribe page to app webhook for leadgen
 * POST /api/meta/subscribe-page
 */
router.post('/subscribe-page', requireAuth, async (req, res) => {
  try {
    const { pageId, pageAccessToken } = req.body;
    if (!pageId || !pageAccessToken) {
      return res.status(400).json({ error: 'Page ID and Access Token are required' });
    }

    const subUrl = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${pageAccessToken}`;
    const subRes = await fetch(subUrl, { method: 'POST' });
    const subData = await subRes.json();

    if (!subRes.ok || subData.error) {
      return res.status(400).json({
        error: subData.error?.message || 'Failed to subscribe page to webhook',
      });
    }

    return res.json({ success: true, data: subData });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * Send Test WhatsApp Message to verify API credentials
 * POST /api/meta/whatsapp-test
 */
router.post('/whatsapp-test', requireAuth, async (req, res) => {
  try {
    const {
      provider = 'meta_cloud',
      phoneNumberId,
      accessToken,
      bspEndpoint,
      bspApiKey,
      toPhone,
      templateName,
      languageCode = 'en',
      bodyParams = [],
      fallbackText,
    } = req.body;

    if (!toPhone) {
      return res.status(400).json({ error: 'Recipient toPhone is required to send test message' });
    }

    if (provider === 'meta_cloud') {
      if (!phoneNumberId || !accessToken) {
        return res.status(400).json({ error: 'Phone Number ID and Access Token are required for Meta Cloud API' });
      }

      const result = await sendMetaCloudMessage({
        phoneNumberId,
        accessToken,
        toPhone,
        templateName: templateName || undefined,
        languageCode,
        bodyParams,
        fallbackText: fallbackText || `Hello! This is a verification test message from RealSalePro WhatsApp Automation. Your WhatsApp Cloud API is connected successfully!`,
      });

      return res.json({ success: true, ...result });
    } else if (provider === 'wati') {
      if (!bspEndpoint || !bspApiKey) {
        return res.status(400).json({ error: 'Endpoint and API Key are required for WATI' });
      }

      const result = await sendWatiMessage({
        endpoint: bspEndpoint,
        apiKey: bspApiKey,
        toPhone,
        templateName: templateName || 'test',
        parameters: bodyParams.map((v, i) => ({ name: String(i + 1), value: String(v) })),
      });

      return res.json({ success: true, ...result });
    }

    return res.status(400).json({ error: `Unsupported provider: ${provider}` });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'WhatsApp Test dispatch failed' });
  }
});

export default router;

