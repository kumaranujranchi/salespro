import { supabase } from './supabase';
import { Subscription, BillingHistory } from '../types/database';

// Razorpay API Configuration
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RtAvLpEfuEbGu2';
const RAZORPAY_KEY_SECRET = import.meta.env.VITE_RAZORPAY_KEY_SECRET || '';

// Plan IDs (These should be created in Razorpay Dashboard)
export const RAZORPAY_PLANS = {
  monthly: 'plan_monthly_1500', // Replace with actual Razorpay Plan ID
  semi_annual: 'plan_6months_7200', // Replace with actual Razorpay Plan ID
  yearly: 'plan_yearly_12000', // Replace with actual Razorpay Plan ID
};

interface CreateSubscriptionParams {
  tenantId: string;
  planId: string;
  customerName: string;
  customerEmail: string;
  customerContact: string;
  billingCycle: 'monthly' | 'semi_annual' | 'yearly';
}

interface RazorpaySubscriptionResponse {
  id: string;
  entity: string;
  plan_id: string;
  status: string;
  current_start: number;
  current_end: number;
  ended_at: number | null;
  quantity: number;
  notes: Record<string, any>;
  charge_at: number;
  start_at: number;
  end_at: number;
  auth_attempts: number;
  total_count: number;
  paid_count: number;
  customer_notify: number;
  created_at: number;
  expire_by: number;
  short_url: string;
  has_scheduled_changes: boolean;
  change_scheduled_at: number | null;
  remaining_count: number;
}

/**
 * Create a Razorpay subscription
 */
export async function createRazorpaySubscription(params: CreateSubscriptionParams): Promise<{ subscription: Subscription; shortUrl: string }> {
  try {
    // 1. Create or get Razorpay customer
    const customerId = await createOrGetCustomer(params.tenantId, params.customerName, params.customerEmail, params.customerContact);

    // 2. Create subscription via Razorpay API
    const razorpayPlanId = RAZORPAY_PLANS[params.billingCycle];
    
    const subscriptionData = {
      plan_id: razorpayPlanId,
      customer_id: customerId,
      quantity: 1,
      total_count: params.billingCycle === 'yearly' ? 12 : params.billingCycle === 'semi_annual' ? 6 : 0, // 0 for infinite
      customer_notify: 1,
      notes: {
        tenant_id: params.tenantId,
        billing_cycle: params.billingCycle,
      },
    };

    // In production, this should be called from backend
    // For now, we'll create a mock subscription record
    const mockRazorpayResponse: RazorpaySubscriptionResponse = {
      id: `sub_${Date.now()}`,
      entity: 'subscription',
      plan_id: razorpayPlanId,
      status: 'created',
      current_start: Math.floor(Date.now() / 1000),
      current_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      ended_at: null,
      quantity: 1,
      notes: subscriptionData.notes,
      charge_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      start_at: Math.floor(Date.now() / 1000),
      end_at: 0,
      auth_attempts: 0,
      total_count: subscriptionData.total_count,
      paid_count: 0,
      customer_notify: 1,
      created_at: Math.floor(Date.now() / 1000),
      expire_by: 0,
      short_url: `https://rzp.io/i/${Date.now()}`,
      has_scheduled_changes: false,
      change_scheduled_at: null,
      remaining_count: subscriptionData.total_count,
    };

    // 3. Save subscription to database
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: params.tenantId,
        razorpay_subscription_id: mockRazorpayResponse.id,
        razorpay_plan_id: razorpayPlanId,
        status: mockRazorpayResponse.status,
        current_start: new Date(mockRazorpayResponse.current_start * 1000).toISOString(),
        current_end: new Date(mockRazorpayResponse.current_end * 1000).toISOString(),
        charge_at: new Date(mockRazorpayResponse.charge_at * 1000).toISOString(),
        start_at: new Date(mockRazorpayResponse.start_at * 1000).toISOString(),
        auth_attempts: mockRazorpayResponse.auth_attempts,
        total_count: mockRazorpayResponse.total_count,
        paid_count: mockRazorpayResponse.paid_count,
        remaining_count: mockRazorpayResponse.remaining_count,
        short_url: mockRazorpayResponse.short_url,
        customer_notify: true,
        quantity: mockRazorpayResponse.quantity,
        notes: mockRazorpayResponse.notes,
      })
      .select()
      .single();

    if (error) throw error;

    // 4. Update tenant with subscription details
    await supabase
      .from('tenants')
      .update({
        subscription_id: subscription.id,
        razorpay_customer_id: customerId,
        billing_cycle: params.billingCycle,
        subscription_status: 'created',
        next_billing_date: subscription.current_end,
      })
      .eq('id', params.tenantId);

    return {
      subscription: subscription as Subscription,
      shortUrl: mockRazorpayResponse.short_url,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Create or get Razorpay customer
 */
async function createOrGetCustomer(tenantId: string, name: string, email: string, contact: string): Promise<string> {
  // Check if customer already exists
  const { data: tenant } = await supabase
    .from('tenants')
    .select('razorpay_customer_id')
    .eq('id', tenantId)
    .single();

  if (tenant?.razorpay_customer_id) {
    return tenant.razorpay_customer_id;
  }

  // Create new customer (mock for now)
  const customerId = `cust_${Date.now()}`;

  // In production, call Razorpay API to create customer
  // const response = await fetch('https://api.razorpay.com/v1/customers', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Basic ${btoa(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET)}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ name, email, contact }),
  // });

  return customerId;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = true): Promise<void> {
  try {
    // 1. Get subscription from database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) throw new Error('Subscription not found');

    // 2. Cancel via Razorpay API (mock for now)
    // In production: POST https://api.razorpay.com/v1/subscriptions/{subscription_id}/cancel

    // 3. Update database
    await supabase
      .from('subscriptions')
      .update({
        status: cancelAtCycleEnd ? 'active' : 'cancelled', // Keep active until cycle end
        ended_at: cancelAtCycleEnd ? subscription.current_end : new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    // 4. Update tenant
    if (!cancelAtCycleEnd) {
      await supabase
        .from('tenants')
        .update({
          subscription_status: 'cancelled',
          is_active: false,
        })
        .eq('subscription_id', subscriptionId);
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(subscriptionId: string): Promise<void> {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) throw new Error('Subscription not found');

    // Pause via Razorpay API (mock)
    // POST https://api.razorpay.com/v1/subscriptions/{subscription_id}/pause

    await supabase
      .from('subscriptions')
      .update({ status: 'paused' })
      .eq('id', subscriptionId);
  } catch (error) {
    console.error('Error pausing subscription:', error);
    throw error;
  }
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<void> {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) throw new Error('Subscription not found');

    // Resume via Razorpay API (mock)
    // POST https://api.razorpay.com/v1/subscriptions/{subscription_id}/resume

    await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('id', subscriptionId);
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(tenantId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data as Subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Get billing history
 */
export async function getBillingHistory(tenantId: string, limit: number = 10): Promise<BillingHistory[]> {
  try {
    const { data, error } = await supabase
      .from('billing_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as BillingHistory[]) || [];
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return [];
  }
}

/**
 * Record a payment in billing history
 */
export async function recordPayment(payment: Partial<BillingHistory>): Promise<void> {
  try {
    await supabase.from('billing_history').insert(payment);
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
}
