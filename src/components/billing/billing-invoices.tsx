'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import type { InvoiceStatus } from '@/types/domain/subscription';
import { useInvoicesQuery } from '@/hooks/queries/use-invoices-query';

const STATUS_UI: Record<InvoiceStatus, { label: string; icon: React.ReactNode; color: string }> = {
  paid:     { label: 'Pagado',    icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
  pending:  { label: 'Pendiente', icon: <Clock className="h-4 w-4" />,       color: 'text-yellow-600' },
  failed:   { label: 'Fallido',   icon: <XCircle className="h-4 w-4" />,     color: 'text-red-600' },
  refunded: { label: 'Reembolso', icon: <CheckCircle className="h-4 w-4" />, color: 'text-blue-600' },
};

interface Props {
  businessId: string;
  subscriptionId?: string;
}

export function BillingInvoices({ businessId, subscriptionId }: Props) {
  const { data: invoices = [], isLoading } = useInvoicesQuery(businessId, subscriptionId);

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
            return (
              <tr key={inv.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  {format(new Date(inv.createdAt), 'd MMM yyyy', { locale: es })}
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
