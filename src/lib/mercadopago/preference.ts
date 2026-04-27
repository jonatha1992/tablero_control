import { mpFetch } from './client';
import { PLANS } from './plans';
import type { BillingFrequency, PlanId } from '@/types/domain/subscription';

export interface MpPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

interface CreateArgs {
  plan: PlanId;
  frequency: BillingFrequency;
  payerEmail: string;
  businessId: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
}

export function buildExternalReference(businessId: string, plan: PlanId, frequency: BillingFrequency): string {
  return `biz:${businessId}:${plan}:${frequency}`;
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

export async function createCheckoutPreference(args: CreateArgs): Promise<MpPreference> {
  const def = PLANS[args.plan];
  const amount = args.frequency === 'monthly' ? def.priceMonthly : def.priceYearly;
  if (amount <= 0) throw new Error(`Plan ${args.plan} no es facturable`);

  const label = args.frequency === 'monthly' ? 'mensual' : 'anual';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return mpFetch<MpPreference>('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        {
          title: `Tablero de Control — Plan ${def.name} (${label})`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: amount,
        },
      ],
      payer: { email: args.payerEmail },
      external_reference: buildExternalReference(args.businessId, args.plan, args.frequency),
      back_urls: {
        success: args.successUrl,
        failure: args.failureUrl,
        pending: args.pendingUrl,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/mercadopago/webhook`,
    }),
  });
}
