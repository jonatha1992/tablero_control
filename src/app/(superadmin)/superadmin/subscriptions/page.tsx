'use client';

import { useQuery } from '@tanstack/react-query';
import { superadminApi } from '@/lib/api/superadmin';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Subscription, PlanId, SubscriptionStatus } from '@/types/domain/subscription';
import { Loader2, CheckCircle, XCircle, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { FilterPillGroup } from '@/components/ui/filter-pill-group';

const STATUS_UI: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  active:    { label: 'Activa',    icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
  pending:   { label: 'Pendiente', icon: <Clock className="h-4 w-4" />,       color: 'text-yellow-600' },
  paused:    { label: 'Pausada',   icon: <Clock className="h-4 w-4" />,       color: 'text-orange-500' },
  cancelled: { label: 'Cancelada', icon: <XCircle className="h-4 w-4" />,     color: 'text-red-600' },
  past_due:  { label: 'Vencida',   icon: <XCircle className="h-4 w-4" />,     color: 'text-red-600' },
  trialing:  { label: 'Trial',     icon: <Clock className="h-4 w-4" />,       color: 'text-blue-600' },
};

type SortColumn = 'business' | 'plan' | 'frequency' | 'amount' | 'status' | 'currentPeriodEnd';

export default function SubscriptionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sa-subscriptions'],
    queryFn: () => superadminApi.getSubscriptions(),
  });

  const subscriptions = (data?.subscriptions ?? []) as (Subscription & { business?: { name: string } })[];
  const [filterPlan, setFilterPlan] = useState<'all' | PlanId>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | SubscriptionStatus>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('business');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filtered = subscriptions.filter((s) => {
    const matchPlan = filterPlan === 'all' || s.plan === filterPlan;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchPlan && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA: string | number = '';
    let valB: string | number = '';

    switch (sortColumn) {
      case 'business':
        valA = a.business?.name ?? a.businessId;
        valB = b.business?.name ?? b.businessId;
        break;
      case 'plan':
        valA = a.plan;
        valB = b.plan;
        break;
      case 'frequency':
        valA = a.frequency;
        valB = b.frequency;
        break;
      case 'amount':
        valA = a.amount;
        valB = b.amount;
        break;
      case 'status':
        valA = a.status;
        valB = b.status;
        break;
      case 'currentPeriodEnd':
        valA = a.currentPeriodEnd ? new Date(a.currentPeriodEnd as unknown as string).getTime() : 0;
        valB = b.currentPeriodEnd ? new Date(b.currentPeriodEnd as unknown as string).getTime() : 0;
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
    <div className="p-8 space-y-6">


      <div className="flex flex-wrap items-center gap-3">
        <FilterPillGroup
          options={[
            { value: 'all', label: 'Todos los planes' },
            { value: 'free', label: 'Free' },
            { value: 'basic', label: 'Basic' },
            { value: 'pro', label: 'Pro' },
            { value: 'enterprise', label: 'Enterprise' },
          ] as const}
          value={filterPlan}
          onChange={setFilterPlan}
        />
        <FilterPillGroup
          options={[
            { value: 'all', label: 'Todos los estados' },
            { value: 'active', label: 'Activa' },
            { value: 'trialing', label: 'Trial' },
            { value: 'paused', label: 'Pausada' },
            { value: 'cancelled', label: 'Cancelada' },
            { value: 'past_due', label: 'Vencida' },
          ] as const}
          value={filterStatus}
          onChange={setFilterStatus}
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando…
        </div>
      )}

      {!isLoading && (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('business')}>
                  <span className="inline-flex items-center">Negocio {sortIcon('business')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('plan')}>
                  <span className="inline-flex items-center">Plan {sortIcon('plan')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('frequency')}>
                  <span className="inline-flex items-center">Frecuencia {sortIcon('frequency')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('amount')}>
                  <span className="inline-flex items-center">Monto {sortIcon('amount')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  <span className="inline-flex items-center">Estado {sortIcon('status')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('currentPeriodEnd')}>
                  <span className="inline-flex items-center">Vence {sortIcon('currentPeriodEnd')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((sub) => {
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
              {sorted.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin suscripciones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
