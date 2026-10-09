import { Router } from 'express';
import Razorpay from 'razorpay';

const router = Router();

// Create Razorpay Subscription
router.post('/create', async (req, res) => {
  try {
    const { tenantId, tenantName, customerEmail, customerContact, planType } = req.body;

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({ error: 'Server configuration error: Missing Razorpay keys' });
    }

    const instance = new Razorpay({ key_id, key_secret });

    const planConfigs = {
      monthly: { period: 'monthly', interval: 1, name: 'SalesPro Monthly', amount: 150000, currency: 'INR', description: 'Monthly Subscription' },
      semi_annual: { period: 'monthly', interval: 6, name: 'SalesPro Semi-Annual', amount: 720000, currency: 'INR', description: '6-Month Subscription' },
      yearly: { period: 'yearly', interval: 1, name: 'SalesPro Yearly', amount: 1200000, currency: 'INR', description: 'Yearly Subscription' }
    };

    const config = planConfigs[planType];
    if (!config) return res.status(400).json({ error: 'Invalid plan type' });

    // Fetch existing plans to check for duplicates
    const existingPlans = await instance.plans.all();
    const found = existingPlans.items.find(p => p.item.name === config.name);
    let planId = found ? found.id : null;

    if (!planId) {
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

    let customerId = null;
    try {
      const existingCustomers = await instance.customers.all({ email: customerEmail });
      if (existingCustomers.items && existingCustomers.items.length > 0) {
        customerId = existingCustomers.items[0].id;
      } else {
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
    }

    const totalCount = planType === 'yearly' ? 10 : 120;
    const subscription = await instance.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: { tenant_id: tenantId }
    });

    return res.json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
      planId: planId,
      customerId: customerId
    });
  } catch (error) {
    console.error('Create Subscription Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Create Razorpay Order
router.post('/create-payment-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt,
    });

    return res.json(order);
  } catch (error) {
    console.error('Create Payment Order Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
