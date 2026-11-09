import { Router } from 'express';
import Razorpay from 'razorpay';
import { query } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * Retrieve active Razorpay credentials:
 * Priority 1: process.env (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET)
 * Priority 2: PostgreSQL system_settings table (key = 'razorpay_credentials')
 */
export async function getRazorpayCredentials() {
  let key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_Ty3S8PNDGbVlQR';
  let key_secret = process.env.RAZORPAY_KEY_SECRET || '7cNrXZ52X93jLzMuDMxCaLZI';

  if (key_id) key_id = String(key_id).trim();
  if (key_secret) key_secret = String(key_secret).trim();

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const res = await query(`SELECT value FROM system_settings WHERE key = 'razorpay_credentials' LIMIT 1`);
    if (res.rows[0]?.value) {
      const val = typeof res.rows[0].value === 'string' ? JSON.parse(res.rows[0].value) : res.rows[0].value;
      if (val?.key_id) key_id = String(val.key_id).trim();
      if (val?.key_secret) key_secret = String(val.key_secret).trim();
    } else {
      await query(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('razorpay_credentials', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO NOTHING
      `, [JSON.stringify({ key_id, key_secret })]);
    }
  } catch (e) {
    console.warn('System settings query note:', e.message);
  }

  return { key_id, key_secret };
}

// 1. Get Payment Gateway Configuration Status
router.get('/config', async (req, res) => {
  try {
    const { key_id, key_secret } = await getRazorpayCredentials();
    return res.json({
      configured: Boolean(key_id && key_secret),
      keyId: key_id ? `${key_id.slice(0, 8)}••••••••` : null,
      fullKeyId: key_id || null,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 2. Save Payment Gateway Credentials (Super Admin or Platform Admin)
router.post('/config', requireAuth, async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
    if (role !== 'super_admin' && role !== 'platform_admin') {
      return res.status(403).json({ error: 'Only Super Admin can configure payment gateway credentials' });
    }

    const { key_id, key_secret } = req.body;
    if (!key_id || !key_secret) {
      return res.status(400).json({ error: 'Both Razorpay Key ID and Key Secret are required' });
    }

    const cleanKeyId = String(key_id).trim();
    const cleanKeySecret = String(key_secret).trim();

    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('razorpay_credentials', $1, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
    `, [JSON.stringify({ key_id: cleanKeyId, key_secret: cleanKeySecret })]);

    process.env.RAZORPAY_KEY_ID = cleanKeyId;
    process.env.RAZORPAY_KEY_SECRET = cleanKeySecret;

    return res.json({
      success: true,
      message: 'Razorpay payment gateway configured successfully',
      keyId: `${cleanKeyId.slice(0, 8)}••••••••`
    });
  } catch (error) {
    console.error('Error saving Razorpay credentials:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. Instant Demo / Test Mode Activation for Admins
router.post('/activate-test-mode', requireAuth, async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
    if (role !== 'super_admin' && role !== 'platform_admin') {
      return res.status(403).json({ error: 'Only Super Admin can activate plan' });
    }

    const { tenantId, planTier = 'pro', billingCycle = 'monthly' } = req.body;
    const targetTenantId = tenantId || req.user?.tenant_id;
    if (!targetTenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const nextBillingDate = new Date();
    if (billingCycle === 'yearly') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else if (billingCycle === 'semi_annual') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 6);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    await query(`
      UPDATE tenants
      SET plan_tier = $1,
          subscription_status = 'active',
          billing_cycle = $2,
          next_billing_date = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [planTier, billingCycle, nextBillingDate.toISOString(), targetTenantId]);

    // Optional: insert into billing history if table exists
    try {
      await query(`
        INSERT INTO billing_history (tenant_id, amount, status, description, created_at)
        VALUES ($1, $2, 'paid', $3, CURRENT_TIMESTAMP)
      `, [targetTenantId, billingCycle === 'yearly' ? 1200000 : billingCycle === 'semi_annual' ? 720000 : 150000, `Pro Plan (${billingCycle}) - Activated in Test Mode`]);
    } catch (_) {
      // Ignore if billing_history schema differs
    }

    return res.json({
      success: true,
      message: `Pro Plan activated successfully in Test Mode!`,
      planTier,
      billingCycle,
      nextBillingDate: nextBillingDate.toISOString()
    });
  } catch (error) {
    console.error('Error activating test plan:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 4. Create Razorpay Subscription
router.post('/create', async (req, res) => {
  try {
    const { tenantId, tenantName, customerEmail, customerContact, planType } = req.body;

    const { key_id, key_secret } = await getRazorpayCredentials();

    if (!key_id || !key_secret) {
      return res.status(400).json({
        error: 'Razorpay keys are not configured. Please configure your Razorpay Key ID and Secret in Admin Settings or contact your administrator.',
        code: 'MISSING_RAZORPAY_KEYS'
      });
    }

    const instance = new Razorpay({ key_id, key_secret });

    const planConfigs = {
      monthly: { period: 'monthly', interval: 1, name: 'RealSalePro Monthly', amount: 150000, currency: 'INR', description: 'Monthly Pro Subscription' },
      semi_annual: { period: 'monthly', interval: 6, name: 'RealSalePro Semi-Annual', amount: 720000, currency: 'INR', description: '6-Month Pro Subscription' },
      yearly: { period: 'yearly', interval: 1, name: 'RealSalePro Yearly', amount: 1200000, currency: 'INR', description: 'Yearly Pro Subscription' }
    };

    const config = planConfigs[planType];
    if (!config) return res.status(400).json({ error: 'Invalid plan type' });

    // Fetch existing plans to check for duplicates
    let planId = null;
    try {
      const existingPlans = await instance.plans.all();
      const found = existingPlans?.items?.find(p => p.item?.name === config.name);
      if (found) planId = found.id;
    } catch (e) {
      console.warn('Could not query existing Razorpay plans:', e.message);
    }

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
      if (existingCustomers?.items && existingCustomers.items.length > 0) {
        customerId = existingCustomers.items[0].id;
      } else {
        const customer = await instance.customers.create({
          name: tenantName || 'RealSalePro User',
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
      customerId: customerId,
      keyId: key_id
    });
  } catch (error) {
    console.error('Create Subscription Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 5. Create Razorpay Order
router.post('/create-payment-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    const { key_id, key_secret } = await getRazorpayCredentials();
    if (!key_id || !key_secret) {
      return res.status(400).json({
        error: 'Razorpay keys are not configured.',
        code: 'MISSING_RAZORPAY_KEYS'
      });
    }

    const instance = new Razorpay({
      key_id,
      key_secret,
    });

    const order = await instance.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt,
    });

    return res.json({
      ...order,
      keyId: key_id
    });
  } catch (error) {
    console.error('Create Payment Order Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
