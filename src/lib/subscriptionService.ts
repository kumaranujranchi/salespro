import { convex } from './convex';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Subscription, BillingHistory } from '../types/database';

export const RAZORPAY_PLANS = {
  monthly: 'plan_monthly_1500',
  semi_annual: 'plan_6months_7200',
  yearly: 'plan_yearly_12000',
};

interface CreateSubscriptionParams {
  tenantId: string;
  planId: string;
  customerName: string;
  customerEmail: string;
  customerContact: string;
  billingCycle: 'monthly' | 'semi_annual' | 'yearly';
}

export async function createRazorpaySubscription(params: CreateSubscriptionParams): Promise<{ subscription: Subscription; shortUrl: string }> {
  try {
    const response = await fetch('/.netlify/functions/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: params.tenantId,
        planType: params.billingCycle,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create subscription');

    // Fetch the created subscription from Convex
    const subscription = await convex.query(api.subscriptions.getByRazorpayId, {
      razorpay_subscription_id: data.subscriptionId
    });
        
    if (!subscription) throw new Error('Failed to retrieve created subscription');

    // Update tenant with subscription details in Convex
    await convex.mutation(api.tenants.update, {
      id: params.tenantId as Id<"tenants">,
      subscription_status: 'created',
    });

    return {
      subscription: subscription as unknown as Subscription,
      shortUrl: data.shortUrl,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = true): Promise<void> {
  try {
    const subscription = await convex.query(api.subscriptions.getByRazorpayId, { 
      razorpay_subscription_id: subscriptionId 
    });

    if (!subscription) throw new Error('Subscription not found');

    await convex.mutation(api.subscriptions.updateStatus, {
      id: subscription._id,
      status: cancelAtCycleEnd ? 'active' : 'cancelled',
      ended_at: cancelAtCycleEnd ? subscription.current_end : new Date().toISOString(),
    });

    if (!cancelAtCycleEnd) {
      await convex.mutation(api.tenants.update, {
        id: subscription.tenant_id,
        subscription_status: 'cancelled',
        is_active: false,
      });
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

export async function pauseSubscription(subscriptionId: string): Promise<void> {
  try {
    const subscription = await convex.query(api.subscriptions.getByRazorpayId, { 
      razorpay_subscription_id: subscriptionId 
    });
    if (!subscription) throw new Error('Subscription not found');

    await convex.mutation(api.subscriptions.updateStatus, {
      id: subscription._id,
      status: 'paused'
    });
  } catch (error) {
    console.error('Error pausing subscription:', error);
    throw error;
  }
}

export async function resumeSubscription(subscriptionId: string): Promise<void> {
  try {
    const subscription = await convex.query(api.subscriptions.getByRazorpayId, { 
      razorpay_subscription_id: subscriptionId 
    });
    if (!subscription) throw new Error('Subscription not found');

    await convex.mutation(api.subscriptions.updateStatus, {
      id: subscription._id,
      status: 'active'
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
}

export async function getSubscription(tenantId: string): Promise<Subscription | null> {
  try {
    const data = await convex.query(api.subscriptions.getByTenant, { 
      tenant_id: tenantId as Id<"tenants"> 
    });
    return data as unknown as Subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

export async function getBillingHistory(tenantId: string): Promise<BillingHistory[]> {
  try {
    const data = await convex.query(api.tenants.listBillingHistory, { 
      tenant_id: tenantId as Id<"tenants"> 
    });
    return (data as unknown as BillingHistory[]) || [];
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return [];
  }
}

export async function recordPayment(payment: any): Promise<void> {
  try {
    await convex.mutation(api.subscriptions.createBillingHistory, {
      tenant_id: payment.tenant_id,
      amount: payment.amount,
      status: payment.status,
      razorpay_payment_id: payment.razorpay_payment_id,
      description: payment.description,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
}
