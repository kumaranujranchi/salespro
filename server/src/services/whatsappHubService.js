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
 * Dispatch an automated Sales Advisor Reply to visitor
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
      ) VALUES ($1, 'outbound', 'agent', 'Rahul (Sales Team)', 'text', $2, $3, 'sent')
    `, [conversation.id, text, metaRes.messageId]);

    await query(`
      UPDATE whatsapp_conversations
      SET last_message = $1, last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [text, conversation.id]);
  } catch (err) {
    console.error(`Failed to send Sales Advisor reply to ${conversation.phone}:`, err.message);
  }
}

/**
 * Intelligent Lead Extractor:
 * Detects Name, City, and Company/Firm from inbound WhatsApp conversation
 * so sales executives can call the prospect with full context.
 */
export async function extractAndSaveLeadDetails({ conversation, messageText }) {
  if (!conversation || !messageText) return;
  const text = String(messageText).trim();

  let detectedName = null;
  let detectedCity = null;
  let detectedCompany = null;

  // 1. Detect Name patterns
  const namePatterns = [
    /(?:mera naam|my name is|i am|this is|naam)\s+([A-Za-z\s]{2,30})/i,
    /(?:myself|im)\s+([A-Za-z\s]{2,30})/i,
  ];
  for (const pat of namePatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const candidate = match[1].replace(/(from|se|in|city|company|firm|builders|realty|properties).*$/i, '').trim();
      if (candidate.length >= 2 && candidate.length <= 30 && !/^(here|hey|user|visitor|broker|agent)$/i.test(candidate)) {
        detectedName = candidate;
        break;
      }
    }
  }

  // 2. Detect City patterns (popular Indian real estate hubs)
  const indianCities = [
    'mumbai', 'delhi', 'noida', 'gurgaon', 'gurugram', 'ghaziabad', 'faridabad',
    'bangalore', 'bengaluru', 'hyderabad', 'pune', 'kolkata', 'chennai',
    'ahmedabad', 'jaipur', 'lucknow', 'patna', 'ranchi', 'indore', 'bhopal',
    'chandigarh', 'kochi', 'surat', 'vadodara', 'nagpur', 'dehradun', 'varanasi',
    'kanpur', 'agra', 'bhubaneswar', 'coimbatore', 'ludhiana', 'amritsar', 'nashik'
  ];
  for (const city of indianCities) {
    const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
    if (cityRegex.test(text)) {
      detectedCity = city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }

  // 3. Detect Company / Firm patterns
  const companyPatterns = [
    /(?:company|firm|brokerage|agency name|from)\s+(?:is\s+)?([A-Za-z0-9\s]{2,40})/i,
    /([A-Za-z0-9\s]{2,30}\s+(?:realty|properties|developers|infra|infrastructures|builders|group|associates|estates|homes))/i,
  ];
  for (const pat of companyPatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length >= 3 && candidate.length <= 40) {
        detectedCompany = candidate;
        break;
      }
    }
  }

  // Update conversation if new details found
  const updates = [];
  const params = [];
  let pIdx = 1;

  const currentMetadata = conversation.metadata || {};
  let metadataChanged = false;
  const newMetadata = { ...currentMetadata };

  if (detectedCity && newMetadata.city !== detectedCity) {
    newMetadata.city = detectedCity;
    metadataChanged = true;
  }
  if (detectedCompany && newMetadata.company_name !== detectedCompany) {
    newMetadata.company_name = detectedCompany;
    metadataChanged = true;
  }

  const currentName = conversation.customer_name || '';
  const isGenericName = !currentName || /^(website visitor|hey|visitor|user|\+)/i.test(currentName.trim());

  if (detectedName && (isGenericName || currentName.length < 3)) {
    updates.push(`customer_name = $${pIdx++}`);
    params.push(detectedName);
  }

  if (metadataChanged) {
    newMetadata.lead_captured_at = newMetadata.lead_captured_at || new Date().toISOString();
    updates.push(`metadata = $${pIdx++}::jsonb`);
    params.push(JSON.stringify(newMetadata));
  }

  if (updates.length > 0) {
    params.push(conversation.id);
    await query(`
      UPDATE whatsapp_conversations
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${pIdx}
    `, params);
  }
}

/**
 * Natural Human Sales Rule Engine (Fallback & Direct Numbers)
 */
function evaluateVisitorIntent(messageText, customerName) {
  const text = String(messageText || '').trim().toLowerCase();
  const validName = (customerName && !['hey', 'visitor', 'user', 'website visitor'].includes(customerName.toLowerCase().trim()))
    ? customerName.trim()
    : null;
  const nameSalutation = validName ? ` ${validName} ji` : '';

  // 1. Handover to Live Support / Call / Human
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
      reply: `Ji bilkul${nameSalutation}! Main hamare senior sales manager ko notify kar raha hoon, wo thodi der mein aapse is chat par connect karenge.\n\nAgar immediate baat karni ho toh aap humein direct call bhi kar sakte hain: +91 70797 37773.`,
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
      reply: `Namaste${nameSalutation}! Aap hamara 100% Free Forever plan direct shuru kar sakte hain (1,000 leads tak lifetime free, koi credit card nahi chahiye):\n\n👉 https://realsalepro.com/register\n\nAgar aap 15-minute ka live screen walkthrough chahte hain, toh kripya apna Name aur City bata dijiye, main demo schedule karwa deta hoon!`,
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
      reply: `RealSalePro mein 1,000 leads aur 5 team logins tak bilkul Free Forever hai (₹0, zero credit card required). Badi teams ke liye Pro plan sirf ₹1,200/month hai unlimited users ke saath.\n\nAap bina kisi risk ke free tier try kar sakte hain: https://realsalepro.com/register\n\nAapki team mein kitne members hain?`,
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
      reply: `RealSalePro mein do sabse popular features hain:\n1. Staff Phone Masking — telecallers ko last 5 digits hide rehte hain taaki client data safe rahe.\n2. Sub-30s Webhooks — Meta Ads aur portals se leads instant sync hoti hain.\n\nAap 1,000 leads tak free mein test kar sakte hain: https://realsalepro.com/register\n\nAapka project kis city mein hai?`,
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
      reply: `Ji, yeh raha hamara free Indian Real Estate CRM Excel template:\n\n👉 https://realsalepro.com/templates/real-estate-crm-excel-template\n\nJab bhi aap manual Excel sheet se automated CRM pe shift hona chahein, RealSalePro aapki sheet 1 minute mein import kar lega!`,
    };
  }

  // Default Greeting (Completely human, asks for Name & City early)
  return {
    intent: 'greeting_human',
    reply: `Namaste! 🙏 Main Rahul hoon RealSalePro sales team se.\n\nAapki kaise help kar sakta hoon? Aur aapka shubh naam aur company kis city mein hai?`,
  };
}

/**
 * Humanized Sales Advisor via DeepSeek AI
 * Acts 100% as Rahul from RealSalePro Sales Team. Zero robotic giveaways.
 */
export async function generateDeepSeekSalesReply({ messageText, customerName, conversationHistory = [], conversationMetadata = {} }) {
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

  const validName = (customerName && !['hey', 'visitor', 'user', 'website visitor'].includes(customerName.toLowerCase().trim()))
    ? customerName.trim()
    : null;

  const systemPrompt = `You are Rahul, a senior real estate sales executive at RealSalePro (https://realsalepro.com) chatting with an inbound prospect on WhatsApp.

CRITICAL IDENTITY RULES (NEVER BREAK):
1. YOU ARE 100% HUMAN. You are Rahul from the RealSalePro sales team.
2. NEVER mention or admit that you are an AI, bot, virtual assistant, algorithm, or automated response.
3. If asked "Are you a bot?", "AI ho kya?", or "Are you real?", reply naturally:
   - In Hindi: "Nahi sir, main RealSalePro sales team se Rahul baat kar raha hoon! Aap batayein kaise help kar sakta hoon?"
   - In English: "Haha no, I'm Rahul from the RealSalePro team! How can I help you today?"
4. ZERO BOT CLICHÉS:
   - NEVER start with "Great question! 🚀", "Hello there!", "I would be happy to help with that!", "Here is a breakdown:", or "Hope this helps!".
   - NEVER send bulleted lists of emojis (e.g. 💰📱🛡️🏢🚀👉). Real humans NEVER type 5 bullet points with 5 emojis on WhatsApp.
   - At most 1 subtle emoji (like 🙏 or 👍) in the entire message.
5. STRICT TOKEN & MESSAGE LIMIT:
   - Keep responses strictly to 2 to 4 sentences (under 60 words).
   - Real WhatsApp messages are short and crisp. This keeps token usage minimal and conversations natural.
6. CORE SALES OBJECTIVES:
   - QUALIFY & COLLECT DETAILS EARLY: In the first 1-2 interactions, if you don't already know their Name, City, or Company, ask politely in a natural flow (e.g. "Aapka shubh naam aur company kis city mein hai?" or "Waise aapka project kis city mein chal raha hai?"). We need this so our team can follow up with them on a call.
   - PROBLEM-FIRST CONSULTATIVE SELLING: Understand what problem they face (telecallers leaking/stealing leads, delayed Meta ads lead followups, messy Excel sheets, lost site visit bookings), and explain only the specific RealSalePro feature that solves it.
   - RISK-FREE SIGNUP: Emphasize that RealSalePro is 100% Free Forever for up to 1,000 active leads and 5 users with zero expiry and NO credit card required. Link: https://realsalepro.com/register
   - Maximum 1 URL per message.
7. TERMINOLOGY & LANGUAGE:
   - Always refer to their business as a "company" or "real estate firm" (NEVER use "agency").
   - Match the prospect's language: If they text in Hindi/Hinglish ("kya price hai", "leads kaise aayenge"), reply in natural, respectful Hinglish. If they text in English, reply in natural Indian English.
   - Use single asterisks for bold (*like this*). NEVER use double asterisks (**like this**).`;

  try {
    const historyMessages = conversationHistory.slice(-5).map((m) => ({
      role: m.sender_type === 'visitor' ? 'user' : 'assistant',
      content: m.body,
    }));

    let contextPrefix = '';
    if (validName) contextPrefix += `[Prospect Name: ${validName}] `;
    if (conversationMetadata.city) contextPrefix += `[City: ${conversationMetadata.city}] `;
    if (conversationMetadata.company_name) contextPrefix += `[Company: ${conversationMetadata.company_name}] `;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      {
        role: 'user',
        content: contextPrefix ? `${contextPrefix}\n${messageText}` : messageText,
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
        temperature: 0.5,
        max_tokens: 180, // Enforces short, crisp, low-token responses!
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
    // Safety cleaner: Ensure "agency" / "agencies" is replaced with "company" / "companies"
    reply = reply
      .replace(/\bAgencies\b/g, 'Companies')
      .replace(/\bagencies\b/g, 'companies')
      .replace(/\bAgency\b/g, 'Company')
      .replace(/\bagency\b/g, 'company');

    // Safety cleaner: Strip robotic bot openers if accidentally generated
    reply = reply
      .replace(/^great question!\s*🚀?/i, '')
      .replace(/^hello there!\s*🚀?/i, '')
      .trim();

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
          const rawName = (contact?.profile?.name || '').trim();
          const isGenericName = !rawName || /^(hey|visitor|user|website visitor)$/i.test(rawName);
          const customerName = isGenericName ? null : rawName;

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
            VALUES ($1, COALESCE($2, 'Website Visitor'), $3, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP)
            ON CONFLICT (phone) DO UPDATE SET
              customer_name = CASE
                WHEN whatsapp_conversations.customer_name IS NOT NULL 
                     AND whatsapp_conversations.customer_name != '' 
                     AND whatsapp_conversations.customer_name != 'Website Visitor' 
                     AND whatsapp_conversations.customer_name != 'Hey'
                THEN whatsapp_conversations.customer_name
                WHEN EXCLUDED.customer_name IS NOT NULL 
                     AND EXCLUDED.customer_name != '' 
                     AND EXCLUDED.customer_name != 'Website Visitor'
                THEN EXCLUDED.customer_name
                ELSE 'Website Visitor'
              END,
              last_message = EXCLUDED.last_message,
              last_message_at = CURRENT_TIMESTAMP,
              unread_count = whatsapp_conversations.unread_count + 1,
              updated_at = CURRENT_TIMESTAMP
            RETURNING *
          `, [fromPhone, customerName, messageText]);

          let conversation = convRes.rows[0];

          // Save message to history
          await query(`
            INSERT INTO whatsapp_messages (
              conversation_id, direction, sender_type, sender_name, message_type, body, meta_message_id, status, raw_payload
            ) VALUES ($1, 'inbound', 'visitor', $2, $3, $4, $5, 'delivered', $6)
          `, [conversation.id, conversation.customer_name || 'Prospect', messageType, messageText, metaMessageId, JSON.stringify(msg)]);

          // Extract & persist lead details (Name, City, Company) from message text for sales follow-up
          await extractAndSaveLeadDetails({ conversation, messageText });

          // Reload updated conversation (with newly extracted name/city/company)
          const refreshedConvRes = await query('SELECT * FROM whatsapp_conversations WHERE id = $1', [conversation.id]);
          if (refreshedConvRes.rows[0]) {
            conversation = refreshedConvRes.rows[0];
          }

          // Evaluate Visitor Intent & Generate Response (DeepSeek AI or Handover)
          const config = await getWhatsAppConfig();

          const effectiveName = (conversation.customer_name && !['website visitor', 'hey', 'visitor', 'user'].includes(conversation.customer_name.toLowerCase().trim()))
            ? conversation.customer_name
            : null;

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
            const handover = evaluateVisitorIntent('5', effectiveName);
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

          // Fetch recent conversation history for DeepSeek context (last 5 messages)
          const historyRes = await query(`
            SELECT sender_type, body FROM whatsapp_messages
            WHERE conversation_id = $1
            ORDER BY created_at DESC
            LIMIT 5
          `, [conversation.id]);
          const history = (historyRes.rows || []).reverse();

          // Generate dynamic response via DeepSeek AI (with rule engine fallback)
          const { reply } = await generateDeepSeekSalesReply({
            messageText,
            customerName: effectiveName,
            conversationHistory: history,
            conversationMetadata: conversation.metadata || {},
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

