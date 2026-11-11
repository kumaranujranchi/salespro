import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getWhatsAppConfig,
  updateWhatsAppConfig,
  testMetaConnection,
  processIncomingWebhook,
  listConversations,
  getConversationMessages,
  sendAgentReply,
  toggleBotStatus,
  sendWhatsAppOtp,
  verifyWhatsAppOtp,
  listMetaTemplates,
  createMetaTemplate,
  deleteMetaTemplate,
  createBroadcastCampaign,
  listBroadcasts,
} from '../services/whatsappHubService.js';

const router = Router();

/**
 * =========================================================================
 * 1. META WEBHOOK ENDPOINTS (Public for Meta verification & events)
 * =========================================================================
 */

/**
 * GET /api/whatsapp/webhook
 * Meta Webhook Handshake Verification
 */
router.get('/webhook', async (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const config = await getWhatsAppConfig();
    const expectedToken = config.webhookVerifyToken || 'realsalepro_wa_secret';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('✔ [Meta Webhook] Verification challenge passed successfully');
      return res.status(200).send(challenge);
    }

    console.warn(`❌ [Meta Webhook] Verification failed. Received token: ${token}, expected: ${expectedToken}`);
    return res.status(403).send('Forbidden');
  } catch (err) {
    console.error('[Meta Webhook] Verification error:', err.message);
    return res.status(500).send('Server Error');
  }
});

/**
 * POST /api/whatsapp/webhook
 * Meta Inbound Event Handler (Messages, quick-replies, and delivery receipts)
 */
router.post('/webhook', async (req, res) => {
  // Always return 200 OK immediately to Meta to acknowledge receipt within 3s
  res.status(200).send('EVENT_RECEIVED');

  try {
    await processIncomingWebhook(req.body);
  } catch (err) {
    console.error('❌ [Meta Webhook] Error processing event:', err.message);
  }
});

/**
 * =========================================================================
 * 2. WHATSAPP OTP VERIFICATION ENDPOINTS (Public / Rate-limited)
 * =========================================================================
 */

/**
 * POST /api/whatsapp/otp/send
 * Dispatches a 6-digit WhatsApp OTP
 */
router.post('/otp/send', async (req, res) => {
  try {
    const { phone, purpose } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const result = await sendWhatsAppOtp({ phone, purpose: purpose || 'signup_verification' });
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to dispatch WhatsApp OTP' });
    }

    return res.json({
      success: true,
      message: 'Verification code sent to WhatsApp',
      phone: result.phone,
      expiresAt: result.expiresAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

/**
 * POST /api/whatsapp/otp/verify
 * Verifies submitted OTP code
 */
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, otp, purpose } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP code are required' });
    }

    const result = await verifyWhatsAppOtp({ phone, otp, purpose: purpose || 'signup_verification' });
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'OTP verification failed' });
    }

    return res.json({ success: true, message: result.message });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

/**
 * =========================================================================
 * 3. WHATSAPP CONFIGURATION & HEALTH (Protected - Super / Platform Admin)
 * =========================================================================
 */

router.get('/config', requireAuth, async (req, res) => {
  try {
    const config = await getWhatsAppConfig();
    // Mask tokens for display
    const maskedToken = config.accessToken
      ? `${config.accessToken.slice(0, 10)}••••••••••••••••••••${config.accessToken.slice(-6)}`
      : '';

    const maskedDeepseekKey = config.deepseekApiKey
      ? `${config.deepseekApiKey.slice(0, 6)}••••••••••••••••••••${config.deepseekApiKey.slice(-4)}`
      : '';

    return res.json({
      success: true,
      config: {
        ...config,
        accessTokenMasked: maskedToken,
        hasAccessToken: Boolean(config.accessToken),
        deepseekApiKeyMasked: maskedDeepseekKey,
        hasDeepseekKey: Boolean(config.deepseekApiKey),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/config', requireAuth, async (req, res) => {
  try {
    const updated = await updateWhatsAppConfig(req.body);
    return res.json({ success: true, message: 'WhatsApp configuration saved', config: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/test-connection', requireAuth, async (req, res) => {
  try {
    const result = await testMetaConnection();
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * =========================================================================
 * 4. LIVE 2-WAY CHAT INBOX & AGENT REPLIES
 * =========================================================================
 */

router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const { status, search, limit, offset } = req.query;
    const data = await listConversations({ status, search, limit, offset });
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const messages = await getConversationMessages(req.params.id);
    return res.json({ success: true, messages });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:id/reply', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const agentName = req.user?.full_name || 'RealSalePro Team';
    const result = await sendAgentReply({
      conversationId: req.params.id,
      text: text.trim(),
      agentProfileId: req.user?.id,
      agentName,
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:id/toggle-bot', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await toggleBotStatus({ conversationId: req.params.id, status });
    return res.json({ success: true, conversation: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * =========================================================================
 * 5. META TEMPLATES MANAGER & DIRECT APPROVAL HUB
 * =========================================================================
 */

router.get('/templates', requireAuth, async (req, res) => {
  try {
    const data = await listMetaTemplates();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/templates', requireAuth, async (req, res) => {
  try {
    const { name, category, language, components } = req.body;
    if (!name || !components) {
      return res.status(400).json({ error: 'Template name and components are required' });
    }

    const result = await createMetaTemplate({ name, category: category || 'MARKETING', language: language || 'en', components });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/templates/:name', requireAuth, async (req, res) => {
  try {
    const result = await deleteMetaTemplate(req.params.name);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * =========================================================================
 * 6. BROADCASTS & BULK MESSAGING CAMPAIGNS
 * =========================================================================
 */

router.get('/broadcasts', requireAuth, async (req, res) => {
  try {
    const broadcasts = await listBroadcasts();
    return res.json({ success: true, broadcasts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/broadcasts', requireAuth, async (req, res) => {
  try {
    const { title, templateName, customMessage, targetAudience, phones } = req.body;
    if (!title || (!templateName && !customMessage)) {
      return res.status(400).json({ error: 'Title and template name or message required' });
    }

    const campaign = await createBroadcastCampaign({
      title,
      templateName,
      customMessage,
      targetAudience,
      phones,
      createdBy: req.user?.id,
    });

    return res.json({ success: true, campaign });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

