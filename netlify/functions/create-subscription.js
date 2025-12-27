const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event, context) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { tenantId, planType } = JSON.parse(event.body);
    const authHeader = event.headers.authorization;

    if (!authHeader) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Missing Authorization header' }) };
    }

    // Initialize Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service Role Key required for backend updates
    
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Server configuration error: Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify User Token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // Initialize Razorpay
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      throw new Error('Server configuration error: Missing Razorpay keys');
    }

    const instance = new Razorpay({ key_id, key_secret });

    // --- PLAN MANAGEMENT ---
    // Try to get Plan ID from Env, else find/create it
    let planId = process.env[`RAZORPAY_PLAN_ID_${planType.toUpperCase()}`];

    if (!planId) {
      // Auto-provision logic if env var is missing
      const planConfigs = {
        monthly: { period: 'monthly', interval: 1, name: 'SalesPro Monthly', amount: 150000, currency: 'INR', description: 'Monthly Subscription' },
        semi_annual: { period: 'monthly', interval: 6, name: 'SalesPro Semi-Annual', amount: 720000, currency: 'INR', description: '6-Month Subscription' },
        yearly: { period: 'yearly', interval: 1, name: 'SalesPro Yearly', amount: 1200000, currency: 'INR', description: 'Yearly Subscription' }
      };

      const config = planConfigs[planType];
      if (!config) throw new Error('Invalid plan type');

      // Fetch existing plans to check for duplicates
      // Note: This matches strictly by name to avoid dupes
      const existingPlans = await instance.plans.all();
      const found = existingPlans.items.find(p => p.item.name === config.name);

      if (found) {
        planId = found.id;
        console.log(`Found existing plan for ${planType}: ${planId}`);
      } else {
        // Create new plan
        const newPlan = await instance.plans.create({
          period: config.period,
          interval: config.interval,
          item: {
            name: config.name,
            amount: config.amount,
            currency: config.currency,
            description: config.description
          }
        });
        planId = newPlan.id;
        console.log(`Created new plan for ${planType}: ${planId}`);
      }
    }

    // --- CUSTOMER MANAGEMENT ---
    // Get Tenant details
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) throw new Error('Tenant not found');

    // Force create new customer to avoid Test/Live ID mismatch
    // let customerId = tenant.razorpay_customer_id;
    let customerId = null; 

    if (!customerId) {
      // Create Customer in Razorpay
      const customer = await instance.customers.create({
        name: tenant.name || 'SalesPro User',
        email: user.email,
        contact: tenant.phone || undefined,
        notes: { tenant_id: tenantId }
      });
      customerId = customer.id;

      // Update Tenant
      await supabase
        .from('tenants')
        .update({ razorpay_customer_id: customerId })
        .eq('id', tenantId);
    }

    // --- SUBSCRIPTION CREATION ---
    // Start date: +2 minutes to be safe
    // Start date: Immediate
    // const startAt = Math.floor(Date.now() / 1000) + 120;  // Removed to avoid 'Hosted page not available' error 
    const totalCount = planType === 'yearly' ? 10 : 120; // 10 years or 10 years months

    const subscription = await instance.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: { tenant_id: tenantId, user_id: user.id }
    });

    // --- DB RECORD ---
    const { data: subRecord, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: tenantId,
        razorpay_subscription_id: subscription.id,
        razorpay_plan_id: planId,
        status: 'created',
        short_url: subscription.short_url,
        total_count: subscription.total_count,
        customer_notify: true,
        quantity: 1,
        // Mock current dates, updated via webhook later
        current_start: new Date().toISOString(),
        current_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (subError) {
        console.error("DB Error:", subError);
        // Continue returning the link, but this is risky. Better to throw.
        throw subError;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: subscription.id,
        shortUrl: subscription.short_url,
        dbId: subRecord.id
      })
    };

  } catch (error) {
    console.error('Create Subscription Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
