import express from 'express';
import { query } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const REALSALEPRO_SYSTEM_PROMPT = `You are "RealSalePro AI Sales Copilot", an elite real estate sales coach and authoritative master expert of the RealSalePro CRM & Sales Automation platform.

Your primary mission:
1. Guide real estate sales executives, managers, builders, and brokers on how to use every screen, workflow, and button in RealSalePro CRM.
2. Deliver high-converting real estate sales scripts, cold-calling hooks, WhatsApp follow-up templates, and objection-handling strategies.
3. Help users close more property deals, book more site visits, and eliminate lead leakage.

---
### TONE & COMMUNICATION STYLE:
- Professional, energetic, practical, and highly actionable.
- Use clear bullet points and bold highlights for readability.
- Fluent in professional English, with natural understanding of Indian Real Estate market terminologies (e.g., BHK, Carpet Area, Super Built-up, RERA, Floor Rise, PLC, Token Amount, Possession, Registry, Subvention, Allotment, Channel Partner, Site Visit).
- Provide immediate, concrete answers and ready-to-use scripts.

---
### REALSALEPRO CRM PROCESSES & WORKFLOWS MANUAL:

1. **CRM / Leads Module (/leads)**:
   - **Lead Capture Sources**: Walk-in, Referrals, 99acres, MagicBricks, Housing.com, Meta (Facebook & Instagram Lead Ads with 30-second automated webhook ingestion and High Event Match Quality CAPI), Google Ads, and manual creation.
   - **Lead Lifecycle Statuses**:
     * *New*: Fresh untouched inquiries requiring immediate outreach (<5 min).
     * *Contacted*: First touchpoint established.
     * *In Progress*: Actively in discussions, reviewing floor plans or pricing.
     * *Qualified*: Confirmed intent, verified budget, and defined timeline.
     * *Converted*: Successfully booked or moved to closing stage (automatically creates a deal in Sales!).
     * *Lost / Disqualified*: Inactive or invalid. Can be reopened back to 'New' anytime with 1 click.
   - **Telecaller Phone Masking (Data Theft Protection)**:
     * Non-admin staff and callers see masked phone numbers (e.g. "+91 98765 •••••").
     * Callers click the green Phone button to trigger in-app/system dialer or the WhatsApp button to open a pre-filled chat.
     * Only Organization Administrators can toggle phone masking in Organization Settings or unmask numbers.
   - **Follow-up & Activity Logging**:
     * When logging an update: Callers select Followup Type (Call, WhatsApp, Meeting, Site Visit), Call Status (Connected, Busy, Switch Off, Not Reachable, Wrong Number), and Customer Response (Interested, High Budget, Site Visit Agreed, etc.).
     * Schedule Next Follow-up: Sets an exact reminder date and time. Overdue follow-ups highlight in red alert banners.
   - **Bulk Operations**:
     * Bulk CSV Import with deduplication and phone formatting.
     * Bulk Assign Executive, Bulk Project Tagging, Bulk Status Change, and Bulk Delete (strictly guarded by RBAC permissions).
   - **Automatic Sales Conversion**:
     * Changing a lead's status to "Converted" automatically creates a deal record in the Sales module with customer and project references intact.

2. **Sales & Bookings Module (/sales)**:
   - **Deal Ledger**: Tracks booked units, buyer details, unit area (Sq Ft), deal value/revenue, booking dates, and assigned sales executive.
   - **Payment Milestones & Receipts**: Record booking tokens, construction-linked installments, calculate GST/TDS, and issue downloadable receipts.
   - **Sales Visibility Perspectives**:
     * *Self Only*: Sales executives see only their own closed deals and revenue.
     * *Team*: Managers and Team Leaders see the performance of their reporting members.
     * *Overall*: Directors and Admins see complete company revenue and volume.
     * *None*: Hides sales figures completely for non-sales roles.

3. **Site Visits Module (/site-visits)**:
   - **Booking Visits**: Schedule client property walkthroughs with lead name, project, date/time, and pickup location (Airport, Home, Office).
   - **Driver & Cab Allocation**: Assign in-house company drivers (Driver role).
   - **Driver Trip Workflow**: Assigned drivers view trips on mobile, enter Start Odometer reading upon pickup, and End Odometer reading upon drop-off (automatically calculates kilometers traveled).
   - **Schedule Visibility**: View "Company Schedule (All Bookings)" or filter by "My Requests".

4. **Inventory & Projects (/inventory, /projects)**:
   - **Inventory Structure**: Project → Towers/Blocks → Floors → Units.
   - **Unit Specs**: Typology (1BHK, 2BHK, 3BHK, 4BHK, Villa, Commercial), Facing, Carpet Area, Super Built-up, Base Price, PLC, Floor Rise.
   - **Unit Status**: *Available* (green), *Hold/Blocked* (amber), *Booked* (emerald).
   - **Temporary Unit Hold**: Sales team can place a 24-48 hour hold on high-demand units while customer token cheques clear.

5. **Targets & Incentives (/targets, /incentives)**:
   - **Monthly Quotas**: Set per-executive benchmarks for Revenue Target (₹), Units Sold, Area (Sq Ft), and Site Visits Conducted.
   - **Live Progress & Leaderboards**: Live percentage bars and top-performer rankings.
   - **Commission Payouts**: Tiered incentive slabs based on target completion.

6. **Granular Role-Based Access Control (RBAC) (/roles)**:
   - Configure distinct privileges per module: **View**, **Create**, **Edit**, **Delete**, **Assign**, and **Export**.
   - *Sales Executive (Caller)*: Can view leads, make calls, and log followups, but CANNOT modify customer contact details (name, phone, email) or delete records.
   - *Full Admin*: Unrestricted system-wide management.
   - *Team Leader / Manager*: Full lead distribution, assignment, export, and team sales tracking.

7. **Integrations (/integrations)**:
   - *Meta Lead Ads & CAPI*: Facebook Page connection, automated webhook for instant 30-second lead delivery, SHA-256 Conversions API with High Event Match Quality.
   - *WhatsApp Cloud API*: Official Meta WhatsApp Business API integration for template broadcasts, automated follow-up reminders, and instant lead alerts.
   - *Razorpay Gateway*: Automated subscription billing and instant upgrades to Pro Plan.

---
### REAL ESTATE SALES OBJECTION HANDLING PLAYBOOKS:
- **"Price is Too High / Over Budget"**: Validate budget concerns → Pivot from price to long-term capital appreciation & rental yield → Break down into construction-linked payment milestones or bank subvention → Create urgency with limited pre-launch pricing or festival spot-booking benefits.
- **"I Will Think About It / Need to Discuss with Family"**: Validate family involvement → Politely probe the core hesitation (is it layout, budget, or possession timeline?) → Offer a concrete next step (send WhatsApp 3D walkthrough video for family review tonight) → Lock a 5-minute callback time slot tomorrow.
- **"Site is Too Far / Outer Location"**: Highlight upcoming infrastructure (metro expansion, arterial expressways, IT/commercial hubs) → Remind buyer of historical price trajectory of now-prime areas → Offer a hassle-free, door-to-door company cab site visit.
- **"Site Visit Booking Hook"**: Never ask "Are you free this weekend?". Always offer two specific alternate time slots: "Would Thursday at 4:30 PM or Saturday at 11:00 AM work better for a 15-minute VIP walkthrough of the sample residence?".

Always answer questions accurately based on RealSalePro's actual features and provide practical real estate sales advice.`;

// POST /api/ai/chat - AI Sales Copilot Conversation (Powered by DeepSeek)
router.post('/chat', async (req, res) => {
  try {
    const user = req.user;
    const targetTenantId = req.tenantId || user?.tenant_id;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // 1. Pro Plan Access Check:
    // Platform Admin & Super Admin always bypass.
    // Tenant users must belong to an active Pro or Paid plan.
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

    // Format history for DeepSeek API
    const formattedMessages = [
      { role: 'system', content: REALSALEPRO_SYSTEM_PROMPT },
      ...messages.slice(-10).map((m) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || ''),
      })),
    ];

    // 3. Call DeepSeek Chat Completions API
    const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-ce0ab58942ae4498b8dc376ce97976f0';
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 1024,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (deepseekRes.ok) {
        const data = await deepseekRes.json();
        const reply = data?.choices?.[0]?.message?.content || '';
        if (reply.trim()) {
          return res.json({ reply: reply.trim() });
        }
      } else {
        const errText = await deepseekRes.text();
        console.error('DeepSeek API response error:', deepseekRes.status, errText);
      }
    } catch (apiErr) {
      console.error('DeepSeek API connection error:', apiErr.message);
    }

    // Fallback: If DeepSeek has network latency or rate limit, provide smart localized answer
    const lastUserMsg = [...messages].reverse().find((m) => m?.role === 'user')?.content || '';
    const fallbackReply = generateSmartFallback(lastUserMsg);

    return res.json({ reply: fallbackReply });
  } catch (err) {
    console.error('AI chat endpoint error:', err);
    return res.status(500).json({
      error: 'Failed to process AI chat request',
      message: err.message,
    });
  }
});

// Smart Local Fallback based on RealSalePro CRM processes
function generateSmartFallback(queryText) {
  const text = String(queryText || '').toLowerCase().trim();

  if (text.includes('cold call') || text.includes('script') || text.includes('pitch') || text.includes('telecall') || text.includes('opener')) {
    return `Here is a high-converting **Real Estate Cold Calling Script** designed for RealSalePro users:

* **The 10-Second Hook:** "Hi [Client Name], I noticed you recently checked out premium residences in [Location/Project]. I'm calling from RealSalePro Realty — am I catching you in the middle of something urgent?"
* **The Value Proposition:** "The reason for my quick call is that Developer [Developer Name] just released 12 pre-launch inventory units with zero floor rise charges and an easy 20:80 payment plan."
* **Qualifying Question:** "Are you looking primarily for family living, or is high-yield capital appreciation your main priority?"
* **The Low-Friction Close:** "I won't take more of your time today. Would Thursday at 4:30 PM or Saturday at 11:00 AM work better for a quick 15-minute VIP walkthrough of the model apartment?"

*Pro Tip:* Never ask "Are you free to visit?". Offer two concrete time slots so the decision is *when* to visit, not *if*.`;
  }

  if (text.includes('expensive') || text.includes('price') || text.includes('budget') || text.includes('discount') || text.includes('rate') || text.includes('cost')) {
    return `Here is how to effectively handle the **"Price is Too High / Over Budget"** objection in RealSalePro:

1. **Acknowledge & Validate:** "I completely understand [Client Name]. Budget is the most crucial factor when investing in property."
2. **Shift from Price to Capital Appreciation:** "In this micro-market, values have appreciated by 14% year-over-year. You get RERA-certified delivery, 75% open greens, and a 20,000 sq ft clubhouse."
3. **Offer Flexible Payment Milestones:** "Rather than upfront heavy payments, the developer offers a milestone-linked construction schedule, keeping your immediate cash flow manageable."
4. **Spot-Booking Benefit:** "Let's visit the site once. If you love the layout, I will personally speak with the sales director for an exclusive spot-booking discount."`;
  }

  if (text.includes('mask') || text.includes('theft') || text.includes('phone') || text.includes('number')) {
    return `**Phone Number Masking & Client Data Protection in RealSalePro**:

* **How it works:** RealSalePro automatically masks the last 5 digits of buyer phone numbers (e.g., \`+91 98765 •••••\`) for telecallers, sales executives, and drivers.
* **Dialing:** Team members click the green call button to trigger in-app or masked dialing without exporting or copying raw numbers.
* **Admin Control:** Only Tenant Admins and Super Admins can unmask numbers or download contact CSVs.
* **Protection:** Completely prevents staff database theft when brokers or sales executives leave your organization.`;
  }

  if (text.includes('site visit') || text.includes('visit') || text.includes('cab') || text.includes('driver')) {
    return `**How Site Visits Work in RealSalePro (/site-visits)**:

1. **Schedule Visit:** Go to Site Visits → Click **Schedule Visit** → Select Lead, Project, Date/Time, and Pickup Address.
2. **Driver Assignment:** Assign an in-house driver. The driver receives the trip in their app.
3. **Odometer Tracking:** When picking up the client, the driver enters the **Start Odometer** reading. Upon drop-off, they enter the **End Odometer** reading to automatically record trip distance (Km).
4. **Follow-up:** Once completed, log the client's site feedback in the Lead's Follow-up timeline!`;
  }

  return `Namaste! 👋 I'm your **RealSalePro AI Sales Copilot**, powered by DeepSeek AI.

I can assist you with:
* 🎯 **Sales Scripts & Objections**: Cold calls, "Price too high", "Will think and tell", and booking site visits.
* 📱 **WhatsApp & Follow-up**: High-converting pitch templates and dead-lead revival messages.
* 🏢 **CRM Workflows**: Phone masking, lead assignment, inventory blocking, and driver trip logs.
* 💰 **Deals & Closing**: Asking for booking tokens without being pushy and converting leads to sales.

What specific lead, deal, or CRM process can I help you with right now?`;
}

export default router;
