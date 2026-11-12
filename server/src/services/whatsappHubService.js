import { query } from '../db/index.js';
import crypto from 'crypto';
import {
  initLeadIntelligenceSchema,
  analyzeLeadAuthenticity,
  getLearnedGuidanceForPrompt,
} from './leadIntelligenceService.js';

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
 * Helper to get current Indian Standard Time (IST) details
 * Used for time-aware smart conversational replies (Working Hours vs Night / Off-Hours)
 */
export function getIndiaTimeContext() {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = istFormatter.formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

  const displayTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(now);

  // Business hours: 10:00 AM to 7:30 PM IST
  const isWorkingHours = hour >= 10 && (hour < 19 || (hour === 19 && minute <= 30));
  const isNight = !isWorkingHours;

  return {
    hour,
    minute,
    displayTime,
    isWorkingHours,
    isNight,
  };
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
        tenant_id VARCHAR(255) REFERENCES tenants(id) ON DELETE CASCADE,
        phone VARCHAR(50) NOT NULL,
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

      ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) REFERENCES tenants(id) ON DELETE CASCADE;
      ALTER TABLE whatsapp_conversations DROP CONSTRAINT IF EXISTS whatsapp_conversations_phone_key;
      CREATE INDEX IF NOT EXISTS idx_wa_conv_tenant ON whatsapp_conversations(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_wa_conv_tenant_phone ON whatsapp_conversations(tenant_id, phone);
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

      ALTER TABLE whatsapp_broadcasts ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) REFERENCES tenants(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_wa_broadcasts_tenant ON whatsapp_broadcasts(tenant_id);

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

    // Initialize Lead Intelligence & Continuous Learning Schema
    await initLeadIntelligenceSchema();

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
 * Supports multi-tenant routing: looks up tenant credentials if tenantId is provided.
 */
export async function sendMetaOutboundMessage({ toPhone, text, templateName, languageCode = 'en', bodyParams = [], tenantId = null }) {
  let phoneNumberId = null;
  let accessToken = null;

  if (tenantId) {
    const tRes = await query('SELECT settings FROM tenants WHERE id = $1', [tenantId]);
    const wa = tRes.rows[0]?.settings?.integrations?.whatsapp;
    if (wa?.phoneNumberId && wa?.accessToken) {
      phoneNumberId = wa.phoneNumberId;
      accessToken = wa.accessToken;
    }
  }

  if (!phoneNumberId || !accessToken) {
    const config = await getWhatsAppConfig();
    phoneNumberId = config.phoneNumberId;
    accessToken = config.accessToken;
  }

  if (!phoneNumberId || !accessToken) {
    throw new Error('Meta WhatsApp Cloud API is not configured. Missing Phone Number ID or Access Token.');
  }

  const normalizedTo = normalizeWhatsAppPhone(toPhone);
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

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
      Authorization: `Bearer ${accessToken}`,
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
      tenantId: conversation.tenant_id || null,
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
  const rawText = String(messageText).trim();
  const lowerText = rawText.toLowerCase();

  let detectedName = null;
  let detectedCity = null;
  let detectedCompany = null;
  let detectedTeamSize = null;
  let detectedCurrentTool = null;
  let detectedPlanInterest = null;

  // 1. Detect Real Customer Name
  // Matches "Name: Aditya", "Naam: Rahul", "mera naam Aditya hai", "my name is Aditya", "myself Aditya", "Aditya from RJ Builders"
  const namePatterns = [
    /(?:^|\n|\b)(?:name|naam|mera naam|my name is|i am|this is|myself|im)\s*[:=\-]?\s*([A-Za-z][A-Za-z\s]{1,25})/im,
  ];
  for (const pat of namePatterns) {
    const match = rawText.match(pat);
    if (match && match[1]) {
      let candidate = match[1].split(/\r?\n/)[0].trim();
      candidate = candidate.replace(/(?:from|se|in|city|company|firm|builders|realty|properties|developers|hai).*$/i, '').trim();
      if (
        candidate.length >= 2 &&
        candidate.length <= 25 &&
        !/^(here|hey|user|visitor|broker|agent|admin|pricing|yes|haan|nahi|no|ok|thik|none|not|patna|delhi|mumbai)$/i.test(candidate)
      ) {
        detectedName = candidate;
        break;
      }
    }
  }

  // 2. Detect Company / Firm patterns
  // Matches "Company name: RJ Builders", "RJ Builders", "DLF Properties", "Shree Ram Realty"
  const companyPatterns = [
    /(?:^|\n|\b)(?:company(?:\s*name)?|firm(?:\s*name)?|agency(?:\s*name)?|developer(?:\s*name)?|brokerage)\s*[:=\-]?\s*([A-Za-z0-9\s&.]{2,40})/im,
    /([A-Za-z0-9\s&.]{2,30}\s+(?:realty|properties|developers|infra|infrastructures|builders|group|associates|estates|homes|realtors|promoters))/i,
  ];
  for (const pat of companyPatterns) {
    const match = rawText.match(pat);
    if (match && match[1]) {
      let candidate = match[1].split(/\r?\n/)[0].trim();
      if (candidate.length >= 3 && candidate.length <= 40 && !/^(is|are|name|patna|delhi|mumbai|salesforce|crm)$/i.test(candidate)) {
        detectedCompany = candidate;
        break;
      }
    }
  }

  // 3. Detect City patterns (popular Indian real estate hubs)
  const indianCities = [
    'patna', 'ranchi', 'jamshedpur', 'dhanbad', 'kolkata', 'bhubaneswar', 'muzaffarpur', 'gaya',
    'varanasi', 'lucknow', 'kanpur', 'gorakhpur', 'prayagraj', 'agra', 'meerut', 'noida', 'greater noida',
    'gurgaon', 'gurugram', 'delhi', 'new delhi', 'faridabad', 'ghaziabad', 'jaipur', 'udaipur', 'jodhpur', 'kota',
    'indore', 'bhopal', 'gwalior', 'jabalpur', 'ahmedabad', 'surat', 'vadodara', 'rajkot', 'mumbai', 'pune',
    'nagpur', 'nashik', 'thane', 'navi mumbai', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'coimbatore',
    'kochi', 'trivandrum', 'chandigarh', 'mohali', 'ludhiana', 'amritsar', 'dehradun', 'guwahati'
  ];
  for (const city of indianCities) {
    const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
    if (cityRegex.test(lowerText)) {
      detectedCity = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  // 4. Detect Team Size / Users
  // Matches "10+", "10 members", "team size 15", "5 log", "20 users"
  const teamPatterns = [
    /(?:team(?:\s*size)?|users?|members?|logins?|staff|telecallers?|agents?)\s*[:=\-]?\s*(\d{1,4}\+?)/i,
    /(\d{1,4}\+?)\s*(?:users?|members?|people|logins?|staff|telecallers?|agents?|log\b)/i,
    /^(\d{1,3}\+?)$/,
  ];
  for (const pat of teamPatterns) {
    const match = rawText.match(pat);
    if (match && match[1]) {
      detectedTeamSize = match[1].trim();
      break;
    }
  }

  // 5. Detect Current CRM / Tool
  // Matches "Salesforce", "HubSpot", "Zoho", "LeadSquared", "Sell.do", "Excel", "Google Sheets"
  const toolPatterns = [
    /\b(salesforce|hubspot|zoho|leadsquared|leadsqquared|sell\.?do|selldo|excel|google sheets|sheets|bitrix24|freshsales|kylas)\b/i,
  ];
  for (const pat of toolPatterns) {
    const match = lowerText.match(pat);
    if (match && match[1]) {
      detectedCurrentTool = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      break;
    }
  }

  // 6. Detect Plan Interest
  if (/\b(?:paid|pro plan|pro\b|unlimited)\b/i.test(lowerText)) {
    detectedPlanInterest = 'Pro Plan (Paid / Unlimited Users)';
  } else if (/\b(?:free|trial|zero cost|1000 leads)\b/i.test(lowerText)) {
    detectedPlanInterest = 'Free Forever Plan (1,000 Leads)';
  }

  // 7. Track key session milestones & topics covered
  const currentMetadata = conversation.metadata || {};
  let metadataChanged = false;
  const newMetadata = { ...currentMetadata };

  if (/\b(?:price|pricing|cost|rate|kitna|charges|quote)\b/i.test(lowerText) && !newMetadata.discussed_pricing) {
    newMetadata.discussed_pricing = true;
    metadataChanged = true;
  }
  if (/\b(?:demo|walkthrough|screen|presentation|schedule)\b/i.test(lowerText) && !newMetadata.requested_demo) {
    newMetadata.requested_demo = true;
    metadataChanged = true;
  }
  if (/\b(?:call|phone|number|baat|connect)\b/i.test(lowerText) && !newMetadata.requested_call) {
    newMetadata.requested_call = true;
    metadataChanged = true;
  }
  if (/\b(?:bot|ai|robot|real|human)\b/i.test(lowerText) && !newMetadata.asked_if_bot) {
    newMetadata.asked_if_bot = true;
    metadataChanged = true;
  }

  // Update conversation if new details found
  const updates = [];
  const params = [];
  let pIdx = 1;

  if (detectedCity && newMetadata.city !== detectedCity) {
    newMetadata.city = detectedCity;
    metadataChanged = true;
  }
  if (detectedCompany && newMetadata.company_name !== detectedCompany) {
    newMetadata.company_name = detectedCompany;
    metadataChanged = true;
  }
  if (detectedTeamSize && newMetadata.team_size !== detectedTeamSize) {
    newMetadata.team_size = detectedTeamSize;
    metadataChanged = true;
  }
  if (detectedCurrentTool && newMetadata.current_tool !== detectedCurrentTool) {
    newMetadata.current_tool = detectedCurrentTool;
    metadataChanged = true;
  }
  if (detectedPlanInterest && newMetadata.plan_interest !== detectedPlanInterest) {
    newMetadata.plan_interest = detectedPlanInterest;
    metadataChanged = true;
  }

  const currentName = (conversation.customer_name || '').trim();
  const isGenericOrHandle = !currentName ||
    /^(website visitor|hey|visitor|user|\+|mydigitalera)/i.test(currentName) ||
    currentName.length < 3;

  if (detectedName) {
    newMetadata.stated_name = detectedName;
    metadataChanged = true;

    // Update customer_name in DB if currently generic/handle or explicitly specified
    if (isGenericOrHandle || currentName.toLowerCase() !== detectedName.toLowerCase()) {
      updates.push(`customer_name = $${pIdx++}`);
      params.push(detectedName);
      conversation.customer_name = detectedName;
    }
  }

  if (metadataChanged) {
    newMetadata.lead_captured_at = newMetadata.lead_captured_at || new Date().toISOString();
    updates.push(`metadata = $${pIdx++}::jsonb`);
    params.push(JSON.stringify(newMetadata));
    conversation.metadata = newMetadata;
  }

  if (updates.length > 0) {
    params.push(conversation.id);
    await query(`
      UPDATE whatsapp_conversations
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${pIdx}
    `, params);
  }

  // If this conversation belongs to a tenant, synchronize newly discovered profile info to tenant's CRM leads
  if (conversation.tenant_id && (detectedName || detectedCity || detectedCompany)) {
    try {
      const last10 = String(conversation.phone || '').slice(-10);
      await query(`
        UPDATE leads
        SET customer_name = COALESCE($1, customer_name),
            city = COALESCE($2, city),
            updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $3 AND (mobile = $4 OR mobile LIKE $5)
      `, [
        detectedName || conversation.customer_name || null,
        detectedCity || null,
        conversation.tenant_id,
        last10,
        `%${last10}`
      ]);
    } catch (e) {
      console.warn('[extractAndSaveLeadDetails] Tenant CRM lead sync warning:', e.message);
    }
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
    const timeCtx = getIndiaTimeContext();
    if (timeCtx.isWorkingHours) {
      return {
        intent: 'agent_handover',
        reply: `Ji bilkul${nameSalutation}! Main hamare senior sales manager ko notify kar raha hoon, wo thodi der mein aapse is chat par connect karenge.\n\nAgar immediate baat karni ho toh aap humein abhi direct call bhi kar sakte hain: +91 70797 37773.`,
      };
    } else {
      return {
        intent: 'agent_handover',
        reply: `Ji bilkul${nameSalutation}! Main hamare senior sales manager ko notify kar diya hai.\n\nAbhi office timing close ho chuki hai, isliye hamari sales team kal subah 10:00 AM aapse direct connect karegi. Agar aapko kal baat karni ho toh aap humein kal subah 10 baje ke baad direct call kar sakte hain: +91 70797 37773 par.\n\nTab tak aap apna 100% Free CRM account setup karke explore kar sakte hain (1,000 leads tak lifetime free, no credit card required):\n👉 https://realsalepro.com/register`,
      };
    }
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
      reply: `RealSalePro do simple plans offer karta hai:\n1. *Free Forever*: ₹0 (1,000 active leads aur 5 team users tak bilkul free, no credit card required).\n2. *Pro Plan*: ₹1,000/month (billed ₹12,000 annually) ya ₹1,500/month (monthly) — isme *UNLIMITED team members* aur 2,00,000 leads milte hain (per user koi charge nahi)!\n\nAap abhi free start kar sakte hain: https://realsalepro.com/register`,
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
 * Humanized Sales Advisor (Supports Built-in & Bring-Your-Own-AI Model for Tenants)
 * Acts 100% as Rahul from RealSalePro Sales Team. Zero robotic giveaways.
 */
export async function generateSalesAiReply({
  messageText,
  customerName,
  conversationHistory = [],
  conversationMetadata = {},
  learnedGuidance = '',
  recommendedProbe = '',
  tenantId = null,
}) {
  const config = await getWhatsAppConfig();
  let apiKey = config.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
  let endpoint = 'https://api.deepseek.com/v1/chat/completions';
  let model = config.aiModel || 'deepseek-chat';

  // If this conversation belongs to a tenant with custom AI model credentials, use tenant's model!
  if (tenantId) {
    const tRes = await query('SELECT settings FROM tenants WHERE id = $1', [tenantId]);
    const wa = tRes.rows[0]?.settings?.integrations?.whatsapp;
    if (wa?.aiApiKey) {
      apiKey = wa.aiApiKey;
      if (wa.aiProvider === 'openai') {
        endpoint = 'https://api.openai.com/v1/chat/completions';
        model = wa.aiCustomModel || 'gpt-4o-mini';
      } else if (wa.aiProvider === 'custom' && wa.aiCustomEndpoint) {
        endpoint = wa.aiCustomEndpoint;
        model = wa.aiCustomModel || 'custom-model';
      } else if (wa.aiCustomModel) {
        model = wa.aiCustomModel;
      }
    }
  }

  const text = String(messageText || '').trim().toLowerCase();

  // If user explicitly clicks or types a direct option (1, 2, 3, 4, 5)
  if (['1', '2', '3', '4', '5'].includes(text)) {
    return evaluateVisitorIntent(messageText, customerName);
  }

  // If AI is disabled or no API key is configured yet, fall back to rule engine
  if (!config.aiEnabled || !apiKey) {
    return evaluateVisitorIntent(messageText, customerName);
  }

  const statedName = conversationMetadata.stated_name;
  const isGeneric = (name) => !name || /^(hey|visitor|user|website visitor|mydigitalera)$/i.test(name.trim());
  const effectiveName = statedName || (!isGeneric(customerName) ? customerName.trim() : null);

  const systemPrompt = `You are Rahul, a senior real estate sales executive at RealSalePro (https://realsalepro.com) chatting with an inbound prospect on WhatsApp.

CRITICAL IDENTITY & HUMAN CONVERSATION RULES:
1. YOU ARE 100% HUMAN. You are Rahul from the RealSalePro sales team based in India.
2. NEVER mention or admit that you are an AI, bot, virtual assistant, algorithm, or automated response.
3. If asked "Are you a bot?", "AI ho kya?", "Are you real?", or "bot lag raha hai", reply naturally, warmly, and with human charm:
   - In Hindi: "Haha nahi sir, main RealSalePro sales team se Rahul baat kar raha hoon! Aap batayein demo kab schedule karein ya pricing mein koi specific doubt hai?"
   - In English: "Haha no, I'm Rahul from the RealSalePro sales team! How can I help you today?"
4. ZERO BOT CLICHÉS:
   - NEVER start with "Great question! 🚀", "Hello there!", "I would be happy to help with that!", "Here is a breakdown:", or "Hope this helps!".
   - NEVER send bulleted lists of emojis (e.g. 💰📱🛡️🏢🚀👉). Real human sales reps NEVER type bullet lists with emojis on WhatsApp.
   - At most 1 subtle emoji (like 🙏 or 👍) in the entire message.
5. STRICT TOKEN & MESSAGE LIMIT:
   - Keep responses strictly to 2 to 4 sentences (under 65 words).
   - Real WhatsApp messages are short, human, and conversational.
6. OFFICIAL CALLING & CONTACT NUMBER:
   - RealSalePro's official sales calling & phone number is: +91 70797 37773.
   - If the prospect asks for a phone number or wants to talk on call:
     * During office working hours (10:00 AM - 7:30 PM IST): Give them +91 70797 37773.
     * During night/off-hours: State that office hours are 10:00 AM to 7:30 PM, you will connect at 10 AM tomorrow, or they can call tomorrow after 10 AM at +91 70797 37773.
   - NEVER invent, hallucinate, or output dummy numbers (never output 9876543210, etc.).

ANTI-REPETITION & MEMORY RULES (CRITICAL):
1. NEVER REPEAT A QUESTION THAT WAS ALREADY ASKED OR ANSWERED!
   - Look at the PROSPECT PROFILE DOSSIER and conversation history below.
   - If the prospect already told you their Name, City, Company, Team Size, or Current CRM, NEVER ASK FOR IT AGAIN!
   - If they already told you their team size (e.g. 10+), DO NOT ask "Aapki team mein kitne members hain?".
   - If they already told you their company or city (e.g. RJ Builders, Patna), DO NOT ask "Aapka shubh naam aur company kis city mein hai?".
2. PROSPECT NAME USAGE:
   - If their real name is known (e.g., "${effectiveName || 'Aditya'}"), address them respectfully as "${effectiveName ? effectiveName + ' ji' : 'sir'}".
   - NEVER address them by their WhatsApp username/handle (e.g. NEVER call them "MyDigitalEra" or "MyDigitalEra ji").
3. ANSWER QUESTIONS DIRECTLY:
   - When the prospect asks about pricing ("pricing", "after that", "kitna lagega"), ANSWER THE PRICING DIRECTLY with exact numbers from the knowledge base below!
   - When the prospect says "i will go with paid plans", acknowledge that enthusiastically, share the Pro Plan details, and guide them to schedule a demo or call!

COMPLETE REALSALEPRO PRODUCT & PRICING KNOWLEDGE BASE:
1. PLANS & PRICING:
   - FREE FOREVER PLAN:
     * Price: ₹0 forever (zero cost, zero expiry, NO credit card required).
     * Leads: Up to 1,000 active leads.
     * Users: Up to 5 team member logins.
     * Features: Full deal pipeline, automated followups, WhatsApp fast-dial, basic staff phone masking.
     * Signup link: https://realsalepro.com/register
   - PRO PLAN (MOST POPULAR — BEST FOR GROWING TEAMS & 10+ MEMBERS):
     * UNLIMITED TEAM MEMBERS & ROLES! We DO NOT charge per user! A team of 10, 20, or 50 users pays the EXACT SAME flat monthly price!
     * Leads: Up to 2,00,000 active leads.
     * Pricing options:
       - Yearly billing: ₹1,000/month (billed ₹12,000 annually — Best Value, Save 33%).
       - 6 Months billing: ₹1,200/month (billed ₹7,200 semi-annually — Save 20%).
       - Monthly billing: ₹1,500/month (billed monthly).
     * Features included in Pro:
       - Advanced telecaller phone masking: Telecallers only see "98765 •••••", preventing staff and brokers from stealing your buyer database.
       - Meta Ads CAPI (Conversions API) & Portal Webhooks: Instant auto-sync for leads from Facebook/Instagram ads, Google, Magicbricks, 99acres, and Housing.com in under 5 seconds.
       - WhatsApp automated site visit passes, PDF booking receipts & deal pipeline.
       - Priority WhatsApp & email support.
     * Pricing link: https://realsalepro.com/pricing
   - CUSTOM / ENTERPRISE PLAN:
     * For large developer groups & multi-city broker networks.
     * Bring-Your-Own-Database (BYOD self-hosted on private AWS/PostgreSQL), custom ERP/SAP integrations, dedicated account manager, custom SLA.
   - PAYMENT MODES: UPI (Google Pay, PhonePe, Paytm), RuPay, Credit/Debit cards, Net Banking, and NEFT/RTGS invoice.

2. WHY REALSALEPRO VS SALESFORCE / HUBSPOT / ZOHO:
   - Salesforce/HubSpot charge $25 to $150 per user per month! A 10-person team pays ₹25,000 to ₹1,20,000 EVERY MONTH just for software licenses, plus lakhs in consultant fees.
   - Salesforce does NOT have Indian real estate integrations (no 99acres/Magicbricks sync), no telecaller phone masking to stop lead theft, and no WhatsApp site visit passes.
   - RealSalePro is built exclusively for Indian real estate builders and brokers:
     * Just ₹1,000/month flat for the ENTIRE team of 10+ users (Unlimited users on Pro Plan).
     * Instant 1-click sync for Meta Ads, 99acres, and Magicbricks leads.
     * Complete telecaller phone masking so staff cannot steal buyers' phone numbers.
     * Real-time unit-by-unit inventory tracking so units are never double-booked.

3. CORE SALES GOAL:
   - Encourage them to try the Free Forever account or book a live 10-minute demo.
   - Free account signup link: https://realsalepro.com/register
   - Pricing page link: https://realsalepro.com/pricing
   - Maximum 1 link per message.
   - Always refer to their business as a "company" or "real estate firm" (NEVER use "agency").
   - Match language: If user speaks Hindi/Hinglish, reply in natural, respectful Hinglish. If English, reply in Indian English.
   - Use single asterisks for bold (*like this*). NEVER use double asterisks (**like this**).`;

  try {
    // Complete Session Memory: take up to 100 recent messages of the ongoing conversation
    const historyMessages = conversationHistory.slice(-100).map((m) => ({
      role: m.sender_type === 'visitor' ? 'user' : 'assistant',
      content: m.body,
    }));

    // Build the dynamic Prospect Profile Dossier & Session Milestones
    const dossierItems = [];
    if (effectiveName) dossierItems.push(`- Prospect Real Name: ${effectiveName}`);
    if (conversationMetadata.company_name) dossierItems.push(`- Real Estate Company: ${conversationMetadata.company_name}`);
    if (conversationMetadata.city) dossierItems.push(`- City: ${conversationMetadata.city}`);
    if (conversationMetadata.team_size) dossierItems.push(`- Team Size: ${conversationMetadata.team_size} users/members`);
    if (conversationMetadata.current_tool) dossierItems.push(`- Current CRM/Tracking Tool: ${conversationMetadata.current_tool}`);
    if (conversationMetadata.plan_interest) dossierItems.push(`- Plan Preference: ${conversationMetadata.plan_interest}`);

    const topicsDiscussed = [];
    if (conversationMetadata.requested_demo) topicsDiscussed.push('Requested demo');
    if (conversationMetadata.discussed_pricing) topicsDiscussed.push('Pricing discussed');
    if (conversationMetadata.requested_call) topicsDiscussed.push('Asked for direct call/number');
    if (conversationMetadata.asked_if_bot) topicsDiscussed.push('Asked about AI/bot (confirmed Rahul is human)');
    if (topicsDiscussed.length > 0) {
      dossierItems.push(`- Key Topics Already Handled: ${topicsDiscussed.join(', ')}`);
    }

    let dossierPrompt = '';
    if (dossierItems.length > 0) {
      dossierPrompt = `\n\nPROSPECT PROFILE DOSSIER (PERMANENT SESSION MEMORY - NEVER ASK FOR THESE AGAIN!):\n${dossierItems.join('\n')}\n\n*CRITICAL*: Since you already know the above details from earlier in this session, NEVER ask for them again. Always call the prospect "${effectiveName ? effectiveName + ' ji' : 'sir'}" (NEVER by any WhatsApp handle like MyDigitalEra).`;
    }

    let dynamicSystemPrompt = systemPrompt + dossierPrompt;

    if (learnedGuidance) {
      dynamicSystemPrompt += `\n\n${learnedGuidance}`;
    }
    if (recommendedProbe && !conversationMetadata.team_size && !conversationMetadata.current_tool) {
      dynamicSystemPrompt += `\n\nADAPTIVE CONTEXTUAL QUALIFICATION PROBE:
If natural in the flow of conversation, ask this specific probing question to qualify the lead: "${recommendedProbe}"`;
    }

    // Time-of-Day Context & Off-hours intelligence
    const timeCtx = getIndiaTimeContext();
    const timeDirective = timeCtx.isWorkingHours
      ? `CURRENT TIME IN INDIA: ${timeCtx.displayTime} IST (OFFICE WORKING HOURS, 10:00 AM - 7:30 PM). If prospect asks for a call or phone number, let them know they can call right now at +91 70797 37773.`
      : `CURRENT TIME IN INDIA: ${timeCtx.displayTime} IST (NIGHT / NON-WORKING HOURS). Office hours are 10:00 AM to 7:30 PM IST.
CRITICAL OFF-HOURS CALLING RULE:
- It is currently NIGHT / OFF-HOURS in India.
- NEVER tell the prospect to call right now or say "main abhi call karta hoon / call me now".
- If they ask for your number or want a phone call, state politely: "Abhi office hours close ho chuke hain, main kal subah 10 baje aapse connect karta hoon. Agar aapko kal baat karni ho toh aap humein kal subah 10 AM ke baad +91 70797 37773 par direct call bhi kar sakte hain."
- Encourage them to try the free account tonight: https://realsalepro.com/register`;

    dynamicSystemPrompt += `\n\n${timeDirective}`;

    const messages = [
      { role: 'system', content: dynamicSystemPrompt },
      ...historyMessages,
      {
        role: 'user',
        content: messageText,
      },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12-second safeguard

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
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

    // Safety cleaner: Replace any hallucinated dummy phone numbers with the official number +91 70797 37773
    reply = reply
      .replace(/(?:\+?91[\s-]*)?98765[\s-]*43210/g, '+91 70797 37773')
      .replace(/(?:\+?91[\s-]*)?12345[\s-]*67890/g, '+91 70797 37773')
      .replace(/(?:\+?91[\s-]*)?987654321[0-9]/g, '+91 70797 37773');

    // Safety cleaner: If night time / off-hours, prevent telling prospect to call right now
    if (timeCtx.isNight) {
      reply = reply
        .replace(/abhi (?:aap )?call kar (?:sakte hain|lein|lo|lijiye)/gi, 'kal subah 10 baje call kar sakte hain')
        .replace(/abhi direct call (?:bhi )?kar (?:sakte hain|lein|lo|lijiye)/gi, 'kal subah 10 baje ke baad direct call kar sakte hain')
        .replace(/(?:main )?thodi der mein call karta hoon/gi, 'main kal subah 10 baje call karta hoon');
    }

    // Safety cleaner: Strip robotic bot openers if accidentally generated
    reply = reply
      .replace(/^great question!\s*🚀?/i, '')
      .replace(/^hello there!\s*🚀?/i, '')
      .trim();

    // Safety cleaner: If prospect's real name is known (e.g. "Aditya"), replace any accidental usage of WhatsApp handle "MyDigitalEra" with real name
    if (effectiveName) {
      reply = reply
        .replace(/\bMyDigitalEra\b/gi, effectiveName)
        .replace(/\bmydigitalera\b/gi, effectiveName);
    }

    return {
      intent: 'deepseek_ai_reply',
      reply,
    };
  } catch (err) {
    console.error('[Sales AI] Call failed, fallback to rule engine:', err.message);
    return evaluateVisitorIntent(messageText, customerName);
  }
}

// Backward compatibility alias
export const generateDeepSeekSalesReply = generateSalesAiReply;

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

          // Multi-Tenant Routing: Check if incoming phone_number_id matches any registered tenant
          const incomingPhoneNumberId = value.metadata?.phone_number_id;
          let matchedTenantId = null;
          let matchedTenant = null;

          if (incomingPhoneNumberId) {
            const tenantMatchRes = await query(`
              SELECT id, name, settings
              FROM tenants
              WHERE settings->'integrations'->'whatsapp'->>'phoneNumberId' = $1
              LIMIT 1
            `, [incomingPhoneNumberId]);

            if (tenantMatchRes.rows[0]) {
              matchedTenantId = tenantMatchRes.rows[0].id;
              matchedTenant = tenantMatchRes.rows[0];
            }
          }

          // Find or create conversation scoped to tenant (or platform if matchedTenantId is null)
          let convRes = await query(`
            SELECT * FROM whatsapp_conversations
            WHERE phone = $1 AND (($2::text IS NULL AND tenant_id IS NULL) OR tenant_id = $2)
            LIMIT 1
          `, [fromPhone, matchedTenantId]);

          let conversation;
          if (convRes.rows[0]) {
            conversation = convRes.rows[0];
            const updatedCustomerName = (customerName && customerName !== 'Website Visitor')
              ? customerName
              : (conversation.customer_name || 'Website Visitor');

            const updRes = await query(`
              UPDATE whatsapp_conversations
              SET customer_name = $1,
                  last_message = $2,
                  last_message_at = CURRENT_TIMESTAMP,
                  unread_count = unread_count + 1,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = $3
              RETURNING *
            `, [updatedCustomerName, messageText, conversation.id]);
            conversation = updRes.rows[0];
          } else {
            const insRes = await query(`
              INSERT INTO whatsapp_conversations (tenant_id, phone, customer_name, last_message, last_message_at, unread_count, updated_at)
              VALUES ($1, $2, COALESCE($3, 'Website Visitor'), $4, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP)
              RETURNING *
            `, [matchedTenantId, fromPhone, customerName, messageText]);
            conversation = insRes.rows[0];
          }

          // Save message to history
          await query(`
            INSERT INTO whatsapp_messages (
              conversation_id, direction, sender_type, sender_name, message_type, body, meta_message_id, status, raw_payload
            ) VALUES ($1, 'inbound', 'visitor', $2, $3, $4, $5, 'delivered', $6)
          `, [conversation.id, conversation.customer_name || 'Prospect', messageType, messageText, metaMessageId, JSON.stringify(msg)]);

          // If tenant matched, automatically capture lead into tenant's CRM pipeline if not already present
          if (matchedTenantId) {
            try {
              const last10Digits = fromPhone.slice(-10);
              const leadCheckRes = await query(`
                SELECT id, lead_id FROM leads
                WHERE tenant_id = $1 AND (mobile = $2 OR mobile = $3 OR mobile LIKE $4)
                LIMIT 1
              `, [matchedTenantId, fromPhone, last10Digits, `%${last10Digits}`]);

              if (!leadCheckRes.rows[0]) {
                const leadCode = `WA-${Date.now().toString().slice(-6)}`;
                await query(`
                  INSERT INTO leads
                    (tenant_id, lead_id, customer_name, mobile, lead_source, lead_status, lead_score, lead_date, metadata)
                  VALUES ($1, $2, $3, $4, 'WhatsApp', 'New', 'Warm', CURRENT_DATE::text, $5::jsonb)
                `, [
                  matchedTenantId,
                  leadCode,
                  conversation.customer_name || 'WhatsApp Inquiry',
                  last10Digits,
                  JSON.stringify({ whatsapp_conversation_id: conversation.id, captured_via: 'meta_cloud_whatsapp' })
                ]);
                console.log(`[WhatsApp Lead Auto-Capture] Created new CRM lead for tenant ${matchedTenantId}: ${last10Digits}`);
              }
            } catch (leadSyncErr) {
              console.warn('[WhatsApp Lead Auto-Capture] Error syncing lead:', leadSyncErr.message);
            }
          }

          // Extract & persist lead details (Name, City, Company) from message text for sales follow-up
          await extractAndSaveLeadDetails({ conversation, messageText });

          // Reload updated conversation (with newly extracted name/city/company)
          const refreshedConvRes = await query('SELECT * FROM whatsapp_conversations WHERE id = $1', [conversation.id]);
          if (refreshedConvRes.rows[0]) {
            conversation = refreshedConvRes.rows[0];
          }

          // Evaluate Visitor Intent & Generate Response (DeepSeek AI or Handover)
          const config = await getWhatsAppConfig();

          const statedName = conversation.metadata?.stated_name;
          const effectiveName = statedName || ((conversation.customer_name && !['website visitor', 'hey', 'visitor', 'user', 'mydigitalera'].includes(conversation.customer_name.toLowerCase().trim()))
            ? conversation.customer_name
            : null);

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

          // Fetch full session conversation history for DeepSeek context (last 100 messages for complete session memory)
          const historyRes = await query(`
            SELECT sender_type, body FROM whatsapp_messages
            WHERE conversation_id = $1
            ORDER BY created_at DESC
            LIMIT 100
          `, [conversation.id]);
          const history = (historyRes.rows || []).reverse();

          // 1. Run Real-time Lead Authenticity & Threat Scoring
          const leadAnalysis = await analyzeLeadAuthenticity({
            messageText,
            conversation,
            conversationHistory: history,
          });

          // Persist updated intelligence metrics into conversation metadata
          const currentMeta = conversation.metadata || {};
          const updatedMeta = {
            ...currentMeta,
            authenticity_score: leadAnalysis.authenticityScore,
            lead_classification: leadAnalysis.category,
            threat_level: leadAnalysis.threatLevel,
            token_shield_active: leadAnalysis.tokenShieldActive,
            evasive_count: leadAnalysis.evasiveCount,
            last_analyzed_at: new Date().toISOString(),
          };

          await query(`
            UPDATE whatsapp_conversations
            SET metadata = $1::jsonb, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [JSON.stringify(updatedMeta), conversation.id]);
          conversation.metadata = updatedMeta;

          // 2. Token Shield Circuit Breaker: If visitor is suspicious/competitor/spammer, send gatekeeper reply and SAVE LLM TOKENS!
          if (leadAnalysis.tokenShieldActive && leadAnalysis.gatekeeperResponse) {
            console.log(`🛡️ [Token Shield] Active for ${conversation.phone} (Score: ${leadAnalysis.authenticityScore}, Category: ${leadAnalysis.category}). Bypassing LLM.`);
            if (config.botEnabled) {
              await sendBotReply(conversation, leadAnalysis.gatekeeperResponse);
            }
            continue;
          }

          // 3. Fetch learned continuous patterns for dynamic prompt ingestion
          const learnedGuidance = await getLearnedGuidanceForPrompt();

          // 4. Generate dynamic response via Sales AI (with rule engine fallback & BYO-AI model support)
          const { reply } = await generateSalesAiReply({
            messageText,
            customerName: effectiveName,
            conversationHistory: history,
            conversationMetadata: conversation.metadata || {},
            learnedGuidance,
            recommendedProbe: leadAnalysis.recommendedProbe,
            tenantId: conversation.tenant_id || null,
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

  // Dispatch outbound message via Meta Cloud API using tenant or platform credentials
  const metaRes = await sendMetaOutboundMessage({
    toPhone: conversation.phone,
    text,
    tenantId: conversation.tenant_id || null,
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
 * List Conversations with filters, tenant scoping, and unread counts
 */
export async function listConversations({ status = 'all', search = '', limit = 50, offset = 0, tenantId = null } = {}) {
  await initWhatsAppSchema();

  let sql = 'SELECT * FROM whatsapp_conversations WHERE 1=1';
  const params = [];
  let summaryWhere = 'WHERE 1=1';
  const summaryParams = [];

  if (tenantId === 'platform') {
    sql += ' AND tenant_id IS NULL';
    summaryWhere += ' AND tenant_id IS NULL';
  } else if (tenantId && tenantId !== 'all') {
    params.push(tenantId);
    sql += ` AND tenant_id = $${params.length}`;
    summaryParams.push(tenantId);
    summaryWhere += ` AND tenant_id = $${summaryParams.length}`;
  }

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

  // Summary counts scoped to same tenant filter
  const countRes = await query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'agent_requested') AS agent_requested_count,
      COUNT(*) FILTER (WHERE status = 'bot_active') AS bot_active_count,
      COUNT(*) FILTER (WHERE status = 'agent_chatting') AS agent_chatting_count,
      COALESCE(SUM(unread_count), 0) AS total_unread
    FROM whatsapp_conversations
    ${summaryWhere}
  `, summaryParams);

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

