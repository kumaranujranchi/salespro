import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// 1. Helper query to retrieve all required context for AI analysis
export const getLeadForAI = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) return null;

    let projectName = "General/No Project Assigned";
    if (lead.project_id) {
      const project = await ctx.db.get(lead.project_id);
      projectName = project?.name || projectName;
    }

    // Get recent followups for historical context
    const followups = await ctx.db
      .query("lead_followups")
      .withIndex("by_lead", (q) => q.eq("lead_id", args.leadId))
      .order("desc")
      .take(3);

    return {
      lead,
      projectName,
      recentFollowups: followups.map((f) => ({
        type: f.followup_type,
        date: f.followup_date,
        summary: f.discussion_summary,
        response: f.customer_response || "",
        status: f.new_status,
      })),
    };
  },
});

// 2. Mutation to save the generated score and sentiment
export const saveAIScore = mutation({
  args: {
    leadId: v.id("leads"),
    followupId: v.optional(v.id("lead_followups")),
    score: v.string(), // 'Hot' | 'Warm' | 'Cold'
    sentiment: v.string(), // 'Positive' | 'Neutral' | 'Negative'
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    const existingMetadata = lead.metadata || {};
    
    // Patch lead score and AI metadata
    await ctx.db.patch(args.leadId, {
      lead_score: args.score,
      metadata: {
        ...existingMetadata,
        aiSentiment: args.sentiment,
        aiReason: args.reason,
        aiLastUpdated: new Date().toISOString(),
      },
    });

    // Patch followup metadata if available
    if (args.followupId) {
      const followup = await ctx.db.get(args.followupId);
      if (followup) {
        const existingFollowupMetadata = followup.metadata || {};
        await ctx.db.patch(args.followupId, {
          metadata: {
            ...existingFollowupMetadata,
            aiSentiment: args.sentiment,
            aiReason: args.reason,
          },
        });
      }
    }
  },
});

// 3. Action to score lead and analyze sentiment using Gemini API
export const analyzeFollowupAndScoreLead = action({
  args: {
    leadId: v.id("leads"),
    followupRemark: v.string(),
    followupId: v.optional(v.id("lead_followups")),
  },
  handler: async (ctx, args) => {
    // A. Retrieve context
    const context = await ctx.runQuery(api.ai.getLeadForAI, { leadId: args.leadId });
    if (!context) throw new Error("Could not retrieve context for Lead");

    const { lead, projectName, recentFollowups } = context;

    // B. Check for API key. If missing, use heuristic-based Demo Mode
    const apiKey = process.env.GEMINI_API_KEY;
    let score = "Warm";
    let sentiment = "Neutral";
    let reason = "AI analysis completed (Demo Mode: Set GEMINI_API_KEY in Convex dashboard)";

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured in Convex. Running in Demo Mode.");
      
      const remarkLower = args.followupRemark.toLowerCase();
      
      // Basic heuristic rules for Demo Mode
      const hotKeywords = ["visit", "buy", "ready", "interested", "hot", "booking", "meeting", "tomorrow", "site visit", "token", "advance"];
      const coldKeywords = ["not interested", "busy", "wrong number", "don't call", "spam", "switch off", "disconnected", "cold", "expensive", "no budget"];

      if (hotKeywords.some((keyword) => remarkLower.includes(keyword))) {
        score = "Hot";
        sentiment = "Positive";
        reason = "Demo Mode: Detected high intent keywords in remarks.";
      } else if (coldKeywords.some((keyword) => remarkLower.includes(keyword))) {
        score = "Cold";
        sentiment = "Negative";
        reason = "Demo Mode: Detected negative interest keywords in remarks.";
      } else {
        score = "Warm";
        sentiment = "Neutral";
        reason = "Demo Mode: Neutral remarks. Kept lead as Warm.";
      }
    } else {
      // C. Perform real API call using Gemini 2.5 Flash
      const recentFollowupsText = recentFollowups
        .map((f) => `- [${f.date}] Type: ${f.type}, Status: ${f.status}, Remark: "${f.summary}"`)
        .join("\n");

      const prompt = `You are a helpful AI sales analysis assistant for a real estate & CRM platform named SalesPro.
Analyze the latest interaction (follow-up remark) for this lead to assess customer sentiment and interest levels.

Lead Profile:
- Customer Name: ${lead.customer_name}
- Project: ${projectName}
- Budget Range: ${lead.budget_range || "Not specified"}
- Lead Source: ${lead.lead_source}
- City: ${lead.city || "Not specified"}
- Total Followups: ${lead.followup_count || 0}

Latest Interaction Remark:
"${args.followupRemark}"

Previous Interactions History (Newest first):
${recentFollowupsText || "No previous interactions."}

Your task:
1. Determine Customer Sentiment: "Positive", "Neutral", or "Negative".
2. Recommend Lead Score: 
   - "Hot": Customer is highly interested, wants a site visit, asked for pricing/booking details, or scheduled a direct meet.
   - "Warm": Customer is responsive, wants to call back later, requested general information, or needs nurturing.
   - "Cold": Customer is not responding, refused to talk, requested to stop calling, or has budget completely mismatching options.
3. Recommend next steps / short reason (maximum 15 words).

You MUST respond ONLY with a valid JSON object matching this schema:
{
  "score": "Hot" | "Warm" | "Cold",
  "sentiment": "Positive" | "Neutral" | "Negative",
  "reason": "string (max 15 words)"
}
Do not include any markdown styling, code blocks like \`\`\`json, or extra comments. Return strictly the raw JSON string.`;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini HTTP Error: ${errText}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (responseText) {
          const parsed = JSON.parse(responseText.trim());
          if (parsed.score && parsed.sentiment && parsed.reason) {
            score = parsed.score;
            sentiment = parsed.sentiment;
            reason = parsed.reason;
          }
        }
      } catch (e: any) {
        console.error("Failed to query Gemini API:", e);
        reason = `AI Analysis failed: ${e.message || e}. Using safe fallback.`;
      }
    }

    // D. Persist findings
    await ctx.runMutation(api.ai.saveAIScore, {
      leadId: args.leadId,
      followupId: args.followupId,
      score,
      sentiment,
      reason,
    });

    return { score, sentiment, reason };
  },
});

// 4. Action to generate customized outreach templates using Gemini API
export const generateOutreach = action({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(api.ai.getLeadForAI, { leadId: args.leadId });
    if (!context) throw new Error("Could not retrieve context for Lead");

    const { lead, projectName, recentFollowups } = context;
    const latestFollowup = recentFollowups[0]?.summary || "No interactions recorded yet.";

    const apiKey = process.env.GEMINI_API_KEY;
    let whatsapp = "";
    let emailSubject = "";
    let emailBody = "";

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured in Convex. Running generateOutreach in Demo Mode.");
      
      // Customized templates for Demo Mode
      whatsapp = `Hello ${lead.customer_name}! Hope you are doing well. I wanted to follow up regarding your interest in our project *${projectName}*. Please let me know if you have any questions or when would be a good time to connect. Best regards!`;
      emailSubject = `Follow-up: ${projectName} - SalesPro Team`;
      emailBody = `Dear ${lead.customer_name},\n\nI hope this email finds you well.\n\nI am writing to follow up on your interest in our project, ${projectName}. Please let me know if you would like additional details, a brochure, or if you'd like to schedule a call to discuss further.\n\nBest regards,\nSales Team\nSalesPro`;
    } else {
      const prompt = `You are a professional real estate sales copywriter.
Generate an engaging outreach WhatsApp message and a professional follow-up Email for the following client.

Lead Profile:
- Client Name: ${lead.customer_name}
- Project: ${projectName}
- Budget Range: ${lead.budget_range || "Not specified"}
- Lead Source: ${lead.lead_source}
- Recent Interaction Summary: "${latestFollowup}"

Output Guidelines:
- WhatsApp message: Engaging, short (max 80 words), written in a friendly tone (English/Hinglish), uses emojis, mentions the project "${projectName}", and ends with a clear question (call to action). Include bold text formatting where appropriate (e.g. *bold*).
- Email: Professional subject and body, polite, clearly outlines value, and invites a callback.

You MUST respond ONLY with a valid JSON object matching this schema:
{
  "whatsapp": "WhatsApp message content here",
  "emailSubject": "Email subject line here",
  "emailBody": "Email body content here"
}
Do not include any markdown styling, code blocks like \`\`\`json, or extra comments. Return strictly the raw JSON string.`;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini HTTP Error: ${errText}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (responseText) {
          const parsed = JSON.parse(responseText.trim());
          whatsapp = parsed.whatsapp || whatsapp;
          emailSubject = parsed.emailSubject || emailSubject;
          emailBody = parsed.emailBody || emailBody;
        }
      } catch (e: any) {
        console.error("Failed to query Gemini API for outreach:", e);
        whatsapp = `Hello ${lead.customer_name}! Following up on our discussion about *${projectName}*. Let me know when we can connect!`;
        emailSubject = `Following up: ${projectName}`;
        emailBody = `Dear ${lead.customer_name},\n\nHope you are doing well. I wanted to check if you have any updates regarding ${projectName}.\n\nBest regards,\nSales Team`;
      }
    }

    return { whatsapp, emailSubject, emailBody };
  },
});
