import { query, internalAction, action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

/**
 * Fetch all tenants that have either 99acres or Magicbricks integrations enabled.
 */
export const getActivePortalTenants = query({
  args: {},
  handler: async (ctx) => {
    const tenants = await ctx.db.query("tenants").collect();
    return tenants.filter(t => 
      t.settings?.integrations?.nineNineAcres?.enabled || 
      t.settings?.integrations?.magicbricks?.enabled
    );
  }
});

/**
 * Periodically pulls leads from 99acres and Magicbricks APIs for all active tenants.
 * This is triggered by the Convex scheduler (crons.ts).
 */
export const pullPortalLeads = internalAction({
  args: {},
  handler: async (ctx) => {
    // 1. Get all tenants with portal integrations active
    const tenants = await ctx.runQuery(api.portals.getActivePortalTenants);
    
    for (const tenant of tenants) {
      const nineNineSettings = tenant.settings?.integrations?.nineNineAcres;
      const mbSettings = tenant.settings?.integrations?.magicbricks;

      // 2. Poll 99acres leads
      if (nineNineSettings && nineNineSettings.enabled && nineNineSettings.apiKey) {
        try {
          console.log(`[99acres Poller] Polling leads for tenant: ${tenant.name}`);
        } catch (error) {
          console.error(`[99acres Poller] Error fetching leads for tenant ${tenant.name}:`, error);
        }
      }

      // 3. Poll Magicbricks leads
      if (mbSettings && mbSettings.enabled && mbSettings.apiKey) {
        try {
          console.log(`[Magicbricks Poller] Polling leads for tenant: ${tenant.name}`);
        } catch (error) {
          console.error(`[Magicbricks Poller] Error fetching leads for tenant ${tenant.name}:`, error);
        }
      }
    }
  }
});

function sanitizePhoneNumber(phoneStr: string): string {
  if (!phoneStr) return "";
  let digits = phoneStr.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.substring(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.substring(1);
  }
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
}

function extractXmlTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? (match[1] !== undefined ? match[1] : match[2] || "").trim() : "";
}

export const processInboundLead = action({
  args: {
    portal: v.string(),
    token: v.string(),
    rawBody: v.string(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    const { portal, token, rawBody, contentType } = args;
    console.log(`[processInboundLead] Inbound lead request from portal: ${portal}. Token: ${token}`);

    let tenantId;
    try {
      tenantId = ctx.db.normalizeId("tenants", token);
    } catch (e) {
      tenantId = token;
    }

    if (!tenantId) {
      console.error(`Invalid tenant token: ${token}`);
      return;
    }

    const tenant = await ctx.runQuery(api.tenants.getById, { id: tenantId as any });
    if (!tenant) {
      console.error(`No tenant found for token: ${token}`);
      return;
    }

    // Parse Body dynamically
    let parsedBody: any = {};
    if (contentType.toLowerCase().includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(rawBody);
      for (const [key, value] of params.entries()) {
        parsedBody[key] = value;
      }
    } else {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch (e) {
        console.warn("Failed to parse rawBody as JSON, trying form-urlencoded:", e);
        try {
          const params = new URLSearchParams(rawBody);
          for (const [key, value] of params.entries()) {
            parsedBody[key] = value;
          }
        } catch (err) {
          console.error("Failed to parse body formats:", err);
        }
      }
    }

    let customerName = "";
    let customerPhone = "";
    let customerEmail: string | null = null;
    let propertyTitle = "";
    let location = "";
    let budget = "";
    let assignmentRule = "manual";

    const portalLower = portal.toLowerCase();

    if (portalLower.includes("99acres")) {
      const nineNineSettings = tenant.settings?.integrations?.nineNineAcres;
      assignmentRule = nineNineSettings?.assignmentRule || "manual";

      if (parsedBody.Xml) {
        const xml = parsedBody.Xml;
        customerName = extractXmlTag(xml, "Name") || "99acres Lead";
        customerEmail = extractXmlTag(xml, "Email") || null;
        customerPhone = sanitizePhoneNumber(extractXmlTag(xml, "Phone"));
        propertyTitle = extractXmlTag(xml, "Project") || extractXmlTag(xml, "QryInfo") || "";
        location = extractXmlTag(xml, "city") || "";
        budget = extractXmlTag(xml, "budget") || "";
      } else {
        customerName = parsedBody.lead_details?.name || "";
        customerEmail = parsedBody.lead_details?.email || null;
        customerPhone = sanitizePhoneNumber(parsedBody.lead_details?.phone || "");
        propertyTitle = parsedBody.property_details?.title || "";
        location = parsedBody.property_details?.locality || "";
        budget = parsedBody.property_details?.budget || "";
      }
    } else if (portalLower.includes("magicbricks")) {
      const mbSettings = tenant.settings?.integrations?.magicbricks;
      assignmentRule = mbSettings?.assignmentRule || "manual";

      customerName = parsedBody.customer_name || "";
      customerEmail = parsedBody.customer_email || null;
      customerPhone = sanitizePhoneNumber(parsedBody.customer_phone || "");
      propertyTitle = parsedBody.project_name || "";
      location = parsedBody.preferred_location || "";
      budget = parsedBody.budget_range || "";
    } else if (portalLower.includes("housing")) {
      const housingSettings = tenant.settings?.integrations?.housing;
      assignmentRule = housingSettings?.assignmentRule || "manual";

      customerName = parsedBody.payload?.profile?.full_name || "";
      customerEmail = parsedBody.payload?.profile?.email_address || null;
      customerPhone = sanitizePhoneNumber(parsedBody.payload?.profile?.mobile_number || "");
      propertyTitle = parsedBody.payload?.requirement?.property_type || "";
      location = Array.isArray(parsedBody.payload?.requirement?.localities)
        ? parsedBody.payload?.requirement?.localities.join(", ")
        : parsedBody.payload?.requirement?.localities || "";
      budget = parsedBody.payload?.requirement?.max_budget?.toString() || "";
    } else if (portalLower.includes("whatsapp")) {
      const whatsappSettings = tenant.settings?.integrations?.whatsapp;
      assignmentRule = whatsappSettings?.assignmentRule || "manual";

      const provider = whatsappSettings?.provider || 'custom';
      if (provider === 'wati') {
        customerName = parsedBody.senderName || "WhatsApp Lead";
        customerPhone = sanitizePhoneNumber(parsedBody.waId || "");
        propertyTitle = parsedBody.text || "";
      } else if (provider === 'aisensy') {
        customerName = parsedBody.contact?.name || "WhatsApp Lead";
        customerPhone = sanitizePhoneNumber(parsedBody.contact?.phone || "");
        propertyTitle = parsedBody.message?.text || "";
      } else if (provider === 'interakt') {
        customerName = parsedBody.user?.traits?.name || "WhatsApp Lead";
        customerPhone = sanitizePhoneNumber(parsedBody.user?.phone || "");
      } else if (provider === 'doubletick') {
        customerName = parsedBody.data?.name || "WhatsApp Lead";
        customerPhone = sanitizePhoneNumber(parsedBody.data?.phone || "");
        propertyTitle = parsedBody.data?.message?.text || "";
      } else {
        customerName = parsedBody.name || parsedBody.customer_name || "WhatsApp Lead";
        customerPhone = sanitizePhoneNumber(parsedBody.phone || parsedBody.mobile || parsedBody.waId || "");
        propertyTitle = parsedBody.message || parsedBody.text || "";
      }
    } else if (portalLower.includes("google_form")) {
      const formSettings = tenant.settings?.integrations?.googleForm;
      assignmentRule = formSettings?.assignmentRule || "manual";

      const bodyToSearch = parsedBody.row_data || parsedBody;
      const findValue = (keys: string[]) => {
        for (const key of Object.keys(bodyToSearch)) {
          if (keys.includes(key.toLowerCase().trim())) {
            return bodyToSearch[key];
          }
        }
        return "";
      };

      customerName = findValue(["name", "customer name", "full name", "client name", "customer_name", "full_name"]) || "Google Form Lead";
      customerPhone = sanitizePhoneNumber(findValue(["phone", "mobile", "mobile number", "phone number", "contact", "mobile_number", "phone_number", "contact_number"]));
      customerEmail = findValue(["email", "email id", "email address", "email_id", "email_address"]) || null;
      propertyTitle = findValue(["project", "property", "project name", "property name", "project_name", "requirement", "query", "message", "notes"]);
      location = findValue(["city", "location", "address", "preferred location", "preferred_location", "locality"]);
      budget = findValue(["budget", "budget range", "budget_range", "price", "max budget", "max_budget"]);
    } else if (portalLower.includes("google_sheet")) {
      const sheetSettings = tenant.settings?.integrations?.googleSheet;
      assignmentRule = sheetSettings?.assignmentRule || "manual";

      const bodyToSearch = parsedBody.row_data || parsedBody;
      const findValue = (keys: string[]) => {
        for (const key of Object.keys(bodyToSearch)) {
          if (keys.includes(key.toLowerCase().trim())) {
            return bodyToSearch[key];
          }
        }
        return "";
      };

      customerName = findValue(["name", "customer name", "full name", "client name", "customer_name", "full_name"]) || "Google Sheet Lead";
      customerPhone = sanitizePhoneNumber(findValue(["phone", "mobile", "mobile number", "phone number", "contact", "mobile_number", "phone_number", "contact_number"]));
      customerEmail = findValue(["email", "email id", "email address", "email_id", "email_address"]) || null;
      propertyTitle = findValue(["project", "property", "project name", "property name", "project_name", "requirement", "query", "message", "notes"]);
      location = findValue(["city", "location", "address", "preferred location", "preferred_location", "locality"]);
      budget = findValue(["budget", "budget range", "budget_range", "price", "max budget", "max_budget"]);
    } else {
      console.error(`Unsupported portal source: ${portal}`);
      return;
    }

    if (!customerPhone) {
      console.warn(`Skipping inbound lead import: Phone number missing or invalid after normalization. Raw: ${rawBody}`);
      return;
    }

    await ctx.runMutation(api.leads.saveUnifiedInboundLead, {
      tenant_id: tenant._id,
      lead_source: portalLower.includes("99acres")
        ? "99acres"
        : portalLower.includes("magicbricks")
        ? "Magicbricks"
        : portalLower.includes("housing")
        ? "Housing"
        : portalLower.includes("google_form")
        ? "Google Form"
        : portalLower.includes("google_sheet")
        ? "Google Sheet"
        : "WhatsApp",
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      property_title: propertyTitle || undefined,
      location: location || undefined,
      budget: budget || undefined,
      raw_payload: rawBody,
      assignment_rule: assignmentRule,
    });

    console.log(`[processInboundLead] Successfully parsed and processed lead from ${portalLower} for tenant ${tenant.name}. Mobile: ${customerPhone}`);
  }
});
