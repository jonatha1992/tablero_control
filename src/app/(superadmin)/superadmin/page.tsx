'use client';

import { useQuery } from '@tanstack/react-query';
import { auth } from '@/lib/firebase/client';
import { Building2, Users, ListTodo, TrendingUp, Loader2 } from 'lucide-react';

interface Metrics {
  businesses: { total: number; active: number; suspended: number; trial: number };
  users: { total: number };
  tasks: { total: number };
  subscriptions: { active: number; mrr: number };
  planBreakdown: Record<string, number>;
}

async function fetchMetrics(): Promise<Metrics> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch('/api/superadmin/metrics', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Error al cargar métricas');
  return res.json() as Promise<Metrics>;
}

export default function SuperadminPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['superadmin-metrics'], queryFn: fetchMetrics, staleTime: 30000 });

  const kpis = data
    ? [
        { label: 'Negocios activos',   value: data.businesses.active,       icon: Building2,   color: 'text-blue-600' },
        { label: 'Total usuarios',      value: data.users.total,             icon: Users,       color: 'text-violet-600' },
        { label: 'Tareas creadas',      value: data.tasks.total,             icon: ListTodo,    color: 'text-orange-600' },
        { label: 'MRR (ARS)',           value: `$${data.subscriptions.mrr.toLocaleString('es-AR')}`, icon: TrendingUp, color: 'text-green-600' },
      ]
    : [];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Plataforma</h1>
        <p className="text-muted-foreground text-sm">Resumen del sistema TecnoFusión.</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando métricas…
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{(error as Error).message}</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="border rounded-xl p-5">
                <div className={`${color} mb-3`}><Icon className="h-5 w-5" /></div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-xl p-5">
              <p className="font-semibold mb-3">Estado de negocios</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Total</dt><dd className="font-medium">{data.businesses.total}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Activos</dt><dd className="font-medium text-green-600">{data.businesses.active}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Suspendidos</dt><dd className="font-medium text-red-600">{data.businesses.suspended}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">En trial</dt><dd className="font-medium text-blue-600">{data.businesses.trial}</dd></div>
              </dl>
            </div>

            <div className="border rounded-xl p-5">
              <p className="font-semibold mb-3">Distribución de planes</p>
              <dl className="space-y-2 text-sm">
                {Object.entries(data.planBreakdown).map(([plan, count]) => (
                  <div key={plan} className="flex justify-between">
                    <dt className="text-muted-foreground capitalize">{plan}</dt>
                    <dd className="font-medium">{count}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
