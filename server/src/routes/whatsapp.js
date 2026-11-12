import { Router } from 'express';
import { requireAuth, isPlatformRole } from '../middleware/auth.js';
import { query } from '../db/index.js';
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
  getWidgetConfigForTenant,
  generateWidgetChatReply,
  captureWidgetLead,
} from '../services/whatsappHubService.js';
import { testLeadConfirmationWhatsApp } from '../services/whatsappService.js';
import {
  recordConversationFeedback,
  listLearningPatterns,
} from '../services/leadIntelligenceService.js';

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
 * 3. WHATSAPP CONFIGURATION & HEALTH (Protected)
 * =========================================================================
 */

router.get('/config', requireAuth, async (req, res) => {
  try {
    const isPlatform = isPlatformRole(req.user);
    const tenantId = req.user?.tenant_id || (isPlatform ? (req.query.tenant_id || null) : null);
    const config = await getWhatsAppConfig(tenantId);

    // Mask tokens for display
    const maskedToken = config.accessToken
      ? `${config.accessToken.slice(0, 10)}••••••••••••••••••••${config.accessToken.slice(-6)}`
      : '';

    const activeApiKey = config.aiApiKey || config.deepseekApiKey || '';
    const maskedApiKey = activeApiKey
      ? `${activeApiKey.slice(0, 6)}••••••••••••••••••••${activeApiKey.slice(-4)}`
      : '';

    return res.json({
      success: true,
      config: {
        ...config,
        accessTokenMasked: maskedToken,
        hasAccessToken: Boolean(config.accessToken),
        aiApiKeyMasked: maskedApiKey,
        hasAiApiKey: Boolean(activeApiKey),
        deepseekApiKeyMasked: maskedApiKey,
        hasDeepseekKey: Boolean(activeApiKey),
        webhookUrl: `${process.env.APP_URL || 'https://realsalepro.com'}/api/whatsapp/webhook`,
        tenantId,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/config', requireAuth, async (req, res) => {
  try {
    const isPlatform = isPlatformRole(req.user);
    const tenantId = req.user?.tenant_id || (isPlatform ? (req.body.tenant_id || null) : null);
    if (!tenantId && !isPlatform) {
      return res.status(403).json({ error: 'Unauthorized to modify platform configuration' });
    }
    const updated = await updateWhatsAppConfig(req.body, tenantId);
    return res.json({ success: true, message: 'WhatsApp configuration saved', config: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/test-connection', requireAuth, async (req, res) => {
  try {
    const isPlatform = isPlatformRole(req.user);
    const tenantId = req.user?.tenant_id || (isPlatform ? (req.body.tenant_id || null) : null);
    const { phoneNumberId, accessToken } = req.body;
    const result = await testMetaConnection({ phoneNumberId, accessToken, tenantId });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/test-confirmation', requireAuth, async (req, res) => {
  try {
    const isPlatform = isPlatformRole(req.user);
    const tenantId = req.user?.tenant_id || (isPlatform ? (req.body.tenant_id || null) : null);
    const { testPhone, toPhone, customMessage } = req.body;
    const targetPhone = testPhone || toPhone;
    if (!targetPhone) {
      return res.status(400).json({ error: 'Test phone number is required' });
    }
    const result = await testLeadConfirmationWhatsApp({
      tenantId,
      toPhone: targetPhone,
      customMessage,
    });
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
    const { status, search, limit, offset, tenant_id } = req.query;
    const isPlatform = isPlatformRole(req.user);
    let effectiveTenantId;
    if (req.user?.tenant_id) {
      effectiveTenantId = req.user.tenant_id;
    } else if (isPlatform) {
      effectiveTenantId = tenant_id || 'platform';
    } else {
      effectiveTenantId = 'none';
    }

    const data = await listConversations({
      status,
      search,
      limit,
      offset,
      tenantId: effectiveTenantId,
    });
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const isPlatform = isPlatformRole(req.user);
    const convCheck = await query('SELECT tenant_id FROM whatsapp_conversations WHERE id = $1', [req.params.id]);
    if (!convCheck.rows[0]) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const convTenantId = convCheck.rows[0].tenant_id;

    if (req.user?.tenant_id) {
      if (convTenantId !== req.user.tenant_id) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }
    } else if (!isPlatform && convTenantId !== null) {
      return res.status(403).json({ error: 'Access denied' });
    }

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

    const isPlatform = isPlatformRole(req.user);
    const convCheck = await query('SELECT tenant_id FROM whatsapp_conversations WHERE id = $1', [req.params.id]);
    if (!convCheck.rows[0]) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const convTenantId = convCheck.rows[0].tenant_id;

    if (req.user?.tenant_id) {
      if (convTenantId !== req.user.tenant_id) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }
    } else if (!isPlatform && convTenantId !== null) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const agentName = req.user?.full_name || 'Agent';
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
    const isPlatform = isPlatformRole(req.user);
    const convCheck = await query('SELECT tenant_id FROM whatsapp_conversations WHERE id = $1', [req.params.id]);
    if (!convCheck.rows[0]) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const convTenantId = convCheck.rows[0].tenant_id;

    if (req.user?.tenant_id) {
      if (convTenantId !== req.user.tenant_id) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }
    } else if (!isPlatform && convTenantId !== null) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await toggleBotStatus({ conversationId: req.params.id, status });
    return res.json({ success: true, conversation: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Lead Intelligence & Adaptive Continuous Learning Endpoints
 */

// POST /api/whatsapp/conversations/:id/label - Record feedback & reinforce ML pattern
router.post('/conversations/:id/label', requireAuth, async (req, res) => {
  try {
    const { label, notes } = req.body;
    if (!label) {
      return res.status(400).json({ error: 'Classification label is required' });
    }

    const result = await recordConversationFeedback({
      conversationId: req.params.id,
      label,
      notes,
      adminId: req.user?.id || req.user?.email,
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/whatsapp/learning-patterns - List active learned patterns
router.get('/learning-patterns', requireAuth, async (req, res) => {
  try {
    const isPlatform = isPlatformRole(req.user);
    const tenantId = req.user?.tenant_id || (isPlatform ? (req.query.tenant_id || null) : null);
    const data = await listLearningPatterns(tenantId);
    return res.json(data);
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
    const isPlatform = isPlatformRole(req.user);
    const tenantId = req.user?.tenant_id || (isPlatform ? (req.query.tenant_id || null) : null);
    const data = await listMetaTemplates(tenantId);
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

    const isPlatform = isPlatformRole(req.user);
    const tenantId = req.user?.tenant_id || (isPlatform ? (req.body.tenant_id || null) : null);

    const result = await createMetaTemplate({
      name,
      category: category || 'MARKETING',
      language: language || 'en',
      components,
      tenantId,
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/templates/:name', requireAuth, async (req, res) => {
  try {
    const isPlatform = isPlatformRole(req.user);
    const tenantId = req.user?.tenant_id || (isPlatform ? (req.body?.tenant_id || req.query?.tenant_id || null) : null);
    const result = await deleteMetaTemplate(req.params.name, tenantId);
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
    const isPlatform = isPlatformRole(req.user);
    const tenantId = req.user?.tenant_id || (isPlatform ? (req.query.tenant_id || 'platform') : 'none');
    const broadcasts = await listBroadcasts(tenantId);
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

    const isPlatform = isPlatformRole(req.user);
    const tenantId = req.user?.tenant_id || (isPlatform ? (req.body.tenant_id || null) : null);

    const campaign = await createBroadcastCampaign({
      title,
      templateName,
      customMessage,
      targetAudience,
      phones,
      createdBy: req.user?.id,
      tenantId,
    });

    return res.json({ success: true, campaign });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * =========================================================================
 * 7. WEBSITE WHATSAPP WIDGET & AI BOT (Public Endpoints for Embeds)
 * =========================================================================
 */

// GET /api/whatsapp/widget/config?tenantId=...
router.get('/widget/config', async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.query.tenant_id || req.query.workspace;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant identifier is required' });
    }
    const config = await getWidgetConfigForTenant(tenantId);
    return res.json({ success: true, widget: config });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/widget/chat
router.post('/widget/chat', async (req, res) => {
  try {
    const { tenantId, message, conversationHistory } = req.body;
    if (!tenantId || !message) {
      return res.status(400).json({ error: 'tenantId and message are required' });
    }
    const result = await generateWidgetChatReply({
      tenantId,
      message,
      conversationHistory: conversationHistory || [],
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/widget/lead
router.post('/widget/lead', async (req, res) => {
  try {
    const { tenantId, customerName, phone, projectInterest, notes } = req.body;
    if (!tenantId || !phone) {
      return res.status(400).json({ error: 'tenantId and phone are required' });
    }
    const result = await captureWidgetLead({
      tenantId,
      customerName,
      phone,
      projectInterest,
      notes,
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/whatsapp/widget.js (Embeddable Vanilla JS library)
router.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const scriptContent = `
(function() {
  var scriptTag = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var tenantId = scriptTag ? (scriptTag.getAttribute('data-tenant') || scriptTag.getAttribute('data-tenant-id')) : null;
  if (!tenantId) {
    console.warn('[RealSalePro WhatsApp Widget] Missing data-tenant attribute.');
    return;
  }

  var apiBase = scriptTag.src ? scriptTag.src.replace(/\\/api\\/whatsapp\\/widget\\.js.*$/, '') : '';
  if (!apiBase) apiBase = window.location.origin;

  fetch(apiBase + '/api/whatsapp/widget/config?tenantId=' + encodeURIComponent(tenantId))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.success || !data.widget || !data.widget.enabled) return;
      initWidget(data.widget);
    })
    .catch(function(e) { console.error('[RealSalePro WhatsApp Widget] Load error:', e); });

  function initWidget(cfg) {
    if (document.getElementById('rsp-wa-widget-container')) return;

    var container = document.createElement('div');
    container.id = 'rsp-wa-widget-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
    if (cfg.position === 'bottom-left') {
      container.style.right = 'auto';
      container.style.left = '24px';
    }

    var themeColor = cfg.primaryColor || '#25D366';
    var businessName = cfg.businessName || 'Property Consultant';
    var agentName = cfg.agentName || 'AI Assistant';
    var welcomeMsg = cfg.welcomeMessage || 'Hi there! 👋 How can we help you find your dream property today?';
    var waPhone = (cfg.displayPhone || '917079737773').replace(/\\D/g, '');

    var chatOpen = false;
    var history = [];

    // Trigger Button
    var btn = document.createElement('div');
    btn.style.cssText = 'width:60px;height:60px;border-radius:50%;background:' + themeColor + ';box-shadow:0 6px 24px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.2s ease;';
    btn.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';
    btn.onmouseenter = function() { btn.style.transform = 'scale(1.08)'; };
    btn.onmouseleave = function() { btn.style.transform = 'scale(1)'; };

    // Chat Box
    var box = document.createElement('div');
    box.style.cssText = 'display:none;width:340px;max-width:calc(100vw - 32px);height:480px;background:#ffffff;border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,0.2);margin-bottom:14px;overflow:hidden;flex-direction:column;border:1px solid rgba(0,0,0,0.08);';

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'background:#075e54;color:#ffffff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;';
    header.innerHTML = '<div><div style="font-weight:600;font-size:15px;">' + escapeHtml(businessName) + '</div><div style="font-size:12px;opacity:0.85;display:flex;align-items:center;gap:6px;"><span style="width:7px;height:7px;border-radius:50%;background:#25D366;display:inline-block;"></span>' + escapeHtml(agentName) + ' • Online</div></div><div id="rsp-wa-close" style="cursor:pointer;opacity:0.8;font-size:20px;line-height:1;">&times;</div>';

    // Messages container
    var msgs = document.createElement('div');
    msgs.style.cssText = 'flex:1;background:#ECE5DD;padding:14px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;font-size:13.5px;';

    // WhatsApp Direct link bar
    var waBar = document.createElement('a');
    waBar.href = 'https://wa.me/' + waPhone;
    waBar.target = '_blank';
    waBar.rel = 'noopener noreferrer';
    waBar.style.cssText = 'background:#25D366;color:#ffffff;text-align:center;padding:8px;font-size:12px;font-weight:600;text-decoration:none;display:block;';
    waBar.innerText = '⚡ Chat Directly on WhatsApp App';

    // Input Area
    var inputWrap = document.createElement('div');
    inputWrap.style.cssText = 'padding:10px;background:#ffffff;border-top:1px solid #f0f0f0;display:flex;gap:8px;align-items:center;';
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = 'Type your query or phone number...';
    inp.style.cssText = 'flex:1;padding:10px 14px;border:1px solid #e0e0e0;border-radius:22px;outline:none;font-size:13px;';
    var sendBtn = document.createElement('button');
    sendBtn.innerHTML = '&#10148;';
    sendBtn.style.cssText = 'width:38px;height:38px;border-radius:50%;background:#25D366;color:#ffffff;border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;';

    inputWrap.appendChild(inp);
    inputWrap.appendChild(sendBtn);

    box.appendChild(header);
    box.appendChild(waBar);
    box.appendChild(msgs);
    box.appendChild(inputWrap);

    container.appendChild(box);
    container.appendChild(btn);
    document.body.appendChild(container);

    // Initial Welcome Message
    appendBubble(msgs, welcomeMsg, 'bot');

    btn.onclick = function() {
      chatOpen = !chatOpen;
      box.style.display = chatOpen ? 'flex' : 'none';
      if (chatOpen) inp.focus();
    };

    box.querySelector('#rsp-wa-close').onclick = function() {
      chatOpen = false;
      box.style.display = 'none';
    };

    function sendMessage() {
      var text = inp.value.trim();
      if (!text) return;
      inp.value = '';
      appendBubble(msgs, text, 'user');
      history.push({ role: 'user', content: text });

      var loadingBubble = appendBubble(msgs, 'Typing...', 'bot', true);

      fetch(apiBase + '/api/whatsapp/widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId,
          message: text,
          conversationHistory: history.slice(-6)
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        loadingBubble.remove();
        if (res.reply) {
          appendBubble(msgs, res.reply, 'bot');
          history.push({ role: 'assistant', content: res.reply });
        }
        if (res.detectedPhone) {
          fetch(apiBase + '/api/whatsapp/widget/lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId: tenantId,
              phone: res.detectedPhone,
              customerName: 'Website Visitor',
              notes: 'Captured via Website AI Widget'
            })
          }).catch(function() {});
        }
      })
      .catch(function() {
        loadingBubble.remove();
        appendBubble(msgs, 'Sorry, something went wrong. Please connect with us directly on WhatsApp!', 'bot');
      });
    }

    sendBtn.onclick = sendMessage;
    inp.onkeydown = function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    };

    function appendBubble(parent, text, sender, isTemp) {
      var b = document.createElement('div');
      b.style.cssText = 'max-width:82%;padding:8px 12px;border-radius:12px;line-height:1.4;word-wrap:break-word;' + 
        (sender === 'user' 
          ? 'align-self:flex-end;background:#DCF8C6;color:#111;border-bottom-right-radius:2px;' 
          : 'align-self:flex-start;background:#ffffff;color:#111;border-bottom-left-radius:2px;box-shadow:0 1px 2px rgba(0,0,0,0.1);');
      b.innerText = text;
      parent.appendChild(b);
      parent.scrollTop = parent.scrollHeight;
      return b;
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.innerText = str || '';
      return div.innerHTML;
    }
  }
})();
  `;

  return res.send(scriptContent);
});

export default router;

