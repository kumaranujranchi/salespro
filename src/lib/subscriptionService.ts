import { backend } from './reactive';
import { api, Id } from './api-endpoints';
import apiClient from './api';
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

export async function createRazorpaySubscription(params: CreateSubscriptionParams): Promise<{ subscription: any; shortUrl: string; keyId?: string }> {
  try {
    const data = await apiClient.post<any>('/subscriptions/create', {
      tenantId: params.tenantId,
      tenantName: params.customerName,
      customerEmail: params.customerEmail,
      customerContact: params.customerContact,
      planType: params.billingCycle,
    });

    const subscriptionObj = {
      _id: data.subscriptionId,
      id: data.subscriptionId,
      razorpay_subscription_id: data.subscriptionId,
      plan_id: data.planId,
      status: 'created',
      current_start: new Date().toISOString(),
      current_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      keyId: data.keyId,
    };

    return {
      subscription: subscriptionObj,
      shortUrl: data.shortUrl,
      keyId: data.keyId,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = true): Promise<void> {
  try {
    const subscription = await backend.query(api.subscriptions.getByRazorpayId, { 
      razorpay_subscription_id: subscriptionId 
    });

    if (!subscription) throw new Error('Subscription not found');

    await backend.mutation(api.subscriptions.updateStatus, {
      id: subscription._id,
      status: cancelAtCycleEnd ? 'active' : 'cancelled',
      ended_at: cancelAtCycleEnd ? subscription.current_end : new Date().toISOString(),
    });

    if (!cancelAtCycleEnd) {
      await backend.mutation(api.tenants.update, {
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
    const subscription = await backend.query(api.subscriptions.getByRazorpayId, { 
      razorpay_subscription_id: subscriptionId 
    });
    if (!subscription) throw new Error('Subscription not found');

    await backend.mutation(api.subscriptions.updateStatus, {
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
    const subscription = await backend.query(api.subscriptions.getByRazorpayId, { 
      razorpay_subscription_id: subscriptionId 
    });
    if (!subscription) throw new Error('Subscription not found');

    await backend.mutation(api.subscriptions.updateStatus, {
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
    const data = await backend.query(api.subscriptions.getByTenant, { 
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
    const data = await backend.query(api.tenants.listBillingHistory, { 
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
    await backend.mutation(api.subscriptions.createBillingHistory, {
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
