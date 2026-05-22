import { mpFetch } from './client';
import { PLANS } from './plans';
import { getEffectivePlanConfig } from './plan-config';
import type { BillingFrequency, PlanId } from '@/types/domain/subscription';

export interface MpPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

interface CreateArgs {
  plan: PlanId;
  frequency: BillingFrequency;
  businessId: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl?: string;
}

export function buildExternalReference(businessId: string, plan: PlanId, frequency: BillingFrequency): string {
  return `biz:${businessId}:${plan}:${frequency}`;
}

export { parseExternalReference } from './preapproval';

export async function createCheckoutPreference(args: CreateArgs): Promise<MpPreference> {
  if (args.plan === 'free' || args.plan === 'enterprise') {
    throw new Error(`Plan ${args.plan} no es facturable`);
  }
  const def = await getEffectivePlanConfig(args.plan);
  const amount = args.frequency === 'monthly' ? def.priceMonthly : def.priceYearly;
  if (amount <= 0) throw new Error(`Plan ${args.plan} no tiene precio configurado`);

  const label = args.frequency === 'monthly' ? 'mensual' : 'anual';
  const webhookBase = process.env.MP_WEBHOOK_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const notificationUrl = args.notificationUrl ?? `${webhookBase}/api/mercadopago/webhook`;

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
      external_reference: buildExternalReference(args.businessId, args.plan, args.frequency),
      back_urls: {
        success: args.successUrl,
        failure: args.failureUrl,
        pending: args.pendingUrl,
      },
      auto_return: 'approved',
      notification_url: notificationUrl,
    }),
  });
}
