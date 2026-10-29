import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { sendMetaCloudMessage, sendWatiMessage } from '../services/whatsappService.js';

const router = Router();

/**
 * Exchange Facebook OAuth code for access token and fetch pages
 * POST /api/meta/exchange-code
 */
router.post('/exchange-code', requireAuth, async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'OAuth code is required' });
    }

    const appId = process.env.VITE_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      return res.status(500).json({
        error: 'Facebook App ID or App Secret not configured on the server. Please set VITE_FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in the environment.',
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

    // 2. Fetch pages the user manages
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token,tasks`;
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();

    if (!pagesRes.ok || pagesData.error) {
      return res.status(400).json({
        error: pagesData.error?.message || 'Failed to fetch Facebook pages',
      });
    }

    const pages = (pagesData.data || []).map((p) => ({
      id: p.id,
      name: p.name,
      access_token: p.access_token,
    }));

    return res.json({ success: true, pages });
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

