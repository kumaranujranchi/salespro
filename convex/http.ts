import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/meta-webhook",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // The platform verify token is realsalepro_meta_verify
    const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "realsalepro_meta_verify";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Meta Webhook verified successfully!");
      return new Response(challenge || "", {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    } else {
      console.error("Meta Webhook verification failed. Received token:", token);
      return new Response("Forbidden", { status: 403 });
    }
  }),
});

http.route({
  path: "/meta-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      console.log("Received Meta Webhook POST payload:", JSON.stringify(body));

      // Check if this is a leadgen event
      if (body.object === "page" && body.entry) {
        for (const entry of body.entry) {
          const pageId = entry.id;
          
          if (!entry.changes) continue;
          for (const change of entry.changes) {
            if (change.field === "leadgen" && change.value) {
              const leadgenId = change.value.leadgen_id;
              
              if (!leadgenId) continue;

              // Find tenant matching this Meta pageId
              const tenant = await ctx.runQuery(api.tenants.getByMetaPageId, { pageId });
              
              if (!tenant) {
                console.warn(`No tenant found matching Meta Page ID: ${pageId}`);
                continue;
              }

              const metaSettings = tenant.settings?.integrations?.meta;
              if (!metaSettings || !metaSettings.enabled || !metaSettings.accessToken) {
                console.warn(`Meta integration is not fully configured or enabled for tenant: ${tenant.name}`);
                continue;
              }

              // Fetch lead details from Meta Graph API
              const fbUrl = `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${metaSettings.accessToken}`;
              const fbResponse = await fetch(fbUrl);
              
              if (!fbResponse.ok) {
                const errText = await fbResponse.text();
                console.error(`Failed to fetch lead details from Facebook for ID ${leadgenId}:`, errText);
                continue;
              }

              const fbLead = await fbResponse.json();
              console.log("Fetched FB Lead data:", JSON.stringify(fbLead));

              // Map form field data
              const fields: Record<string, string> = {};
              if (fbLead.field_data) {
                for (const field of fbLead.field_data) {
                  if (field.name && field.values && field.values.length > 0) {
                    fields[field.name.toLowerCase()] = field.values[0];
                  }
                }
              }

              // Extract values dynamically checking common field names
              const customerName = fields["full_name"] || 
                                   (fields["first_name"] && fields["last_name"] ? `${fields["first_name"]} ${fields["last_name"]}` : "") || 
                                   fields["name"] || 
                                   "Meta Lead";

              const mobile = fields["phone_number"] || 
                             fields["phone"] || 
                             fields["mobile"] || 
                             fields["contact"] || 
                             "";

              const email = fields["email"] || "";
              const city = fields["city"] || fields["location"] || "";
              const budgetRange = fields["budget"] || fields["budget_range"] || "";

              if (!mobile) {
                console.warn(`Skipping lead import: Mobile number not found in lead fields for ID ${leadgenId}`);
                continue;
              }

              // Process lead via Convex mutation
              await ctx.runMutation(api.leads.processWebhookLead, {
                tenant_id: tenant._id,
                customer_name: customerName,
                mobile,
                email: email || undefined,
                city: city || undefined,
                budget_range: budgetRange || undefined,
                assignment_rule: metaSettings.assignmentRule || "manual",
                lead_source: "Meta",
              });

              console.log(`Successfully processed Meta lead for tenant ${tenant.name}. Mobile: ${mobile}`);
            }
          }
        }
      }

      // Always return 200 to prevent Facebook from retrying and disabling the webhook
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error: any) {
      console.error("Error processing Meta webhook:", error);
      // Return 200 even on error to prevent Facebook from retrying and disabling the webhook
      return new Response(JSON.stringify({ success: true, error: error.message }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  }),
});

http.route({
  path: "/google-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const tenantIdString = url.searchParams.get("tenantId");
      if (!tenantIdString) {
        console.error("Missing tenantId query parameter in Google Ads Webhook call.");
        return new Response("Missing tenantId", { status: 400 });
      }

      // Look up the tenant
      let tenantId;
      try {
        tenantId = ctx.db.normalizeId("tenants", tenantIdString);
      } catch (e) {
        tenantId = tenantIdString;
      }

      if (!tenantId) {
        console.error(`Invalid tenantId: ${tenantIdString}`);
        return new Response("Invalid tenantId", { status: 400 });
      }

      const tenant = await ctx.runQuery(api.tenants.getById, { id: tenantId as any });
      if (!tenant) {
        console.error(`No tenant found for ID: ${tenantIdString}`);
        return new Response("Tenant not found", { status: 404 });
      }

      const googleSettings = tenant.settings?.integrations?.google;
      if (!googleSettings || !googleSettings.enabled) {
        console.warn(`Google Ads integration is disabled or not configured for tenant: ${tenant.name}`);
        return new Response("Integration disabled", { status: 403 });
      }

      const body = await request.json();
      console.log(`Received Google Webhook POST payload for tenant ${tenant.name}:`, JSON.stringify(body));

      // Validate google_key
      const receivedKey = body.google_key;
      const configuredKey = googleSettings.googleKey;

      if (!configuredKey || receivedKey !== configuredKey) {
        console.error(`Unauthorized Google Webhook call for tenant ${tenant.name}. Key mismatch. Received: ${receivedKey}`);
        return new Response("Unauthorized", { status: 401 });
      }

      // Map fields from body.user_column_data
      let customerName = "Google Lead";
      let mobile = "";
      let email = "";
      let city = "";

      const columnData = body.user_column_data || [];
      for (const col of columnData) {
        const id = col.column_id;
        const val = col.string_value;
        if (!val) continue;

        if (id === "FULL_NAME" || id === "FIRST_NAME") {
          customerName = val;
        } else if (id === "LAST_NAME") {
          if (customerName === "Google Lead" || customerName === "") {
            customerName = val;
          } else {
            customerName = `${customerName} ${val}`;
          }
        } else if (id === "PHONE_NUMBER") {
          mobile = val;
        } else if (id === "EMAIL") {
          email = val;
        } else if (id === "CITY" || id === "POSTAL_CODE") {
          city = val;
        }
      }

      if (!mobile) {
        console.warn("Skipping Google lead import: Phone number not found in column data");
        return new Response("Phone number missing", { status: 400 });
      }

      // Save lead via Convex processWebhookLead mutation
      await ctx.runMutation(api.leads.processWebhookLead, {
        tenant_id: tenant._id,
        customer_name: customerName,
        mobile,
        email: email || undefined,
        city: city || undefined,
        assignment_rule: googleSettings.assignmentRule || "manual",
        lead_source: "Google",
      });

      console.log(`Successfully processed Google lead for tenant ${tenant.name}. Mobile: ${mobile}`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error: any) {
      console.error("Error processing Google Webhook:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }),
});

http.route({
  path: "/housing-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const tenantIdString = url.searchParams.get("tenantId");
      if (!tenantIdString) {
        console.error("Missing tenantId query parameter in Housing.com Webhook call.");
        return new Response("Missing tenantId", { status: 400 });
      }

      let tenantId;
      try {
        tenantId = ctx.db.normalizeId("tenants", tenantIdString);
      } catch (e) {
        tenantId = tenantIdString;
      }

      if (!tenantId) {
        console.error(`Invalid tenantId: ${tenantIdString}`);
        return new Response("Invalid tenantId", { status: 400 });
      }

      const tenant = await ctx.runQuery(api.tenants.getById, { id: tenantId as any });
      if (!tenant) {
        console.error(`No tenant found for ID: ${tenantIdString}`);
        return new Response("Tenant not found", { status: 404 });
      }

      const housingSettings = tenant.settings?.integrations?.housing;
      if (!housingSettings || !housingSettings.enabled) {
        console.warn(`Housing.com integration is disabled for tenant: ${tenant.name}`);
        return new Response("Integration disabled", { status: 403 });
      }

      const body = await request.json();
      console.log(`Received Housing.com Webhook POST payload for tenant ${tenant.name}:`, JSON.stringify(body));

      const customerName = body.name || body.customer_name || "Housing Lead";
      const mobile = body.phone || body.mobile || body.phone_number || "";
      const email = body.email || "";
      const city = body.city || "";
      const project = body.project || body.message || body.description || "";

      if (!mobile) {
        console.warn("Skipping Housing.com lead import: Mobile number not found in payload");
        return new Response("Phone number missing", { status: 400 });
      }

      // Save lead via Convex processWebhookLead mutation
      await ctx.runMutation(api.leads.processWebhookLead, {
        tenant_id: tenant._id,
        customer_name: customerName,
        mobile,
        email: email || undefined,
        city: city || undefined,
        budget_range: project || undefined,
        assignment_rule: housingSettings.assignmentRule || "manual",
        lead_source: "Housing",
      });

      console.log(`Successfully processed Housing.com lead for tenant ${tenant.name}. Mobile: ${mobile}`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error: any) {
      console.error("Error processing Housing.com Webhook:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }),
});

export default http;
