export type PlanId = 'free' | 'basic' | 'pro' | 'enterprise';

export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'past_due'
  | 'trialing';

export type BillingFrequency = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  businessId: string;
  plan: PlanId;
  status: SubscriptionStatus;
  mpPreferenceId?: string;
  mpPayerId?: string;
  amount: number;
  currency: 'ARS';
  frequency: BillingFrequency;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  nextBillingDate?: Date;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Invoice {
  id: string;
  subscriptionId: string;
  businessId: string;
  amount: number;
  currency: 'ARS';
  status: InvoiceStatus;
  mpPaymentId?: string;
  paidAt?: Date;
  pdfUrl?: string;
  createdAt: Date;
}
