import { v } from "convex/values";
import { action } from "./_generated/server";

export const exchangeCodeAndGetPages = action({
  args: {
    code: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    const appId = process.env.VITE_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error("Facebook App credentials (VITE_FACEBOOK_APP_ID or FACEBOOK_APP_SECRET) are not configured in Convex environment variables.");
    }

    // 1. Exchange authorization code for User Access Token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(args.redirectUri)}&client_secret=${appSecret}&code=${args.code}`;
    const tokenResponse = await fetch(tokenUrl);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Facebook token exchange error response:", errorText);
      throw new Error(`Facebook token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const userAccessToken = tokenData.access_token;

    // 2. Fetch the user's managed Facebook Pages
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`;
    const pagesResponse = await fetch(pagesUrl);

    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text();
      console.error("Facebook get pages error response:", errorText);
      throw new Error(`Failed to retrieve pages: ${errorText}`);
    }

    const pagesData = await pagesResponse.json();
    
    // Map pages list for client
    return (pagesData.data || []).map((page: any) => ({
      id: page.id,
      name: page.name,
      category: page.category,
      access_token: page.access_token,
    }));
  },
});

export const subscribePageToWebhook = action({
  args: {
    pageId: v.string(),
    pageAccessToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Call Meta to subscribe our App Webhook to their Page leadgen field
    const url = `https://graph.facebook.com/v18.0/${args.pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${args.pageAccessToken}`;
    
    const response = await fetch(url, {
      method: "POST",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Facebook page webhook subscription error response:", errorText);
      throw new Error(`Failed to subscribe webhook to Facebook page: ${errorText}`);
    }

    const data = await response.json();
    return data;
  },
});
