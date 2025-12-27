import { supabase } from './supabase';
import { Subscription, BillingHistory } from '../types/database';

// Razorpay API Configuration (for future backend implementation)
// const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RtAvLpEfuEbGu2';
// const RAZORPAY_KEY_SECRET = import.meta.env.VITE_RAZORPAY_KEY_SECRET || '';

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



/**
 * Create a Razorpay subscription
 */
/**
 * Create a Razorpay subscription (Live via Netlify Function)
 */
export async function createRazorpaySubscription(params: CreateSubscriptionParams): Promise<{ subscription: Subscription; shortUrl: string }> {
  try {
    // Get current session for auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) throw new Error('Not authenticated');

    const response = await fetch('/.netlify/functions/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        tenantId: params.tenantId,
        planType: params.billingCycle,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
    }

    // The edge function already creates the DB record, so we just return the needed details
    // We might need to fetch the full subscription object if the UI expects it immediately
    // For now, returning minimal needed or fetching fresh
    
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('razorpay_subscription_id', data.subscriptionId)
        .single();
        
    if (!subscription) throw new Error('Failed to retrieve created subscription');

     // Update tenant with subscription details locally to reflect immediate change in UI if needed
     // Ideally webhook handles this, but for 'created' state:
    await supabase
      .from('tenants')
      .update({
        subscription_id: subscription.id,
        subscription_status: 'created', // It's created, not active yet until payment
      })
      .eq('id', params.tenantId);

    return {
      subscription: subscription as Subscription,
      shortUrl: data.shortUrl,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
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
