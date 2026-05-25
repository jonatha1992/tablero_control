import { mpFetch } from './client';
import { getEffectivePlanConfig } from './plan-config';
import type { BillingFrequency, PlanId } from '@/types/domain/subscription';

export interface MpPreapproval {
  id: string;
  status: 'pending' | 'authorized' | 'paused' | 'cancelled';
  init_point: string;
  payer_id?: number | string | null;
  payer_email?: string;
  auto_recurring?: {
    frequency: number;
    frequency_type: 'months' | 'days';
    transaction_amount: number;
    currency_id: string;
    start_date?: string;
    end_date?: string;
  };
  external_reference?: string;
}

interface CreateArgs {
  plan: PlanId;
  frequency: BillingFrequency;
  businessId: string;
  backUrl: string;
  payerEmail: string;
}

export async function createPreapproval(args: CreateArgs): Promise<MpPreapproval> {
  if (args.plan === 'free' || args.plan === 'enterprise') {
    throw new Error(`Plan ${args.plan} no es facturable vía Mercado Pago`);
  }
  const def = await getEffectivePlanConfig(args.plan);
  const amount = args.frequency === 'monthly' ? def.priceMonthly : def.priceYearly;
  if (amount <= 0) throw new Error(`Plan ${args.plan} no tiene precio configurado`);

  return mpFetch<MpPreapproval>('/preapproval', {
    method: 'POST',
    body: JSON.stringify({
      reason: `Suscripción Tablero de Control — ${def.name}`,
      external_reference: `biz:${args.businessId}:${args.plan}:${args.frequency}`,
      payer_email: args.payerEmail,
      back_url: args.backUrl,
      auto_recurring: {
        frequency: args.frequency === 'monthly' ? 1 : 12,
        frequency_type: 'months',
        transaction_amount: amount,
        currency_id: 'ARS',
      },
      status: 'pending',
    }),
  });
}

export function getPreapproval(id: string): Promise<MpPreapproval> {
  return mpFetch<MpPreapproval>(`/preapproval/${id}`);
}

export function cancelPreapproval(id: string): Promise<MpPreapproval> {
  return mpFetch<MpPreapproval>(`/preapproval/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'cancelled' }),
  });
}

const VALID_PLAN_IDS: string[] = ['free', 'basic', 'pro', 'enterprise'];
const VALID_FREQUENCIES: string[] = ['monthly', 'yearly'];

export function parseExternalReference(ref?: string): { businessId: string; plan: PlanId; frequency: BillingFrequency } | null {
  if (!ref) return null;
  const parts = ref.split(':');
  if (parts.length !== 4 || parts[0] !== 'biz') return null;
  const plan = parts[2];
  const frequency = parts[3];
  if (!VALID_PLAN_IDS.includes(plan) || !VALID_FREQUENCIES.includes(frequency)) return null;
  return {
    businessId: parts[1],
    plan: plan as PlanId,
    frequency: frequency as BillingFrequency,
  };
}
