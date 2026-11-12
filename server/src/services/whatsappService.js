import { query } from '../db/index.js';

/**
 * Normalizes phone numbers for WhatsApp API (E.164 without plus)
 * Example: '98765 43210' -> '919876543210'
 */
export function normalizeWhatsAppPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  // 10 digits Indian mobile
  if (digits.length === 10) {
    return `91${digits}`;
  }
  // 11 digits starting with 0
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  // Already has 91 country code (12 digits)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

/**
 * Send WhatsApp Message via Meta Cloud API
 */
export async function sendMetaCloudMessage({
  phoneNumberId,
  accessToken,
  toPhone,
  templateName,
  languageCode = 'en',
  bodyParams = [],
  fallbackText = null,
}) {
  if (!phoneNumberId || !accessToken || !toPhone) {
    throw new Error('Missing phoneNumberId, accessToken, or recipient toPhone for Meta Cloud API');
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
        language: { code: languageCode || 'en' },
        components: bodyParams && bodyParams.length > 0 ? [
          {
            type: 'body',
            parameters: bodyParams.map(param => ({
              type: 'text',
              text: String(param || ''),
            })),
          },
        ] : undefined,
      },
    };
  } else if (fallbackText) {
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedTo,
      type: 'text',
      text: { preview_url: true, body: fallbackText },
    };
  } else {
    throw new Error('Either templateName or fallbackText is required to send WhatsApp message');
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
    const errorMsg = data.error?.message || `Meta API HTTP ${res.status}`;
    const errorDetails = data.error?.error_data?.details || '';
    throw new Error(`${errorMsg} ${errorDetails ? `(${errorDetails})` : ''}`.trim());
  }

  return {
    success: true,
    messageId: data.messages?.[0]?.id,
    data,
  };
}

/**
 * Send WhatsApp Message via WATI BSP
 */
export async function sendWatiMessage({ endpoint, apiKey, toPhone, templateName, parameters }) {
  if (!endpoint || !apiKey || !toPhone) {
    throw new Error('Missing endpoint, apiKey, or toPhone for WATI');
  }
  const normalizedTo = normalizeWhatsAppPhone(toPhone);
  const cleanEndpoint = endpoint.replace(/\/$/, '');
  const url = `${cleanEndpoint}/api/v1/sendTemplateMessage?whatsappNumber=${normalizedTo}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      template_name: templateName,
      broadcast_name: 'Lead Welcome Greeting',
      parameters: parameters || [],
    }),
  });

  const data = await res.json();
  if (!res.ok || data.result === false) {
    throw new Error(data.message || data.info || `WATI HTTP ${res.status}`);
  }

  return { success: true, data };
}

/**
 * Automatically trigger WhatsApp Welcome confirmation message to a new digitally generated CRM lead.
 * STRICT POLICY: Applies ONLY to digital leads (Meta Ads, Google Ads, digital webhooks).
 * Manual leads entered by CRM users are strictly excluded.
 */
export async function sendLeadWelcomeWhatsApp({ tenantId, lead }) {
  try {
    if (!tenantId || !lead || !lead.mobile) return null;

    // Strict Rule: Manual leads entered by CRM staff/users must NEVER trigger automated WhatsApp confirmation
    if (lead.is_manual === true || lead.isManual === true || lead.source_type === 'manual') {
      console.log(`[WhatsApp Auto-Confirmation] Skipped for lead ${lead.lead_id || lead.id}: Manual lead excluded.`);
      return null;
    }

    // Fetch tenant settings
    const tenantRes = await query('SELECT id, name, settings FROM tenants WHERE id = $1', [tenantId]);
    if (tenantRes.rows.length === 0) return null;

    const tenant = tenantRes.rows[0];
    const settings = tenant.settings || {};
    const whatsapp = settings.integrations?.whatsapp;

    if (!whatsapp || !whatsapp.enabled || !whatsapp.autoWelcomeEnabled) {
      return null; // Not enabled or auto-welcome is toggled off
    }

    // Channel filtering: Verify digital channel toggle
    const source = String(lead.lead_source || lead.source || '').toLowerCase();
    const isMeta = source.includes('meta') || source.includes('facebook') || source.includes('instagram');
    const isGoogle = source.includes('google');
    const isWebsite = source.includes('website') || source.includes('form') || source.includes('webhook');

    if (isMeta && whatsapp.autoConfirmMetaAds === false) {
      console.log(`[WhatsApp Auto-Confirmation] Skipped for lead ${lead.lead_id || lead.id}: Meta Ads confirmation toggled off.`);
      return null;
    }
    if (isGoogle && whatsapp.autoConfirmGoogleAds === false) {
      console.log(`[WhatsApp Auto-Confirmation] Skipped for lead ${lead.lead_id || lead.id}: Google Ads confirmation toggled off.`);
      return null;
    }
    if (isWebsite && whatsapp.autoConfirmWebsiteForms === false) {
      console.log(`[WhatsApp Auto-Confirmation] Skipped for lead ${lead.lead_id || lead.id}: Website form confirmation toggled off.`);
      return null;
    }

    const provider = whatsapp.provider || 'meta_cloud';
    const customerName = lead.customer_name || 'Valued Customer';
    const companyName = whatsapp.companyDisplayName || tenant.name || 'Our Team';
    const projectName = lead.project_name || lead.city || 'our residential project';
    const repName = whatsapp.representativeName || 'Our Property Specialist';
    const brochureUrl = whatsapp.brochureUrl || 'https://realsalepro.com';

    // Default parameters for standard welcome template
    const bodyParams = [
      customerName,   // {{1}}
      companyName,    // {{2}}
      projectName,    // {{3}}
      repName,        // {{4}}
      brochureUrl,    // {{5}}
    ];

    // Compute dynamic message text replacing variables
    let messageText = whatsapp.customMessageBody || '';
    if (messageText) {
      messageText = messageText
        .replace(/\{customer_name\}/gi, customerName)
        .replace(/\{company_name\}/gi, companyName)
        .replace(/\{project_name\}/gi, projectName)
        .replace(/\{sales_rep\}/gi, repName)
        .replace(/\{representative_name\}/gi, repName)
        .replace(/\{brochure_url\}/gi, brochureUrl)
        .replace(/\{lead_source\}/gi, lead.lead_source || 'Digital Ads');
    }

    const fallbackText = messageText ||
`Namaste *${customerName}*!
Thank you for your interest in *${projectName}* by *${companyName}*.

Our property consultant (*${repName}*) will call you shortly to assist with project details, floor plans, and site visit arrangements.

Meanwhile, explore the brochure & price sheet here:
${brochureUrl}

Warm regards,
*${companyName}*`;

    if (provider === 'meta_cloud') {
      let phoneNumberId = whatsapp.phoneNumberId;
      let accessToken = whatsapp.accessToken;

      // Fallback to platform credentials if not configured on tenant level
      if (!phoneNumberId || !accessToken) {
        const { getWhatsAppConfig } = await import('./whatsappHubService.js');
        const config = await getWhatsAppConfig();
        phoneNumberId = config.phoneNumberId;
        accessToken = config.accessToken;
      }

      if (!phoneNumberId || !accessToken) {
        console.warn(`[WhatsApp Auto-Confirmation] Skipped for tenant ${tenantId}: Missing Phone Number ID or Access Token.`);
        return null;
      }

      const templateName = whatsapp.welcomeTemplateName || 'realsalepro_lead_welcome';

      try {
        const result = await sendMetaCloudMessage({
          phoneNumberId,
          accessToken,
          toPhone: lead.mobile,
          templateName,
          languageCode: whatsapp.templateLanguage || 'en',
          bodyParams,
          fallbackText,
        });

        console.log(`[WhatsApp Auto-Confirmation] Sent successfully to ${lead.mobile} (Lead ID: ${lead.lead_id || lead.id}):`, result.messageId);
        return result;
      } catch (templateErr) {
        console.warn(`[WhatsApp Auto-Confirmation] Template failed (${templateErr.message}). Attempting session text fallback...`);
        return await sendMetaCloudMessage({
          phoneNumberId,
          accessToken,
          toPhone: lead.mobile,
          fallbackText,
        });
      }
    } else if (provider === 'wati') {
      return await sendWatiMessage({
        endpoint: whatsapp.bspEndpoint,
        apiKey: whatsapp.bspApiKey,
        toPhone: lead.mobile,
        templateName: whatsapp.welcomeTemplateName || 'lead_welcome_ack',
        parameters: bodyParams.map((val, idx) => ({ name: String(idx + 1), value: String(val) })),
      });
    }

    return null;
  } catch (err) {
    console.error(`[WhatsApp Auto-Confirmation Error] Tenant: ${tenantId}, Lead: ${lead?.mobile}:`, err.message);
    return { error: err.message };
  }
}

/**
 * Send a Live Test Confirmation to a target phone number with sample lead data
 */
export async function testLeadConfirmationWhatsApp({ tenantId, toPhone, templateName, customMessage, languageCode = 'en' }) {
  if (!toPhone) throw new Error('Phone number is required for test send');

  const tenantRes = await query('SELECT id, name, settings FROM tenants WHERE id = $1', [tenantId]);
  const tenant = tenantRes.rows[0] || {};
  const settings = tenant.settings || {};
  const whatsapp = settings.integrations?.whatsapp || {};

  let phoneNumberId = whatsapp.phoneNumberId;
  let accessToken = whatsapp.accessToken;

  if (!phoneNumberId || !accessToken) {
    const { getWhatsAppConfig } = await import('./whatsappHubService.js');
    const config = await getWhatsAppConfig();
    phoneNumberId = config.phoneNumberId;
    accessToken = config.accessToken;
  }

  if (!phoneNumberId || !accessToken) {
    throw new Error('Meta WhatsApp Cloud API is not configured. Missing Phone Number ID or Access Token.');
  }

  const customerName = 'Rahul Sharma (Test Lead)';
  const companyName = whatsapp.companyDisplayName || tenant.name || 'RealSalePro Realty';
  const projectName = 'Emerald Sky Greens';
  const repName = whatsapp.representativeName || 'Pooja Verma';
  const brochureUrl = whatsapp.brochureUrl || 'https://realsalepro.com';

  const bodyParams = [customerName, companyName, projectName, repName, brochureUrl];

  let textToSend = customMessage || whatsapp.customMessageBody ||
`Namaste *${customerName}*!
Thank you for your interest in *${projectName}* by *${companyName}*.

Our property consultant (*${repName}*) will call you shortly to assist with project details, floor plans, and site visit arrangements.

Brochure Link: ${brochureUrl}
[TEST CONFIRMATION MESSAGE]`;

  textToSend = textToSend
    .replace(/\{customer_name\}/gi, customerName)
    .replace(/\{company_name\}/gi, companyName)
    .replace(/\{project_name\}/gi, projectName)
    .replace(/\{sales_rep\}/gi, repName)
    .replace(/\{representative_name\}/gi, repName)
    .replace(/\{brochure_url\}/gi, brochureUrl);

  const tpl = templateName || whatsapp.welcomeTemplateName;

  return await sendMetaCloudMessage({
    phoneNumberId,
    accessToken,
    toPhone,
    templateName: tpl,
    languageCode,
    bodyParams,
    fallbackText: textToSend,
  });
}
