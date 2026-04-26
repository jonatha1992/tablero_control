'use client';

import { useState } from 'react';
import { PLANS } from '@/lib/mercadopago/plans';
import { cn } from '@/lib/utils';
import type { PlanId, BillingFrequency } from '@/types/domain/subscription';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { billingApi } from '@/lib/api/billing';


interface Props {
  currentPlan: PlanId;
  businessId: string;
}

export function BillingPlanCards({ currentPlan, businessId }: Props) {
  const [frequency, setFrequency] = useState<BillingFrequency>('monthly');
  const [loading, setLoading] = useState<PlanId | null>(null);

  async function handleUpgrade(plan: PlanId) {
    if (plan === 'free' || plan === currentPlan) return;
    if (plan === 'enterprise') {
      window.open('mailto:ventas@tecnofusion.io?subject=Enterprise', '_blank');
      return;
    }
    setLoading(plan);
    try {
      const { initPoint } = await billingApi.createPreapproval(plan, frequency, businessId);
      window.location.href = initPoint;
    } catch (err) {
      alert(`Error al iniciar el pago: ${(err as Error).message}`);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.values(PLANS) as typeof PLANS[PlanId][]).map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const price = frequency === 'monthly' ? plan.priceMonthly : plan.priceYearly;
          const isLoading = loading === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                'border rounded-xl p-5 flex flex-col gap-4 relative',
                plan.highlight && 'border-primary shadow-md',
                isCurrent && 'bg-muted/40'
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Recomendado
                </span>
              )}
              <div>
                <p className="font-semibold text-base">{plan.name}</p>
                {price > 0 ? (
                  <p className="text-2xl font-bold mt-1">
                    ${price.toLocaleString('es-AR')}
                    <span className="text-sm font-normal text-muted-foreground">/{frequency === 'monthly' ? 'mes' : 'año'}</span>
                  </p>
                ) : price === 0 ? (
                  <p className="text-2xl font-bold mt-1">Gratis</p>
                ) : (
                  <p className="text-base font-medium mt-1 text-muted-foreground">A convenir</p>
                )}
              </div>

              <ul className="flex-1 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

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
          );
        })}
      </div>
    </div>
  );
}
