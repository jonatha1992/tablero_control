'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { InvoiceStatus } from '@/types/domain/subscription';
import { useInvoicesQuery } from '@/hooks/queries/use-invoices-query';
import { useState } from 'react';

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

type SortColumn = 'createdAt' | 'amount' | 'status' | 'mpPaymentId';

export function BillingInvoices({ businessId, subscriptionId }: Props) {
  const { data: invoices = [], isLoading } = useInvoicesQuery(businessId, subscriptionId);
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando historial…</p>;
  }

  if (invoices.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay pagos registrados todavía.</p>;
  }

  const sorted = [...invoices].sort((a, b) => {
    let valA: string | number = '';
    let valB: string | number = '';

    switch (sortColumn) {
      case 'createdAt':
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
        break;
      case 'amount':
        valA = a.amount;
        valB = b.amount;
        break;
      case 'status':
        valA = a.status;
        valB = b.status;
        break;
      case 'mpPaymentId':
        valA = a.mpPaymentId ?? '';
        valB = b.mpPaymentId ?? '';
        break;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  const sortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider">
          <tr>
            <th className="text-left px-4 py-2.5 font-medium cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
              <span className="inline-flex items-center">Fecha {sortIcon('createdAt')}</span>
            </th>
            <th className="text-left px-4 py-2.5 font-medium cursor-pointer select-none" onClick={() => toggleSort('amount')}>
              <span className="inline-flex items-center">Monto {sortIcon('amount')}</span>
            </th>
            <th className="text-left px-4 py-2.5 font-medium cursor-pointer select-none" onClick={() => toggleSort('status')}>
              <span className="inline-flex items-center">Estado {sortIcon('status')}</span>
            </th>
            <th className="text-left px-4 py-2.5 font-medium cursor-pointer select-none" onClick={() => toggleSort('mpPaymentId')}>
              <span className="inline-flex items-center">ID MP {sortIcon('mpPaymentId')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((inv) => {
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
