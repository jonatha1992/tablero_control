'use client';

import { useQuery } from '@tanstack/react-query';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Invoice, InvoiceStatus } from '@/types/domain/subscription';

const STATUS_UI: Record<InvoiceStatus, { label: string; icon: React.ReactNode; color: string }> = {
  paid:     { label: 'Pagado',    icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
  pending:  { label: 'Pendiente', icon: <Clock className="h-4 w-4" />,       color: 'text-yellow-600' },
  failed:   { label: 'Fallido',   icon: <XCircle className="h-4 w-4" />,     color: 'text-red-600' },
  refunded: { label: 'Reembolso', icon: <CheckCircle className="h-4 w-4" />, color: 'text-blue-600' },
};

async function fetchInvoices(subscriptionId: string): Promise<Invoice[]> {
  const q = query(
    collection(db, 'subscriptions', subscriptionId, 'invoices'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Invoice, 'id'>) }));
}

interface Props {
  businessId: string;
  subscriptionId?: string;
}

export function BillingInvoices({ businessId, subscriptionId }: Props) {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', subscriptionId],
    queryFn: () => fetchInvoices(subscriptionId!),
    enabled: Boolean(subscriptionId),
  });

  if (!subscriptionId) {
    return <p className="text-sm text-muted-foreground">Sin suscripción activa.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando historial…</p>;
  }

  if (invoices.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay pagos registrados todavía.</p>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-2.5 font-medium">Fecha</th>
            <th className="text-left px-4 py-2.5 font-medium">Monto</th>
            <th className="text-left px-4 py-2.5 font-medium">Estado</th>
            <th className="text-left px-4 py-2.5 font-medium">ID MP</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {invoices.map((inv) => {
            const ui = STATUS_UI[inv.status] ?? STATUS_UI.pending;
            const ts = inv.createdAt as unknown as { seconds: number };
            return (
              <tr key={inv.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  {format(new Date(ts.seconds * 1000), 'd MMM yyyy', { locale: es })}
                </td>
                <td className="px-4 py-3 font-medium">
                  ${inv.amount.toLocaleString('es-AR')} ARS
                </td>
                <td className={`px-4 py-3 flex items-center gap-1.5 ${ui.color}`}>
                  {ui.icon}{ui.label}
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                  {inv.mpPaymentId ?? '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
