import Razorpay from 'razorpay';

export async function handler(event, context) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { tenantId, tenantName, customerEmail, customerContact, planType } = JSON.parse(event.body);

    // Initialize Razorpay
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      throw new Error('Server configuration error: Missing Razorpay keys');
    }

    const instance = new Razorpay({ key_id, key_secret });

    // --- PLAN MANAGEMENT ---
    const planConfigs = {
      monthly: { period: 'monthly', interval: 1, name: 'SalesPro Monthly', amount: 150000, currency: 'INR', description: 'Monthly Subscription' },
      semi_annual: { period: 'monthly', interval: 6, name: 'SalesPro Semi-Annual', amount: 720000, currency: 'INR', description: '6-Month Subscription' },
      yearly: { period: 'yearly', interval: 1, name: 'SalesPro Yearly', amount: 1200000, currency: 'INR', description: 'Yearly Subscription' }
    };

    const config = planConfigs[planType];
    if (!config) throw new Error('Invalid plan type');

    // Fetch existing plans to check for duplicates
    const existingPlans = await instance.plans.all();
    const found = existingPlans.items.find(p => p.item.name === config.name);
    let planId = found ? found.id : null;

    if (!planId) {
      // Create new plan if not found
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
    }

    // --- CUSTOMER MANAGEMENT ---
    let customerId = null;
    try {
      // Check if customer exists by email
      const existingCustomers = await instance.customers.all({ email: customerEmail });
      if (existingCustomers.items && existingCustomers.items.length > 0) {
        customerId = existingCustomers.items[0].id;
      } else {
        // Create new customer
        const customer = await instance.customers.create({
          name: tenantName || 'SalesPro User',
          email: customerEmail,
          contact: customerContact,
          notes: { tenant_id: tenantId }
        });
        customerId = customer.id;
      }
    } catch (custError) {
      console.error('Customer handling failed:', custError);
      throw new Error(`Failed to handle customer: ${custError.message}`);
    }

    // --- SUBSCRIPTION CREATION ---
    const totalCount = planType === 'yearly' ? 10 : 120; // 10 years or 10 years (monthly)

    const subscription = await instance.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: { tenant_id: tenantId }
    });

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({
        subscriptionId: subscription.id,
        shortUrl: subscription.short_url,
        planId: planId,
        customerId: customerId
      })
    };

  } catch (error) {
    console.error('Create Subscription Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
