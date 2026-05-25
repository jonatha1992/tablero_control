'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PLANS } from '@/lib/mercadopago/plans';
import { cn } from '@/lib/utils';
import type { PlanId, BillingFrequency } from '@/types/domain/subscription';
import type { PlanDefinition } from '@/lib/mercadopago/plans';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { billingApi } from '@/lib/api/billing';


interface Props {
  currentPlan: PlanId;
  businessId: string;
}

export function BillingPlanCards({ currentPlan, businessId }: Props) {
  const [frequency, setFrequency] = useState<BillingFrequency>('monthly');
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => billingApi.getPlans(),
    staleTime: 5 * 60 * 1000,
  });
  const plans: PlanDefinition[] = plansData?.plans ?? (Object.values(PLANS) as PlanDefinition[]);

  async function handleUpgrade(plan: PlanId) {
    if (plan === 'free' || plan === currentPlan) return;
    setPaymentError(null);
    if (plan === 'enterprise') {
      window.open('mailto:ventas@tecnofusion.io?subject=Enterprise', '_blank');
      return;
    }
    setLoading(plan);
    try {
      const { initPoint } = await billingApi.createCheckout(plan, frequency, businessId);
      window.location.href = initPoint;
    } catch (err) {
      setPaymentError(`Error al iniciar el pago: ${(err as Error).message}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => setFrequency('monthly')}
          className={cn('px-3 py-1 rounded-full border text-sm', frequency === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
        >
          Mensual
        </button>
        <button
          onClick={() => setFrequency('yearly')}
          className={cn('px-3 py-1 rounded-full border text-sm', frequency === 'yearly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
        >
          Anual <span className="text-green-600 font-medium">-17%</span>
        </button>
      </div>

      {paymentError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {paymentError}
        </p>
      )}

      <div className="border rounded-xl overflow-hidden divide-y">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const price = frequency === 'monthly' ? plan.priceMonthly : plan.priceYearly;
          const isLoading = loading === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                'flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-5 py-4',
                plan.highlight && 'bg-primary/5',
                isCurrent && 'bg-primary/5'
              )}
            >
              <div className="sm:w-32 shrink-0 flex items-center gap-2">
                <p className="font-semibold text-base">{plan.name}</p>
                {plan.highlight && (
                  <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                  </span>
                )}
                {isCurrent && (
                  <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full">Actual</span>
                )}
              </div>

              <div className="sm:w-36 shrink-0">
                {price > 0 ? (
                  <p className="text-lg font-bold">
                    ${price.toLocaleString('es-AR')}
                    <span className="text-xs font-normal text-muted-foreground">/{frequency === 'monthly' ? 'mes' : 'año'}</span>
                  </p>
                ) : price === 0 ? (
                  <p className="text-lg font-bold">Gratis</p>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">A convenir</p>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {plan.features.map((f) => (
                    <span key={f} className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                      <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="sm:w-40 shrink-0">
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || isLoading || plan.id === 'free'}
                  className={cn(
                    'w-full py-2 rounded-lg text-sm font-medium transition-colors',
                    isCurrent
                      ? 'bg-muted text-muted-foreground cursor-default'
                      : plan.highlight
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border hover:bg-muted',
                    'disabled:opacity-60 disabled:cursor-not-allowed'
                  )}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Redirigiendo…</span>
                  ) : isCurrent ? 'Plan actual' : plan.id === 'enterprise' ? 'Contactar ventas' : `Elegir ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
