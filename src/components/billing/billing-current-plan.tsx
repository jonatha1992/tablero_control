'use client';

import { PLANS } from '@/lib/mercadopago/plans';
import type { Subscription } from '@/types/domain/subscription';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

const STATUS_LABEL: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  active:    { label: 'Activa',    icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
  trialing:  { label: 'Prueba',    icon: <Clock className="h-4 w-4" />,        color: 'text-blue-600' },
  pending:   { label: 'Pendiente', icon: <Clock className="h-4 w-4" />,        color: 'text-yellow-600' },
  paused:    { label: 'Pausada',   icon: <Clock className="h-4 w-4" />,        color: 'text-orange-500' },
  cancelled: { label: 'Cancelada', icon: <XCircle className="h-4 w-4" />,      color: 'text-red-600' },
  past_due:  { label: 'Vencida',   icon: <XCircle className="h-4 w-4" />,      color: 'text-red-600' },
};

interface Props {
  subscription: Subscription | null;
  isLoading: boolean;
}

export function BillingCurrentPlan({ subscription, isLoading }: Props) {
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
    </div>
  );
}
