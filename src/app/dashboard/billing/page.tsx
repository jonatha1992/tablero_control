'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/auth-context';
import { BillingPlanCards } from '@/components/billing/billing-plan-cards';
import { BillingCurrentPlan } from '@/components/billing/billing-current-plan';
import { BillingInvoices } from '@/components/billing/billing-invoices';
import { useSubscriptionQuery } from '@/hooks/queries/use-subscription-query';
import { CheckCircle, XCircle } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const { data: subscription, isLoading } = useSubscriptionQuery(user?.businessId);
  const searchParams = useSearchParams();
  const status = searchParams.get('status') as 'success' | 'failure' | 'pending' | null;

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

      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Pago procesado. Tu suscripción se activará en minutos.
        </div>
      )}
      {status === 'failure' && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <XCircle className="h-4 w-4 shrink-0" />
          El pago no pudo procesarse. Podés intentarlo de nuevo.
        </div>
      )}
      {status === 'pending' && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Pago pendiente de acreditación. Te notificaremos cuando se confirme.
        </div>
      )}

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
