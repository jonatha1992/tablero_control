'use client';

import { useQuery } from '@tanstack/react-query';
import { superadminApi } from '@/lib/api/superadmin';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Subscription } from '@/types/domain/subscription';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

const STATUS_UI: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  active:    { label: 'Activa',    icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
  pending:   { label: 'Pendiente', icon: <Clock className="h-4 w-4" />,       color: 'text-yellow-600' },
  paused:    { label: 'Pausada',   icon: <Clock className="h-4 w-4" />,       color: 'text-orange-500' },
  cancelled: { label: 'Cancelada', icon: <XCircle className="h-4 w-4" />,     color: 'text-red-600' },
  past_due:  { label: 'Vencida',   icon: <XCircle className="h-4 w-4" />,     color: 'text-red-600' },
  trialing:  { label: 'Trial',     icon: <Clock className="h-4 w-4" />,       color: 'text-blue-600' },
};

export default function SubscriptionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sa-subscriptions'],
    queryFn: () => superadminApi.getSubscriptions(),
  });

  const subscriptions = (data?.subscriptions ?? []) as (Subscription & { business?: { name: string } })[];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suscripciones</h1>
        <p className="text-muted-foreground text-sm">Estado de todas las suscripciones de la plataforma.</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando…
        </div>
      )}

      {!isLoading && (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Negocio</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Frecuencia</th>
                <th className="text-left px-4 py-3 font-medium">Monto</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Vence</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscriptions.map((sub) => {
                const ui = STATUS_UI[sub.status] ?? STATUS_UI.pending;
                return (
                  <tr key={sub.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{sub.business?.name ?? sub.businessId}</td>
                    <td className="px-4 py-3 capitalize">{sub.plan}</td>
                    <td className="px-4 py-3 capitalize">{sub.frequency}</td>
                    <td className="px-4 py-3">${sub.amount.toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 ${ui.color}`}>{ui.icon}{ui.label}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd as unknown as string), 'd MMM yyyy', { locale: es }) : '—'}
                    </td>
                  </tr>
                );
              })}
              {subscriptions.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin suscripciones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
