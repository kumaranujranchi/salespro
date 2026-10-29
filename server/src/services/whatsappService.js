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
 * Automatically trigger WhatsApp Welcome message to a new CRM lead
 */
export async function sendLeadWelcomeWhatsApp({ tenantId, lead }) {
  try {
    if (!tenantId || !lead || !lead.mobile) return null;

    // Fetch tenant settings
    const tenantRes = await query('SELECT id, name, settings FROM tenants WHERE id = $1', [tenantId]);
    if (tenantRes.rows.length === 0) return null;

    const tenant = tenantRes.rows[0];
    const settings = tenant.settings || {};
    const whatsapp = settings.integrations?.whatsapp;

    if (!whatsapp || !whatsapp.enabled || !whatsapp.autoWelcomeEnabled) {
      return null; // Not enabled or auto-welcome is toggled off
    }

    const provider = whatsapp.provider || 'meta_cloud';
    const customerName = lead.customer_name || 'Valued Customer';
    const companyName = whatsapp.companyDisplayName || tenant.name || 'Our Team';
    const projectName = lead.project_name || lead.city || 'our residential project';
    const repName = whatsapp.representativeName || 'Our Property Specialist';
    const brochureUrl = whatsapp.brochureUrl || 'https://realsalepro.in';

    // Default parameters for standard welcome template
    const bodyParams = [
      customerName,   // {{1}}
      companyName,    // {{2}}
      projectName,    // {{3}}
      repName,        // {{4}}
      brochureUrl,    // {{5}}
    ];

    const fallbackText =
`Namaste *${customerName}*!
Thank you for your interest in *${projectName}* by *${companyName}*.

Our property consultant (*${repName}*) will call you shortly to assist with project details, floor plans, and site visit arrangements.

Meanwhile, explore the brochure & price sheet here:
${brochureUrl}

Warm regards,
*${companyName}*`;

    if (provider === 'meta_cloud') {
      if (!whatsapp.phoneNumberId || !whatsapp.accessToken) {
        console.warn(`[WhatsApp Auto-Welcome] Skipped for tenant ${tenantId}: Missing phoneNumberId or accessToken.`);
        return null;
      }

      const templateName = whatsapp.welcomeTemplateName || 'realsalepro_lead_welcome';

      try {
        const result = await sendMetaCloudMessage({
          phoneNumberId: whatsapp.phoneNumberId,
          accessToken: whatsapp.accessToken,
          toPhone: lead.mobile,
          templateName,
          languageCode: whatsapp.templateLanguage || 'en',
          bodyParams,
          fallbackText,
        });

        console.log(`[WhatsApp Auto-Welcome] Sent successfully to ${lead.mobile} (Lead ID: ${lead.lead_id || lead.id}):`, result.messageId);
        return result;
      } catch (templateErr) {
        console.warn(`[WhatsApp Auto-Welcome] Template failed (${templateErr.message}). Attempting session text fallback...`);
        // If template fails, attempt direct text message
        return await sendMetaCloudMessage({
          phoneNumberId: whatsapp.phoneNumberId,
          accessToken: whatsapp.accessToken,
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
    console.error(`[WhatsApp Auto-Welcome Error] Tenant: ${tenantId}, Lead: ${lead?.mobile}:`, err.message);
    return { error: err.message };
  }
}
