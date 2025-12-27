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
    
    // Validate Env Plan ID if present
    if (planId) {
        try {
            console.log(`Validating Env Plan ID: ${planId}`);
            await instance.plans.fetch(planId);
            console.log('Plan ID is valid.');
        } catch (planError) {
            console.warn(`Env Plan ID ${planId} is invalid (likely Test ID in Live mode). Ignoring...`);
            planId = null; // Reset to trigger auto-creation
        }
    }

    if (!planId) {
      // Auto-provision logic if env var is missing or invalid
      const planConfigs = {
        monthly: { period: 'monthly', interval: 1, name: 'SalesPro Monthly', amount: 150000, currency: 'INR', description: 'Monthly Subscription' },
        semi_annual: { period: 'monthly', interval: 6, name: 'SalesPro Semi-Annual', amount: 720000, currency: 'INR', description: '6-Month Subscription' },
        yearly: { period: 'yearly', interval: 1, name: 'SalesPro Yearly', amount: 1200000, currency: 'INR', description: 'Yearly Subscription' }
      };

      const config = planConfigs[planType];
      // ... rest of creation existing logic
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
    console.log('Step 1: Fetching tenant details...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant not found:', tenantError);
      throw new Error('Tenant not found');
    }
    console.log('Tenant found:', tenant.name);

    let customerId = tenant.razorpay_customer_id;
    console.log('Stored Customer ID:', customerId || 'None');

    // Step 2: Validate existing customer ID (if any)
    if (customerId) {
      console.log('Step 2: Validating existing customer ID...');
      try {
        // Try to fetch the customer to verify it exists in current mode (test/live)
        const existingCustomer = await instance.customers.fetch(customerId);
        console.log('Existing customer validated:', existingCustomer.id);
        // Customer is valid, we can use it
      } catch (fetchError) {
        console.warn('Stored customer ID is invalid (likely from different mode):', fetchError);
        // Customer ID is invalid (probably test mode ID with live keys or vice versa)
        customerId = null; // Clear it so we create a new one
        // Also clear it from database
        await supabase
          .from('tenants')
          .update({ razorpay_customer_id: null })
          .eq('id', tenantId);
        console.log('Cleared invalid customer ID from database');
      }
    }

    // Step 3: Create new customer if needed
    if (!customerId) {
      console.log('Step 3: Creating new customer in Razorpay...');
      const phone = tenant.settings?.company_profile?.phone || undefined;
      
      try {
        const customer = await instance.customers.create({
          name: tenant.name || 'SalesPro User',
          email: user.email,
          contact: phone,
          notes: { tenant_id: tenantId }
        });
        customerId = customer.id;
        console.log('New customer created:', customerId);

        // Update Tenant with new customer ID
        await supabase
          .from('tenants')
          .update({ razorpay_customer_id: customerId })
          .eq('id', tenantId);
        console.log('Database updated with new customer ID');
        
      } catch (custError) {
        console.error('Customer creation failed:', custError);
        const errDesc = custError.error?.description || custError.description || custError.message || '';
        
        if (errDesc.toLowerCase().includes('already exists') || errDesc.toLowerCase().includes('duplicate')) {
           console.log('Customer conflict detected (Already Exists). Fetching existing customer by email...');
           // Fetch existing customer by email
           try {
             const existingCustomers = await instance.customers.all({ count: 1, email: user.email });
             if (existingCustomers.items && existingCustomers.items.length > 0) {
                 customerId = existingCustomers.items[0].id;
                 console.log('Resolved existing customer ID:', customerId);
                 
                 // Update Tenant with new customer ID
                 await supabase
                   .from('tenants')
                   .update({ razorpay_customer_id: customerId })
                   .eq('id', tenantId);
             } else {
                 console.warn('Customer exists but query by email returned empty. This is unexpected.');
                 throw new Error('Customer exists in Razorpay but could not be retrieved. Please check dashboard.');
             }
           } catch (fetchErr) {
               console.error('Failed to fetch existing customer:', fetchErr);
               throw fetchErr;
           }
        } else {
          // Some other error
          throw new Error(`Failed to create customer: ${errDesc}`);
        }
      }
    }

    if (!customerId) {
      throw new Error('Failed to obtain valid customer ID');
    }

    // --- SUBSCRIPTION CREATION ---
    console.log('Initializing subscription creation...');
    const totalCount = planType === 'yearly' ? 10 : 120;

    const subscription = await instance.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: { tenant_id: tenantId, user_id: user.id }
    });
    console.log('Razorpay Subscription Created:', subscription.id);

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
        console.error("DB Insert Error:", subError);
        throw new Error(`DB Error: ${subError.message}`);
    }

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({
        subscriptionId: subscription.id,
        shortUrl: subscription.short_url,
        dbId: subRecord.id
      })
    };

  } catch (error) {
    console.error('Create Subscription Error Dump:', JSON.stringify(error, null, 2));
    
    // Extract meaningful error message
    let errorMessage = 'Unknown server error';
    if (error.message) errorMessage = error.message; // Standard JS Error
    else if (error.error && error.error.description) errorMessage = error.error.description; // Razorpay Error
    else if (error.description) errorMessage = error.description; // Some API errors

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: errorMessage, 
        details: error 
      })
    };
  }
};
