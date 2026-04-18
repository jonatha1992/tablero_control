import { mpFetch } from './client';
import { PLANS } from './plans';
import type { BillingFrequency, PlanId } from '@/types/domain/subscription';

export interface MpPreapproval {
  id: string;
  status: 'pending' | 'authorized' | 'paused' | 'cancelled';
  init_point: string;
  payer_id?: string;
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
  payerEmail: string;
  businessId: string;
  backUrl: string;
}

export async function createPreapproval(args: CreateArgs): Promise<MpPreapproval> {
  const def = PLANS[args.plan];
  const amount = args.frequency === 'monthly' ? def.priceMonthly : def.priceYearly;
  if (amount <= 0) throw new Error(`Plan ${args.plan} no es facturable vía Mercado Pago`);

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

export function parseExternalReference(ref?: string): { businessId: string; plan: PlanId; frequency: BillingFrequency } | null {
  if (!ref) return null;
  const parts = ref.split(':');
  if (parts.length !== 4 || parts[0] !== 'biz') return null;
  return {
    businessId: parts[1],
    plan: parts[2] as PlanId,
    frequency: parts[3] as BillingFrequency,
  };
}
