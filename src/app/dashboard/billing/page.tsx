'use client';

import { useAuth } from '@/hooks/auth-context';
import { BillingPlanCards } from '@/components/billing/billing-plan-cards';
import { BillingCurrentPlan } from '@/components/billing/billing-current-plan';
import { BillingInvoices } from '@/components/billing/billing-invoices';
import { useSubscriptionQuery } from '@/hooks/queries/use-subscription-query';

export default function BillingPage() {
  const { user } = useAuth();
  const { data: subscription, isLoading } = useSubscriptionQuery(user?.businessId);

  if (!user?.businessId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-1">Facturación</h1>
        <p className="text-muted-foreground text-sm">No tenés un negocio asociado.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Facturación y plan</h1>
        <p className="text-muted-foreground text-sm">Gestioná tu suscripción y revisá el historial de pagos.</p>
      </div>

      <BillingCurrentPlan subscription={subscription ?? null} isLoading={isLoading} />

      <div>
        <h2 className="text-lg font-semibold mb-4">Cambiar plan</h2>
        <BillingPlanCards currentPlan={subscription?.plan ?? 'free'} businessId={user.businessId} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Historial de pagos</h2>
        <BillingInvoices businessId={user.businessId} subscriptionId={subscription?.id} />
      </div>
    </div>
  );
}
