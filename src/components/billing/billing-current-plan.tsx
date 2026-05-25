'use client';

import { PLANS } from '@/lib/mercadopago/plans';
import type { Subscription } from '@/types/domain/subscription';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, Clock, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { useCancelSubscription } from '@/hooks/mutations/use-cancel-subscription';
import { useSyncSubscription } from '@/hooks/mutations/use-sync-subscription';
import { useRecoverSubscription } from '@/hooks/mutations/use-recover-subscription';

function MercadoPagoLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#009EE3" />
      <path d="M24 12c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12S30.627 12 24 12zm0 21.6c-5.302 0-9.6-4.298-9.6-9.6S18.698 14.4 24 14.4 33.6 18.698 33.6 24 29.302 33.6 24 33.6z" fill="#fff"/>
      <path d="M24 17.4c-1.38 0-2.7.48-3.78 1.32.12-.06.24-.12.36-.18a6.6 6.6 0 019.42 5.94V27a2.4 2.4 0 01-2.4 2.4h-1.2a2.4 2.4 0 01-2.4-2.4v-2.52a1.2 1.2 0 00-2.4 0V27a2.4 2.4 0 01-2.4 2.4h-1.2a2.4 2.4 0 01-2.4-2.4v-2.52a6.6 6.6 0 016.6-6.6c.72 0 1.44.12 2.1.36A6.54 6.54 0 0024 17.4z" fill="#fff"/>
    </svg>
  );
}

const STATUS_LABEL: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  active: { label: 'Activa', icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
  trialing: { label: 'Prueba', icon: <Clock className="h-4 w-4" />, color: 'text-blue-600' },
  pending: { label: 'Pendiente', icon: <Clock className="h-4 w-4" />, color: 'text-yellow-600' },
  paused: { label: 'Pausada', icon: <Clock className="h-4 w-4" />, color: 'text-orange-500' },
  cancelled: { label: 'Cancelada', icon: <XCircle className="h-4 w-4" />, color: 'text-red-600' },
  past_due: { label: 'Vencida', icon: <XCircle className="h-4 w-4" />, color: 'text-red-600' },
};

interface Props {
  subscription: Subscription | null;
  isLoading: boolean;
}

export function BillingCurrentPlan({ subscription, isLoading }: Props) {
  const cancel = useCancelSubscription(subscription?.businessId);
  const _sync = useSyncSubscription(subscription?.businessId);
  const recover = useRecoverSubscription(subscription?.businessId);
  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Cargando plan…</span>
      </div>
    );
  }

  const plan = PLANS[subscription?.plan ?? 'free'];
  const status = subscription ? STATUS_LABEL[subscription.status] : null;

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Plan actual</p>
          <h2 className="text-2xl font-bold">{plan.name}</h2>
          {subscription?.nextBillingDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Próximo cobro: {format(new Date(subscription.nextBillingDate), "d MMM yyyy", { locale: es })}
            </p>
          )}
        </div>
        {status && (
          <span className={`flex items-center gap-1.5 text-sm font-medium ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
        )}
      </div>

      <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {subscription && (subscription.status === 'active' || subscription.status === 'pending') && (
        <div className="mt-5 pt-4 border-t flex flex-col gap-3">
          {subscription.status === 'pending' && (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-4">
              <div className="flex items-center gap-3 mb-3">
                <MercadoPagoLogo className="h-8 w-8 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pago pendiente</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Tu suscripción está esperando confirmación de pago.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => recover.mutate()}
                  disabled={recover.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-[#009EE3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0087c4] transition-colors disabled:opacity-60"
                >
                  {recover.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Verificar pago
                </button>
              </div>

              {recover.isError && (
                <p className="text-xs text-red-600 mt-3">{(recover.error as Error).message}</p>
              )}

              {recover.isSuccess && (
                <div className="mt-3">
                  {(recover.data.recovered > 0 || recover.data.preapprovalActivated) ? (
                    <p className="text-sm text-green-600 font-medium">Pago verificado correctamente. Recargando…</p>
                  ) : recover.data.initPoint ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">No se encontró pago registrado.</p>
                      <a
                        href={recover.data.initPoint}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md bg-[#009EE3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0087c4] transition-colors w-fit"
                      >
                        <MercadoPagoLogo className="h-5 w-5" />
                        Ir a pagar en Mercado Pago
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No se encontraron pagos aprobados en Mercado Pago.</p>
                  )}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => {
              const msg = subscription.status === 'pending'
                ? '¿Cancelar suscripción pendiente?'
                : '¿Cancelar suscripción? El plan cambiará a Free al final del período.';
              if (!confirm(msg)) return;
              cancel.mutate(subscription.id);
            }}
            disabled={cancel.isPending}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-60"
          >
            {cancel.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Cancelar suscripción
          </button>
          {cancel.isError && (
            <p className="text-xs text-red-600 mt-1">{(cancel.error as Error).message}</p>
          )}
        </div>
      )}
    </div>
  );
}
