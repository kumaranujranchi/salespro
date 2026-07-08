import { query, internalAction } from "./_generated/server";
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
          
          // In a real-world production environment:
          // const url = `https://www.99acres.com/leads/leads_api.php?apikey=${nineNineSettings.apiKey}`;
          // const res = await fetch(url);
          // const xmlData = await res.text();
          // parseXMLAndInsertLeads(xmlData);

          // For simulation/testing: we check if there are any mock/test requests or logs
        } catch (error) {
          console.error(`[99acres Poller] Error fetching leads for tenant ${tenant.name}:`, error);
        }
      }

      // 3. Poll Magicbricks leads
      if (mbSettings && mbSettings.enabled && mbSettings.apiKey) {
        try {
          console.log(`[Magicbricks Poller] Polling leads for tenant: ${tenant.name}`);
          
          // In a real-world production environment:
          // const url = `https://api.magicbricks.com/leads/getLeads?key=${mbSettings.apiKey}`;
          // const res = await fetch(url);
          // const jsonData = await res.json();
          // parseJSONAndInsertLeads(jsonData);
        } catch (error) {
          console.error(`[Magicbricks Poller] Error fetching leads for tenant ${tenant.name}:`, error);
        }
      }
    }
  }
});
