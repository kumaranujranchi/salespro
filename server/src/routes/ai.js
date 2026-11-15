import express from 'express';
import { query } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const REALSALEPRO_SYSTEM_PROMPT = `You are a real, experienced senior real estate sales colleague and CRM expert at RealSalePro. You are talking directly to a colleague on your sales team.

CRITICAL VOICE AND FORMATTING RULES:
1. Speak in a completely natural, conversational human tone. Never sound like a robot, an automated assistant, or an AI. Do not use phrases like "As an AI...", "Here is a breakdown...", or "I'd love to help!". Just answer directly and conversationally as a real person.
2. ABSOLUTELY NO MARKDOWN FORMATTING SIGNS.
   - Never use hashes (#, ##, ###) for headings.
   - Never use double asterisks (**) or single asterisks (*) to make words bold or italic.
   - Never use backticks (\`) or code blocks.
   - Write clean, standard text with normal capitalization and sentence punctuation.
3. NO EMOJI CLUTTER.
   - Do not use emojis as bullet points or decorate every line with icons like target, phone, money, building, or rocket.
   - Keep emojis to zero. Write clean, natural sentences.
4. NATURAL LISTS:
   - If listing steps or suggestions, simply use normal numbering like 1., 2., 3. or simple clean line breaks.
5. REAL ESTATE EXPERTISE:
   - Provide realistic, field-tested advice for real estate sales, telecalling, site visits, and objections.
   - Understand Indian and international real estate terms (BHK, carpet area, super built-up, RERA, floor rise, PLC, token amount, possession, subvention, site visit).

REALSALEPRO CRM PROCESS MANUAL:
1. Leads and CRM (/leads):
   - Ingestion: Walk-in, Referrals, 99acres, MagicBricks, Housing, Meta Lead Ads (instant 30-second webhook sync with Conversions API), Google Ads.
   - Statuses: New -> Contacted -> In Progress -> Qualified -> Converted (or Lost / Disqualified).
   - Lost or Disqualified leads can be reopened back to New with 1 click.
   - Telecaller Phone Masking: Non-admin staff and telecallers see masked numbers (98765 •••••) to protect company data from theft. They click the Call button to dial or WhatsApp button to chat. Only Admins can unmask numbers in Settings.
   - Follow-ups: Log discussion notes, call status (Connected, Busy, Switch Off, Not Reachable, Wrong Number), customer response, and schedule next follow-up dates with overdue alerts.
   - Bulk actions: CSV import with deduplication, bulk executive assignment, bulk project tagging, bulk status change, and bulk delete.
   - Automatic Conversion: When lead status is changed to Converted, a deal record is automatically created in the Sales module.

2. Sales and Bookings (/sales):
   - Deal tracking: Customer details, project, tower, unit number, area in sq ft, deal value/revenue, executive name, booking date.
   - Payment milestones: Token amount, construction-linked installments, GST/TDS, and receipt downloads.
   - Sales Visibility: Self (callers see own deals), Team (managers see team deals), Overall (admins see company total), None (hidden).

3. Site Visits (/site-visits):
   - Scheduling: Pick a lead, project, date/time, and pickup location (Airport, Home, Office).
   - Driver & Vehicle: Assign company driver.
   - Trip tracking: Driver enters Start Odometer at pickup, and End Odometer at drop-off. The app automatically calculates kilometers traveled.
   - Views: Toggle between Company Schedule and My Requests.

4. Inventory and Projects (/inventory, /projects):
   - Hierarchy: Project -> Tower -> Floor -> Unit.
   - Typologies: 1BHK, 2BHK, 3BHK, 4BHK, Villa, Commercial.
   - Unit Status: Available, Hold/Blocked, Booked.
   - Unit Hold: Temporary 24-48 hour hold on units while booking cheques clear.

5. Targets and Incentives (/targets, /incentives):
   - Monthly Quotas: Revenue targets, units sold, area (sq ft), and site visits conducted.
   - Progress: Live percentage bars, leaderboards, and tiered commission slabs.

6. Granular Roles and RBAC (/roles):
   - Configurable rights: View, Create, Edit, Delete, Assign, Export.
   - Caller rights: View-only callers can call and log followups, but cannot edit customer contact details or delete records.

7. Common Sales Objections & Scripts:
   - Price too high: Acknowledge budget, pivot to annual capital appreciation and rental yield, break into construction milestones or bank subvention, offer spot-booking benefit.
   - Need to discuss with family: Validate family decision, politely probe whether hesitation is budget or layout, offer to WhatsApp a 3-minute video walkthrough, fix a 5-minute callback time tomorrow.
   - Site is too far: Highlight upcoming expressways, metro connectivity and IT hubs, offer a door-to-door company cab site visit.
   - Cold calling hook: 10-second opener asking if you caught them at a bad time, mention developer pre-launch units with zero floor rise, ask if looking for family use or investment, and offer two specific time slots for site walkthrough.

Remember: Output plain, natural human text. No hashes, no double stars, no emoji clutter.`;

// Clean any leftover markdown and emoji clutter from model output
function cleanNaturalHumanText(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    // Remove markdown headers: #, ##, ###, #### at start of lines
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, '')
    // Remove bold and italic markdown asterisks: **word** -> word, *word* -> word
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove markdown bullet asterisks: * point -> point
    .replace(/^[ \t]*\*[ \t]+/gm, '- ')
    // Remove markdown backticks and code fences
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/`/g, '')
    // Remove excessive decorative emoji clutter
    .replace(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
    // Clean up double spaces or weird artifacts
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// POST /api/ai/chat - AI Sales Copilot Conversation
router.post('/chat', async (req, res) => {
  try {
    const user = req.user;
    const targetTenantId = req.tenantId || user?.tenant_id;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // 1. Pro Plan Access Check
    const isPlatformAdmin = user.role === 'platform_admin' || user.role === 'super_admin';
    let isProTenant = false;

    if (!isPlatformAdmin && targetTenantId) {
      const tenantRes = await query(
        `SELECT plan_tier, subscription_status FROM tenants WHERE id = $1 LIMIT 1`,
        [targetTenantId]
      );
      const tenant = tenantRes.rows[0];
      if (tenant) {
        const planTier = String(tenant.plan_tier || '').toLowerCase();
        const subStatus = String(tenant.subscription_status || '').toLowerCase();
        isProTenant =
          planTier === 'pro' ||
          subStatus === 'paid' ||
          subStatus === 'pro' ||
          subStatus === 'active_paid';
      }
    }

    if (!isPlatformAdmin && !isProTenant) {
      return res.status(403).json({
        error: 'AI Sales Copilot is an exclusive Pro Plan feature. Upgrade your organization plan to access real-time AI sales coaching.',
        code: 'PRO_REQUIRED',
      });
    }

    // 2. Prepare Conversation Messages
    const { messages = [] } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const formattedMessages = [
      { role: 'system', content: REALSALEPRO_SYSTEM_PROMPT },
      ...messages.slice(-10).map((m) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || ''),
      })),
    ];

    // 3. Call DeepSeek API
    const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-ce0ab58942ae4498b8dc376ce97976f0';
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          temperature: 0.65,
          max_tokens: 1024,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (deepseekRes.ok) {
        const data = await deepseekRes.json();
        const rawReply = data?.choices?.[0]?.message?.content || '';
        const cleanReply = cleanNaturalHumanText(rawReply);
        if (cleanReply) {
          return res.json({ reply: cleanReply });
        }
      } else {
        const errText = await deepseekRes.text();
        console.error('DeepSeek API response error:', deepseekRes.status, errText);
      }
    } catch (apiErr) {
      console.error('DeepSeek API connection error:', apiErr.message);
    }

    // Fallback if DeepSeek is unreachable
    const lastUserMsg = [...messages].reverse().find((m) => m?.role === 'user')?.content || '';
    const fallbackReply = generateSmartFallback(lastUserMsg);

    return res.json({ reply: cleanNaturalHumanText(fallbackReply) });
  } catch (err) {
    console.error('AI chat endpoint error:', err);
    return res.status(500).json({
      error: 'Failed to process AI chat request',
      message: err.message,
    });
  }
});

// Smart Local Fallback without markdown artifacts or emoji clutter
function generateSmartFallback(queryText) {
  const text = String(queryText || '').toLowerCase().trim();

  if (text.includes('cold call') || text.includes('script') || text.includes('pitch') || text.includes('telecall') || text.includes('opener') || text.includes('how to call')) {
    return `Here is a natural cold calling flow you can use right away:

1. The quick opener:
"Hi [Customer Name], I noticed you were looking into residential projects around [Project or Area]. I am calling from the sales team here. Did I catch you in the middle of something urgent?"

2. The value point:
"The reason for my quick call is that we just released a handful of pre-launch units with zero floor rise charges and a flexible payment schedule."

3. The qualifying question:
"Are you looking at this mainly for family living, or is capital appreciation your primary focus?"

4. Setting the walkthrough:
"I would not want to take up your time right now over the phone. Would Thursday around 4:30 PM or Saturday at 11:00 AM work better for a quick 15-minute walkthrough of the model flat?"

A good rule of thumb is to always offer two specific time options instead of asking an open question like whether they are free.`;
  }

  if (text.includes('expensive') || text.includes('price') || text.includes('budget') || text.includes('discount') || text.includes('rate') || text.includes('cost')) {
    return `When a client says the property is too expensive or beyond their budget, try handling it this way:

1. First acknowledge their concern:
"I completely understand. Budget is always the most important factor when investing in a home."

2. Pivot from price to appreciation:
"In this micro-market, values have been appreciating by about 12 to 14 percent year on year. With this project, you are getting certified construction, extensive open green spaces, and ready amenities."

3. Offer payment milestone flexibility:
"Rather than a heavy upfront commitment, the developer offers construction-linked installments, which keeps your immediate cash outlay very manageable."

4. Suggest an on-site visit:
"Let us visit the site once together. If you genuinely like the layout and location, I will personally talk with the sales director to explore an exclusive spot-booking benefit for you."`;
  }

  if (text.includes('mask') || text.includes('theft') || text.includes('phone') || text.includes('number')) {
    return `Phone number masking in RealSalePro protects client contact data:

1. For sales executives, callers, and drivers, the last 5 digits of buyer phone numbers are masked like 98765 •••••.
2. Team members can click the call button to trigger their dialer or click WhatsApp to chat, without ever needing to copy or export raw customer numbers.
3. Only Administrators have access to unmask numbers or download CSV exports.
4. This ensures your organization database stays safe from unauthorized lead leakage.`;
  }

  if (text.includes('site visit') || text.includes('visit') || text.includes('cab') || text.includes('driver')) {
    return `Here is how to manage site visits in RealSalePro:

1. Open the Site Visits section and click Schedule Visit.
2. Pick the customer lead, project, date and time, and where the client should be picked up from.
3. Assign a company driver. The driver will see the booking in their app.
4. When picking up the customer, the driver enters the starting odometer reading, and upon dropping them off, enters the ending reading. The system calculates the total kilometers automatically.
5. After the visit is finished, update the customer's feedback and next steps in their lead follow-up notes.`;
  }

  return `Hi, I am your sales copilot for RealSalePro. 

I can help you with practical sales scripts, handling client objections like price or delays, writing quick WhatsApp follow-up messages, or guiding you step by step through any feature in the CRM like lead assignment, site visits, or bookings.

What deal or customer situation are you working on right now?`;
}

export default router;
