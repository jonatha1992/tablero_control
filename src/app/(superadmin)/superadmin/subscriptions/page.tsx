'use client';

import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
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

async function fetchSubscriptions(): Promise<Subscription[]> {
  const snap = await getDocs(query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Subscription, 'id'>) }));
}

export default function SubscriptionsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['sa-subscriptions'], queryFn: fetchSubscriptions });

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
                <th className="text-left px-4 py-3 font-medium">Business ID</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Frecuencia</th>
                <th className="text-left px-4 py-3 font-medium">Monto</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Próximo cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((sub) => {
                const ui = STATUS_UI[sub.status] ?? STATUS_UI.pending;
                const next = sub.nextBillingDate as unknown as { seconds: number } | undefined;
                return (
                  <tr key={sub.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{sub.businessId}</td>
                    <td className="px-4 py-3 capitalize">{sub.plan}</td>
                    <td className="px-4 py-3 capitalize">{sub.frequency}</td>
                    <td className="px-4 py-3">${sub.amount.toLocaleString('es-AR')}</td>
                    <td className={`px-4 py-3`}>
                      <span className={`flex items-center gap-1.5 ${ui.color}`}>{ui.icon}{ui.label}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {next ? format(new Date(next.seconds * 1000), 'd MMM yyyy', { locale: es }) : '—'}
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin suscripciones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
