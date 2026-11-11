import { query } from '../db/index.js';
import crypto from 'crypto';

let schemaInitialized = false;

/**
 * Normalizes phone numbers for WhatsApp API (E.164 without plus)
 * Example: '+91 70797 37773' -> '917079737773'
 */
export function normalizeWhatsAppPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

/**
 * Formats a phone number for UI display
 * Example: '917079737773' -> '+91 70797 37773'
 */
export function formatPhoneDisplay(phone) {
  const norm = normalizeWhatsAppPhone(phone);
  if (norm.length === 12 && norm.startsWith('91')) {
    return `+91 ${norm.slice(2, 7)} ${norm.slice(7)}`;
  }
  return phone;
}

/**
 * Ensure database tables exist for WhatsApp Hub.
 * Safe and idempotent.
 */
export async function initWhatsAppSchema() {
  if (schemaInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS whatsapp_platform_config (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        waba_id VARCHAR(255),
        phone_number_id VARCHAR(255),
        access_token TEXT,
        webhook_verify_token VARCHAR(255) DEFAULT 'realsalepro_wa_secret',
        bot_enabled BOOLEAN DEFAULT true,
        welcome_message TEXT,
        agent_notify_email VARCHAR(255) DEFAULT 'support@realsalepro.com',
        agent_notify_phone VARCHAR(50) DEFAULT '+917079737773',
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS whatsapp_conversations (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        phone VARCHAR(50) NOT NULL UNIQUE,
        customer_name VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'bot_active',
        assigned_to VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
        unread_count INT NOT NULL DEFAULT 0,
        last_message TEXT,
        last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_wa_conv_phone ON whatsapp_conversations(phone);
      CREATE INDEX IF NOT EXISTS idx_wa_conv_status ON whatsapp_conversations(status);
      CREATE INDEX IF NOT EXISTS idx_wa_conv_last_msg ON whatsapp_conversations(last_message_at DESC);

      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        conversation_id VARCHAR(255) NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
        direction VARCHAR(20) NOT NULL,
        sender_type VARCHAR(30) NOT NULL,
        sender_name VARCHAR(255),
        message_type VARCHAR(30) NOT NULL DEFAULT 'text',
        body TEXT NOT NULL,
        meta_message_id VARCHAR(255),
        status VARCHAR(30) NOT NULL DEFAULT 'sent',
        error_message TEXT,
        raw_payload JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_wa_msg_conv ON whatsapp_messages(conversation_id, created_at ASC);
      CREATE INDEX IF NOT EXISTS idx_wa_msg_meta_id ON whatsapp_messages(meta_message_id);

      CREATE TABLE IF NOT EXISTS whatsapp_templates (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(255) NOT NULL UNIQUE,
        category VARCHAR(50) NOT NULL DEFAULT 'MARKETING',
        language VARCHAR(20) NOT NULL DEFAULT 'en',
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        meta_template_id VARCHAR(255),
        components JSONB NOT NULL DEFAULT '[]'::jsonb,
        rejection_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS whatsapp_broadcasts (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title VARCHAR(255) NOT NULL,
        template_name VARCHAR(255),
        custom_message TEXT,
        target_audience VARCHAR(100) NOT NULL DEFAULT 'all_leads',
        total_recipients INT NOT NULL DEFAULT 0,
        sent_count INT NOT NULL DEFAULT 0,
        delivered_count INT NOT NULL DEFAULT 0,
        read_count INT NOT NULL DEFAULT 0,
        failed_count INT NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        created_by VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS whatsapp_otps (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        phone VARCHAR(50) NOT NULL,
        otp_code VARCHAR(20) NOT NULL,
        purpose VARCHAR(50) NOT NULL DEFAULT 'signup_verification',
        attempts INT NOT NULL DEFAULT 0,
        is_verified BOOLEAN NOT NULL DEFAULT false,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_wa_otps_phone ON whatsapp_otps(phone, is_verified, expires_at);

      ALTER TABLE whatsapp_platform_config ADD COLUMN IF NOT EXISTS deepseek_api_key TEXT;
      ALTER TABLE whatsapp_platform_config ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100) DEFAULT 'deepseek-chat';
      ALTER TABLE whatsapp_platform_config ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;

      INSERT INTO whatsapp_platform_config (id, waba_id, phone_number_id, access_token, webhook_verify_token, bot_enabled, ai_enabled, ai_model)
      VALUES (
        'default',
        '1137788795833452',
        '1435084146353236',
        'EAAWX9a0ddvMBSwgCdjxoVIJwhANXRn15YKD2VMiVJwHnIpZBLZCo1lpa94HP3c4mZAI3Rd9km9cbk2swXVednikQ7fnkGGKZAJNA977isSZBEEkGbxXF3KMUtcUrovnmhGNKaU1zRaDt81akr9Y1GwHRPEbXdK8GOcEZCwXWI3YkysrnPhHbWrBGz9IT8cS62c5AZDZD',
        'realsalepro_wa_secret',
        true,
        true,
        'deepseek-chat'
      )
      ON CONFLICT (id) DO UPDATE SET
        waba_id = COALESCE(whatsapp_platform_config.waba_id, EXCLUDED.waba_id),
        phone_number_id = COALESCE(whatsapp_platform_config.phone_number_id, EXCLUDED.phone_number_id),
        access_token = COALESCE(whatsapp_platform_config.access_token, EXCLUDED.access_token);
    `);
    schemaInitialized = true;
  } catch (err) {
    console.error('Error initializing WhatsApp schema:', err.message);
  }
}

/**
 * Get active Meta WhatsApp Cloud API credentials
 */
export async function getWhatsAppConfig() {
  let row = {};
  try {
    await initWhatsAppSchema();
    const res = await query('SELECT * FROM whatsapp_platform_config WHERE id = $1', ['default']);
    row = res.rows[0] || {};
  } catch (err) {
    // If DB is offline or table initializing, gracefully use environment fallbacks
  }

  return {
    wabaId: row.waba_id || process.env.META_WABA_ID || process.env.WHATSAPP_WABA_ID || '1137788795833452',
    phoneNumberId: row.phone_number_id || process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '1435084146353236',
    accessToken: row.access_token || process.env.META_WA_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || 'EAAWX9a0ddvMBSwgCdjxoVIJwhANXRn15YKD2VMiVJwHnIpZBLZCo1lpa94HP3c4mZAI3Rd9km9cbk2swXVednikQ7fnkGGKZAJNA977isSZBEEkGbxXF3KMUtcUrovnmhGNKaU1zRaDt81akr9Y1GwHRPEbXdK8GOcEZCwXWI3YkysrnPhHbWrBGz9IT8cS62c5AZDZD',
    webhookVerifyToken: row.webhook_verify_token || process.env.META_WA_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || 'realsalepro_wa_secret',
    botEnabled: row.bot_enabled ?? true,
    deepseekApiKey: row.deepseek_api_key || process.env.DEEPSEEK_API_KEY || '',
    aiModel: row.ai_model || process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    aiEnabled: row.ai_enabled ?? true,
    welcomeMessage: row.welcome_message || '',
    agentNotifyEmail: row.agent_notify_email || 'support@realsalepro.com',
    agentNotifyPhone: row.agent_notify_phone || '+917079737773',
    updatedAt: row.updated_at,
  };
}

/**
 * Update Meta WhatsApp Cloud API credentials & DeepSeek AI Settings
 */
export async function updateWhatsAppConfig({
  wabaId,
  phoneNumberId,
  accessToken,
  webhookVerifyToken,
  botEnabled,
  welcomeMessage,
  agentNotifyEmail,
  agentNotifyPhone,
  deepseekApiKey,
  aiModel,
  aiEnabled,
}) {
  await initWhatsAppSchema();

  // If token is masked (e.g. EAAB...***), preserve existing token
  let tokenToSave = accessToken;
  if (accessToken && accessToken.includes('***')) {
    const existing = await getWhatsAppConfig();
    tokenToSave = existing.accessToken;
  }

  // If DeepSeek API key is masked (e.g. sk-***), preserve existing key
  let deepseekKeyToSave = deepseekApiKey;
  if (deepseekApiKey && deepseekApiKey.includes('***')) {
    const existing = await getWhatsAppConfig();
    deepseekKeyToSave = existing.deepseekApiKey;
  }

  await query(`
    INSERT INTO whatsapp_platform_config (
      id, waba_id, phone_number_id, access_token, webhook_verify_token,
      bot_enabled, welcome_message, agent_notify_email, agent_notify_phone,
      deepseek_api_key, ai_model, ai_enabled, updated_at
    ) VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET
      waba_id = COALESCE($1, whatsapp_platform_config.waba_id),
      phone_number_id = COALESCE($2, whatsapp_platform_config.phone_number_id),
      access_token = CASE WHEN $3 IS NOT NULL AND $3 != '' THEN $3 ELSE whatsapp_platform_config.access_token END,
      webhook_verify_token = COALESCE($4, whatsapp_platform_config.webhook_verify_token),
      bot_enabled = COALESCE($5, whatsapp_platform_config.bot_enabled),
      welcome_message = COALESCE($6, whatsapp_platform_config.welcome_message),
      agent_notify_email = COALESCE($7, whatsapp_platform_config.agent_notify_email),
      agent_notify_phone = COALESCE($8, whatsapp_platform_config.agent_notify_phone),
      deepseek_api_key = CASE WHEN $9 IS NOT NULL AND $9 != '' THEN $9 ELSE whatsapp_platform_config.deepseek_api_key END,
      ai_model = COALESCE($10, whatsapp_platform_config.ai_model),
      ai_enabled = COALESCE($11, whatsapp_platform_config.ai_enabled),
      updated_at = CURRENT_TIMESTAMP
  `, [
    wabaId || null,
    phoneNumberId || null,
    tokenToSave || null,
    webhookVerifyToken || null,
    botEnabled ?? true,
    welcomeMessage || null,
    agentNotifyEmail || null,
    agentNotifyPhone || null,
    deepseekKeyToSave || null,
    aiModel || 'deepseek-chat',
    aiEnabled ?? true,
  ]);

  return await getWhatsAppConfig();
}

/**
 * Test Connection with Meta Graph API
 */
export async function testMetaConnection() {
  const config = await getWhatsAppConfig();
  if (!config.phoneNumberId || !config.accessToken) {
    return {
      success: false,
      error: 'Missing Phone Number ID or Permanent Access Token. Please configure them in Settings.',
    };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(config.phoneNumberId)}?fields=verified_name,display_phone_number,quality_rating,code_verification_status&access_token=${encodeURIComponent(config.accessToken)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || `Meta Graph API HTTP ${res.status}`,
        details: data.error,
      };
    }

    return {
      success: true,
      verifiedName: data.verified_name || 'RealSalePro',
      displayPhoneNumber: data.display_phone_number || '+91 70797 37773',
      qualityRating: data.quality_rating || 'GREEN',
      codeVerificationStatus: data.code_verification_status || 'VERIFIED',
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Send raw outbound WhatsApp message via Meta Cloud API
 */
export async function sendMetaOutboundMessage({ toPhone, text, templateName, languageCode = 'en', bodyParams = [] }) {
  const config = await getWhatsAppConfig();
  if (!config.phoneNumberId || !config.accessToken) {
    throw new Error('Meta WhatsApp Cloud API is not configured. Missing Phone Number ID or Access Token.');
  }

  const normalizedTo = normalizeWhatsAppPhone(toPhone);
  const url = `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`;

  let payload;
  if (templateName) {
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedTo,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: bodyParams && bodyParams.length > 0 ? [
          {
            type: 'body',
            parameters: bodyParams.map(p => ({ type: 'text', text: String(p) })),
          },
        ] : undefined,
      },
    };
  } else {
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedTo,
      type: 'text',
      text: { preview_url: true, body: text },
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    const errorMsg = data.error?.message || `Meta HTTP ${res.status}`;
    throw new Error(errorMsg);
  }

  return {
    success: true,
    messageId: data.messages?.[0]?.id,
    data,
  };
}

/**
 * Dispatch an automated Bot Reply to visitor
 */
async function sendBotReply(conversation, text) {
  try {
    const metaRes = await sendMetaOutboundMessage({
      toPhone: conversation.phone,
      text,
    });

    await query(`
      INSERT INTO whatsapp_messages (
        conversation_id, direction, sender_type, sender_name, message_type, body, meta_message_id, status
      ) VALUES ($1, 'outbound', 'bot', 'RealSalePro Bot', 'text', $2, $3, 'sent')
    `, [conversation.id, text, metaRes.messageId]);

    await query(`
      UPDATE whatsapp_conversations
      SET last_message = $1, last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [text, conversation.id]);
  } catch (err) {
    console.error(`Failed to send Bot reply to ${conversation.phone}:`, err.message);
  }
}

/**
 * Intelligently generate Landing Page Visitor Bot responses
 */
function evaluateVisitorIntent(messageText, customerName) {
  const text = String(messageText || '').trim().toLowerCase();
  const nameSalutation = customerName ? ` ${customerName}` : '';

  // 1. Handover to Live Support / Agent / Human
  if (
    text === '5' ||
    text.includes('support') ||
    text.includes('live support') ||
    text.includes('agent') ||
    text.includes('human') ||
    text.includes('talk') ||
    text.includes('help') ||
    text.includes('representative') ||
    text.includes('call me') ||
    text.includes('executive') ||
    text.includes('specialist')
  ) {
    return {
      intent: 'agent_handover',
      reply: `Connecting you with our Live Support team${nameSalutation}! 👤\n\nI have notified our on-duty team. Someone from RealSalePro will reply to you directly in this chat shortly.\n\n📞 Need immediate assistance? You can also call us directly at +91 70797 37773.`,
    };
  }

  // 2. Demo / Free 1,000 Leads Account / Register
  if (
    text === '1' ||
    text.includes('demo') ||
    text.includes('1000') ||
    text.includes('1,000') ||
    text.includes('free account') ||
    text.includes('trial') ||
    text.includes('signup') ||
    text.includes('sign up') ||
    text.includes('register') ||
    text.includes('start') ||
    text.includes('onboard')
  ) {
    return {
      intent: 'demo_trial',
      reply: `Great to have you here${nameSalutation}! 🚀\n\nYou can start immediately with our *100% Free Forever Tier* (manage up to 1,000 active client leads with zero expiry, zero time limit, and no credit card required):\n\n👉 *Direct Signup Link:*\nhttps://realsalepro.com/register\n\nPrefer a 15-minute personalized screen walkthrough with our product specialist?\nReply with your *City & Agency Name*, and our team will schedule your VIP demo!`,
    };
  }

  // 3. Pricing / Plans
  if (
    text === '2' ||
    text.includes('price') ||
    text.includes('pricing') ||
    text.includes('plan') ||
    text.includes('cost') ||
    text.includes('charge') ||
    text.includes('rate') ||
    text.includes('per user')
  ) {
    return {
      intent: 'pricing',
      reply: `Here is our transparent pricing structure${nameSalutation}:\n\n🟢 *Free Forever Plan — ₹0/forever*\n• Up to 1,000 active leads\n• Up to 5 team members\n• Deal pipeline & WhatsApp script fast dial\n• Zero credit card required\n\n⚡ *Pro Plan — ₹1,200/month (billed semi-annually)*\n• Up to 2,00,000 active leads\n• Unlimited users & telecaller seats\n• Meta CAPI, 99acres & Magicbricks Webhooks\n• Advanced telecaller phone masking\n\n🏢 *Custom Enterprise*\n• Self-hosted PostgreSQL BYOD database & custom RERA SLA.\n\nCompare full plans: https://realsalepro.com/pricing\n\nReply *5* to speak with our sales manager for custom agency billing!`,
    };
  }

  // 4. Features / Masking / Webhooks
  if (
    text === '3' ||
    text.includes('feature') ||
    text.includes('mask') ||
    text.includes('webhook') ||
    text.includes('magicbricks') ||
    text.includes('99acres') ||
    text.includes('theft') ||
    text.includes('pipeline')
  ) {
    return {
      intent: 'features',
      reply: `RealSalePro is built specifically for Indian Real Estate builders & brokerages:\n\n🛡️ *Staff Phone Masking:* Hides the last 5 digits of buyer numbers from telecallers so your client database never leaks when staff leaves.\n\n⚡ *Sub-30s Portal Webhooks:* Direct integrations for Facebook Lead Ads, 99acres, Magicbricks, and Housing.com.\n\n📍 *Site Visit Dispatch:* Send Google Maps route pins to clients on WhatsApp, track drivers, and capture instant visitor feedback.\n\n💰 *Automatic Token Conversion:* 1-Click convert booked leads to sales records with brokerage commission calculation.\n\nExplore all features: https://realsalepro.com/features/lead-management`,
    };
  }

  // 5. Free Excel CRM Template
  if (
    text === '4' ||
    text.includes('excel') ||
    text.includes('template') ||
    text.includes('sheet') ||
    text.includes('download') ||
    text.includes('tracker')
  ) {
    return {
      intent: 'excel_template',
      reply: `Here is our free Indian Real Estate CRM spreadsheet template:\n\n📥 *Free Download Link:*\nhttps://realsalepro.com/templates/real-estate-crm-excel-template\n\nIt comes pre-formatted with Indian property stages (New, Follow-up, Site Visit, Token Paid), formula calculations, and follow-up cadences.\n\nWhenever you're ready to automate past manual Excel sheets, RealSalePro will import your sheet in under 60 seconds!`,
    };
  }

  // Default Greeting / Menu
  return {
    intent: 'greeting_menu',
    reply: `Namaste${nameSalutation}! 👋 Welcome to *RealSalePro* — India's Real Estate Sales & CRM Platform.\n\nHow can I help you today? Please reply with a number:\n\n1️⃣ *1,000 Leads Free Forever Account & Demo*\n2️⃣ *View Pricing & Compare Plans*\n3️⃣ *Explore Key Features (Phone Masking, Webhooks)*\n4️⃣ *Download Free Real Estate Excel Template*\n5️⃣ *Live Support Available*\n\n💬 Live support is also available — or feel free to type your question directly!`,
  };
}

/**
 * Intelligently generate dynamic Sales responses via DeepSeek AI
 */
export async function generateDeepSeekSalesReply({ messageText, customerName, conversationHistory = [] }) {
  const config = await getWhatsAppConfig();
  const apiKey = config.deepseekApiKey || process.env.DEEPSEEK_API_KEY;

  const text = String(messageText || '').trim().toLowerCase();

  // If user explicitly clicks or types a direct option (1, 2, 3, 4, 5)
  if (['1', '2', '3', '4', '5'].includes(text)) {
    return evaluateVisitorIntent(messageText, customerName);
  }

  // If AI is disabled or no DeepSeek API key is configured yet, fall back to rule engine
  if (!config.aiEnabled || !apiKey) {
    return evaluateVisitorIntent(messageText, customerName);
  }

  const systemPrompt = `You are the official RealSalePro AI Sales Copilot on WhatsApp for RealSalePro (https://realsalepro.com).
Your mission is to understand visitor queries, answer them accurately and persuasively like a top real estate SaaS sales advisor, and guide them to register for the free tier or speak with live support.

🏢 About RealSalePro:
RealSalePro is India's leading Real Estate CRM & Sales Automation platform built specifically for Indian real estate builders, brokers, and channel partner agencies.

⭐ Key Features & Value Propositions:
1. 100% Free Forever Tier:
   - Manage up to 1,000 active client leads with ZERO expiry, zero time limits, and NO credit card required.
   - Up to 5 team member logins (telecallers, sales executives, site staff).
   - Deal pipeline, automated follow-up cadences, and WhatsApp script fast-dial.
   - Direct Signup Link: https://realsalepro.com/register
2. Pro Plan (₹1,200/month, billed semi-annually):
   - Up to 2,00,000 active leads.
   - Unlimited users & telecaller seats.
   - Direct Webhooks for Meta Lead Ads (Facebook & Instagram), 99acres, Magicbricks, and Housing.com (sub-30 second lead capture).
   - Meta Conversions API (CAPI) for lead ad optimization.
   - Advanced staff phone number masking.
   - Plan comparison: https://realsalepro.com/pricing
3. Staff Phone Number Masking (Key Security Feature):
   - Hides the last 5 digits of buyer phone numbers from telecallers (e.g. +91 98765 •••••).
   - Telecallers click-to-dial through the app without ever seeing the buyer's full phone number.
   - Completely prevents telecallers or ex-employees from stealing and selling your client database when they leave.
4. Field Operations & Site Visits:
   - Send Google Maps route pins to clients directly on WhatsApp.
   - Track driver status and collect instant on-site walkthrough feedback.
5. 1-Click Token-to-Sale Conversion:
   - When a booking token is received, 1-click converts the lead to a sale with automatic brokerage commission calculation.
6. Free Excel CRM Spreadsheet Template:
   - Free pre-formatted sheet with Indian property stages (New, Followup, Site Visit, Token Paid) and formulas.
   - Download link: https://realsalepro.com/templates/real-estate-crm-excel-template
7. Support & Handover:
   - Official WhatsApp Support: +91 70797 37773
   - If the visitor wants human assistance or custom enterprise billing, offer Live Support or tell them to reply "5".

Formatting & Tone Instructions for WhatsApp:
- Be warm, professional, concise, and helpful.
- Match the visitor's language: reply in English if they ask in English; reply in natural Hindi (in Devanagari or Hinglish) if they ask in Hindi/Hinglish.
- CRITICAL WHATSAPP FORMATTING RULE: Use single asterisk for bold (*like this*). NEVER use double asterisks (**like this**), because WhatsApp shows double asterisks as visible raw text!
- Use bullet points and suitable emojis (🚀, 🛡️, 💰, 📱, 🏢) to make messages easy to scan on mobile.
- Keep responses concise (under 120 words).
- End with a helpful next step (e.g., asking about their agency/city or inviting them to start the 1,000-lead free tier at https://realsalepro.com/register).`;

  try {
    const historyMessages = conversationHistory.slice(-6).map((m) => ({
      role: m.sender_type === 'visitor' ? 'user' : 'assistant',
      content: m.body,
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      {
        role: 'user',
        content: customerName ? `[Visitor: ${customerName}] ${messageText}` : messageText,
      },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12-second safeguard

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.aiModel || 'deepseek-chat',
        messages,
        temperature: 0.6,
        max_tokens: 450,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await res.json();

    if (!res.ok || !data.choices?.[0]?.message?.content) {
      console.warn('[DeepSeek AI] API response error:', data);
      return evaluateVisitorIntent(messageText, customerName);
    }

    let reply = data.choices[0].message.content.trim();
    // Safety cleaner: Replace any stray double asterisks with single asterisk for WhatsApp
    reply = reply.replace(/\*\*(.*?)\*\*/g, '*$1*');

    return {
      intent: 'deepseek_ai_reply',
      reply,
    };
  } catch (err) {
    console.error('[DeepSeek AI] Call failed, fallback to rule engine:', err.message);
    return evaluateVisitorIntent(messageText, customerName);
  }
}

/**
 * Handle Inbound Webhooks from Meta Cloud API
 */
export async function processIncomingWebhook(body) {
  await initWhatsAppSchema();

  const entries = body?.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      const value = change.value;
      if (!value) continue;

      // 1. Process Message Status Updates (sent, delivered, read, failed)
      if (Array.isArray(value.statuses)) {
        for (const statusObj of value.statuses) {
          const metaMsgId = statusObj.id;
          const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
          const errDetail = statusObj.errors?.[0]?.message || null;

          if (metaMsgId) {
            await query(`
              UPDATE whatsapp_messages
              SET status = $1, error_message = COALESCE($2, error_message)
              WHERE meta_message_id = $3
            `, [status, errDetail, metaMsgId]);
          }
        }
      }

      // 2. Process Inbound Messages
      if (Array.isArray(value.messages)) {
        for (const msg of value.messages) {
          const fromPhone = normalizeWhatsAppPhone(msg.from);
          const metaMessageId = msg.id;
          const contact = (value.contacts || []).find(c => normalizeWhatsAppPhone(c.wa_id) === fromPhone);
          const customerName = contact?.profile?.name || 'Website Visitor';

          // Extract text content (handles text, button reply, or interactive list reply)
          let messageText = '';
          let messageType = 'text';

          if (msg.type === 'text') {
            messageText = msg.text?.body || '';
          } else if (msg.type === 'button') {
            messageText = msg.button?.text || msg.button?.payload || '';
            messageType = 'interactive';
          } else if (msg.type === 'interactive') {
            messageText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
            messageType = 'interactive';
          } else {
            messageText = `[${msg.type.toUpperCase()} Attachment]`;
            messageType = msg.type;
          }

          if (!fromPhone || !messageText) continue;

          // Find or create conversation
          let convRes = await query(`
            INSERT INTO whatsapp_conversations (phone, customer_name, last_message, last_message_at, unread_count, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP)
            ON CONFLICT (phone) DO UPDATE SET
              customer_name = COALESCE(whatsapp_conversations.customer_name, EXCLUDED.customer_name),
              last_message = EXCLUDED.last_message,
              last_message_at = CURRENT_TIMESTAMP,
              unread_count = whatsapp_conversations.unread_count + 1,
              updated_at = CURRENT_TIMESTAMP
            RETURNING *
          `, [fromPhone, customerName, messageText]);

          const conversation = convRes.rows[0];

          // Save message to history
          await query(`
            INSERT INTO whatsapp_messages (
              conversation_id, direction, sender_type, sender_name, message_type, body, meta_message_id, status, raw_payload
            ) VALUES ($1, 'inbound', 'visitor', $2, $3, $4, $5, 'delivered', $6)
          `, [conversation.id, customerName, messageType, messageText, metaMessageId, JSON.stringify(msg)]);

          // Evaluate Visitor Intent & Generate Response (DeepSeek AI or Handover)
          const config = await getWhatsAppConfig();

          // Check if user requested agent handover explicitly
          const normalized = String(messageText || '').trim().toLowerCase();
          const isAgentRequest =
            normalized === '5' ||
            normalized.includes('agent') ||
            normalized.includes('human') ||
            normalized.includes('live support') ||
            normalized.includes('support') ||
            normalized.includes('talk to agent');

          if (isAgentRequest) {
            const handover = evaluateVisitorIntent('5', customerName);
            await query(`
              UPDATE whatsapp_conversations
              SET status = 'agent_requested', updated_at = CURRENT_TIMESTAMP
              WHERE id = $1
            `, [conversation.id]);

            await sendBotReply(conversation, handover.reply);
            continue;
          }

          // If conversation is already assigned to a human agent, DO NOT send bot auto-reply
          if (conversation.status === 'agent_chatting' || conversation.status === 'agent_requested') {
            console.log(`[WhatsApp Hub] Conversation ${conversation.id} is in ${conversation.status} mode. Skipping bot auto-reply.`);
            continue;
          }

          // Fetch recent conversation history for DeepSeek context
          const historyRes = await query(`
            SELECT sender_type, body FROM whatsapp_messages
            WHERE conversation_id = $1
            ORDER BY created_at DESC
            LIMIT 6
          `, [conversation.id]);
          const history = (historyRes.rows || []).reverse();

          // Generate dynamic response via DeepSeek AI (with rule engine fallback)
          const { reply } = await generateDeepSeekSalesReply({
            messageText,
            customerName,
            conversationHistory: history,
          });

          // Send Bot Reply if enabled
          if (config.botEnabled && reply) {
            await sendBotReply(conversation, reply);
          }
        }
      }
    }
  }

  return { success: true };
}

/**
 * Send reply as human agent from Admin Dashboard
 */
export async function sendAgentReply({ conversationId, text, agentProfileId, agentName = 'RealSalePro Team' }) {
  await initWhatsAppSchema();

  const convRes = await query('SELECT * FROM whatsapp_conversations WHERE id = $1', [conversationId]);
  const conversation = convRes.rows[0];
  if (!conversation) throw new Error('Conversation not found');

  // Dispatch outbound message via Meta Cloud API
  const metaRes = await sendMetaOutboundMessage({
    toPhone: conversation.phone,
    text,
  });

  // Record in database
  const msgRes = await query(`
    INSERT INTO whatsapp_messages (
      conversation_id, direction, sender_type, sender_name, message_type, body, meta_message_id, status
    ) VALUES ($1, 'outbound', 'agent', $2, 'text', $3, $4, 'sent')
    RETURNING *
  `, [conversationId, agentName, text, metaRes.messageId]);

  // Update conversation: set status to 'agent_chatting', reset unread, assign agent
  await query(`
    UPDATE whatsapp_conversations
    SET status = 'agent_chatting',
        assigned_to = COALESCE($1, assigned_to),
        last_message = $2,
        last_message_at = CURRENT_TIMESTAMP,
        unread_count = 0,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
  `, [agentProfileId || null, text, conversationId]);

  return { success: true, message: msgRes.rows[0] };
}

/**
 * Toggle Bot active / paused for a specific conversation
 */
export async function toggleBotStatus({ conversationId, status }) {
  await initWhatsAppSchema();
  const validStatus = ['bot_active', 'agent_requested', 'agent_chatting', 'closed'].includes(status) ? status : 'bot_active';

  const res = await query(`
    UPDATE whatsapp_conversations
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `, [validStatus, conversationId]);

  return res.rows[0];
}

/**
 * List Conversations with filters and unread counts
 */
export async function listConversations({ status = 'all', search = '', limit = 50, offset = 0 } = {}) {
  await initWhatsAppSchema();

  let sql = 'SELECT * FROM whatsapp_conversations WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    sql += ` AND (LOWER(customer_name) LIKE $${params.length} OR phone LIKE $${params.length} OR LOWER(last_message) LIKE $${params.length})`;
  }

  sql += ' ORDER BY last_message_at DESC';

  params.push(Math.min(100, Math.max(1, parseInt(limit, 10))));
  sql += ` LIMIT $${params.length}`;

  params.push(Math.max(0, parseInt(offset, 10)));
  sql += ` OFFSET $${params.length}`;

  const res = await query(sql, params);

  // Summary counts
  const countRes = await query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'agent_requested') AS agent_requested_count,
      COUNT(*) FILTER (WHERE status = 'bot_active') AS bot_active_count,
      COUNT(*) FILTER (WHERE status = 'agent_chatting') AS agent_chatting_count,
      COALESCE(SUM(unread_count), 0) AS total_unread
    FROM whatsapp_conversations
  `);

  return {
    conversations: res.rows,
    summary: countRes.rows[0],
  };
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(conversationId) {
  await initWhatsAppSchema();

  // Reset unread count when opening
  await query('UPDATE whatsapp_conversations SET unread_count = 0 WHERE id = $1', [conversationId]);

  const res = await query(`
    SELECT * FROM whatsapp_messages
    WHERE conversation_id = $1
    ORDER BY created_at ASC
  `, [conversationId]);

  return res.rows;
}

/**
 * Dispatch a 6-digit WhatsApp OTP
 */
export async function sendWhatsAppOtp({ phone, purpose = 'signup_verification' }) {
  await initWhatsAppSchema();
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new Error('Valid phone number is required to send WhatsApp OTP');
  }

  // Generate 6-digit numeric OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await query(`
    INSERT INTO whatsapp_otps (phone, otp_code, purpose, expires_at)
    VALUES ($1, $2, $3, $4)
  `, [normalizedPhone, otpCode, purpose, expiresAt]);

  const messageText = `🔒 *RealSalePro Verification Code*\n\nYour security OTP is: *${otpCode}*\n\nThis code is valid for 10 minutes. Please do not share this code with anyone.\n\n— RealSalePro Security Team`;

  try {
    const metaRes = await sendMetaOutboundMessage({
      toPhone: normalizedPhone,
      text: messageText,
    });

    return {
      success: true,
      phone: normalizedPhone,
      messageId: metaRes.messageId,
      expiresAt,
    };
  } catch (err) {
    console.error(`Failed to send WhatsApp OTP to ${normalizedPhone}:`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Verify submitted WhatsApp OTP
 */
export async function verifyWhatsAppOtp({ phone, otp, purpose = 'signup_verification' }) {
  await initWhatsAppSchema();
  const normalizedPhone = normalizeWhatsAppPhone(phone);

  const res = await query(`
    SELECT * FROM whatsapp_otps
    WHERE phone = $1 AND purpose = $2 AND is_verified = false
    ORDER BY created_at DESC
    LIMIT 1
  `, [normalizedPhone, purpose]);

  const record = res.rows[0];
  if (!record) {
    return { success: false, error: 'No active OTP request found for this phone number' };
  }

  if (new Date() > new Date(record.expires_at)) {
    return { success: false, error: 'OTP has expired. Please request a new verification code.' };
  }

  if (record.attempts >= 5) {
    return { success: false, error: 'Too many incorrect attempts. Please request a fresh OTP.' };
  }

  if (record.otp_code !== String(otp).trim()) {
    await query('UPDATE whatsapp_otps SET attempts = attempts + 1 WHERE id = $1', [record.id]);
    return { success: false, error: 'Invalid verification code' };
  }

  // Mark verified
  await query('UPDATE whatsapp_otps SET is_verified = true WHERE id = $1', [record.id]);
  return { success: true, message: 'Phone number verified successfully' };
}

/**
 * Fetch WhatsApp Message Templates from Meta Graph API
 */
export async function listMetaTemplates() {
  const config = await getWhatsAppConfig();
  if (!config.wabaId || !config.accessToken) {
    // Return locally stored templates if Meta credentials not yet entered
    const local = await query('SELECT * FROM whatsapp_templates ORDER BY created_at DESC');
    return {
      success: true,
      templates: local.rows,
      metaConnected: false,
      warning: 'WABA ID or Access Token not configured. Showing cached/local templates.',
    };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(config.wabaId)}/message_templates?limit=100&access_token=${encodeURIComponent(config.accessToken)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `Meta API HTTP ${res.status}`);
    }

    const metaTemplates = data.data || [];

    // Sync Meta templates to local DB
    for (const tpl of metaTemplates) {
      await query(`
        INSERT INTO whatsapp_templates (name, category, language, status, meta_template_id, components, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (name) DO UPDATE SET
          category = EXCLUDED.category,
          language = EXCLUDED.language,
          status = EXCLUDED.status,
          meta_template_id = EXCLUDED.meta_template_id,
          components = EXCLUDED.components,
          updated_at = CURRENT_TIMESTAMP
      `, [
        tpl.name,
        tpl.category,
        tpl.language,
        tpl.status,
        tpl.id,
        JSON.stringify(tpl.components || []),
      ]);
    }

    return {
      success: true,
      templates: metaTemplates,
      metaConnected: true,
    };
  } catch (err) {
    console.error('Error fetching Meta templates:', err.message);
    const local = await query('SELECT * FROM whatsapp_templates ORDER BY created_at DESC');
    return {
      success: false,
      error: err.message,
      templates: local.rows,
    };
  }
}

/**
 * Submit New Message Template to Meta for instant review
 */
export async function createMetaTemplate({ name, category, language = 'en', components }) {
  const config = await getWhatsAppConfig();
  if (!config.wabaId || !config.accessToken) {
    throw new Error('WABA ID and Permanent Access Token are required to submit templates to Meta.');
  }

  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(config.wabaId)}/message_templates`;
  const payload = {
    name: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    category,
    language,
    components,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to submit template to Meta');
  }

  await query(`
    INSERT INTO whatsapp_templates (name, category, language, status, meta_template_id, components)
    VALUES ($1, $2, $3, 'PENDING', $4, $5)
    ON CONFLICT (name) DO UPDATE SET
      category = EXCLUDED.category,
      language = EXCLUDED.language,
      status = 'PENDING',
      meta_template_id = EXCLUDED.meta_template_id,
      components = EXCLUDED.components,
      updated_at = CURRENT_TIMESTAMP
  `, [payload.name, category, language, data.id, JSON.stringify(components)]);

  return { success: true, templateId: data.id, status: 'PENDING' };
}

/**
 * Delete Template from Meta
 */
export async function deleteMetaTemplate(name) {
  const config = await getWhatsAppConfig();
  if (!config.wabaId || !config.accessToken) {
    throw new Error('WABA ID and Access Token required');
  }

  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(config.wabaId)}/message_templates?name=${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to delete template from Meta');
  }

  await query('DELETE FROM whatsapp_templates WHERE name = $1', [name]);
  return { success: true };
}

/**
 * Create and dispatch a WhatsApp Broadcast Campaign
 */
export async function createBroadcastCampaign({
  title,
  templateName,
  customMessage,
  targetAudience = 'all_leads',
  phones = [],
  createdBy,
}) {
  await initWhatsAppSchema();

  // If phones not explicitly supplied, pull prospective leads from DB
  let recipientPhones = phones.map(p => normalizeWhatsAppPhone(p)).filter(Boolean);

  if (recipientPhones.length === 0) {
    const leadsRes = await query(`
      SELECT DISTINCT phone FROM (
        SELECT mobile AS phone FROM leads WHERE mobile IS NOT NULL AND mobile != ''
        UNION
        SELECT phone FROM whatsapp_conversations WHERE phone IS NOT NULL AND phone != ''
      ) AS unified_prospects
      LIMIT 500
    `);
    recipientPhones = leadsRes.rows.map(r => normalizeWhatsAppPhone(r.phone)).filter(Boolean);
  }

  const broadcastRes = await query(`
    INSERT INTO whatsapp_broadcasts (
      title, template_name, custom_message, target_audience, total_recipients, status, created_by
    ) VALUES ($1, $2, $3, $4, $5, 'processing', $6)
    RETURNING *
  `, [title, templateName || null, customMessage || null, targetAudience, recipientPhones.length, createdBy || null]);

  const broadcast = broadcastRes.rows[0];

  // Async dispatch without blocking response
  (async () => {
    let sent = 0;
    let failed = 0;

    for (const phone of recipientPhones) {
      try {
        if (templateName) {
          await sendMetaOutboundMessage({ toPhone: phone, templateName });
        } else if (customMessage) {
          await sendMetaOutboundMessage({ toPhone: phone, text: customMessage });
        }
        sent++;
      } catch (e) {
        failed++;
        console.warn(`[Broadcast ${broadcast.id}] Failed to dispatch to ${phone}:`, e.message);
      }
      // Modest pause between dispatches to stay well within Meta Cloud API tiers (80 msg/sec)
      await new Promise(r => setTimeout(r, 60));
    }

    await query(`
      UPDATE whatsapp_broadcasts
      SET sent_count = $1, failed_count = $2, status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [sent, failed, broadcast.id]);
  })().catch(err => console.error('Broadcast execution error:', err));

  return broadcast;
}

/**
 * List Broadcast Campaigns
 */
export async function listBroadcasts() {
  await initWhatsAppSchema();
  const res = await query('SELECT * FROM whatsapp_broadcasts ORDER BY created_at DESC LIMIT 50');
  return res.rows;
}

