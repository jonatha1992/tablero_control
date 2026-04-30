'use client';

import { useQuery } from '@tanstack/react-query';
import { auth } from '@/lib/firebase/client';
import { Building2, Users, ListTodo, TrendingUp, Loader2 } from 'lucide-react';

interface Metrics {
  businesses: { 
    total: number; 
    active: number; 
    suspended: number; 
    trial: number;
    recent: Array<{ id: string; name: string; plan: string; status: string; createdAt: string }>;
  };
  users: { 
    total: number;
    recent: Array<{ id: string; name: string; email: string; createdAt: string; business?: { name: string } }>;
  };
  tasks: { total: number };
  subscriptions: { active: number; mrr: number };
  planBreakdown: Record<string, number>;
  activity: Array<{
    id: string;
    action: string;
    createdAt: string;
    actor: { name: string };
    business?: { name: string };
  }>;
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


      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando visión global…
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{(error as Error).message}</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="border rounded-xl p-5 bg-card">
                <div className={`${color} mb-3`}><Icon className="h-5 w-5" /></div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ESTADO DE NEGOCIOS */}
            <div className="space-y-4">
              <div className="border rounded-xl p-5 bg-card">
                <p className="font-semibold mb-3">Estado de negocios</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Total</dt><dd className="font-medium">{data.businesses.total}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Activos</dt><dd className="font-medium text-green-600">{data.businesses.active}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Suspendidos</dt><dd className="font-medium text-red-600">{data.businesses.suspended}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">En trial</dt><dd className="font-medium text-blue-600">{data.businesses.trial}</dd></div>
                </dl>
              </div>

              <div className="border rounded-xl p-5 bg-card">
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

            {/* RECIENTES */}
            <div className="md:col-span-2 space-y-6">
              <div className="border rounded-xl overflow-hidden bg-card">
                <div className="px-5 py-4 border-b">
                  <p className="font-semibold">Negocios Recientes</p>
                </div>
                <div className="divide-y text-sm">
                  {data.businesses.recent.map((b) => (
                    <div key={b.id} className="px-5 py-3 flex justify-between items-center hover:bg-muted/30">
                      <div>
                        <p className="font-medium">{b.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{b.plan} • {b.status}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(b.createdAt).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden bg-card">
                <div className="px-5 py-4 border-b">
                  <p className="font-semibold">Últimos Usuarios</p>
                </div>
                <div className="divide-y text-sm">
                  {data.users.recent.map((u) => (
                    <div key={u.id} className="px-5 py-3 flex justify-between items-center hover:bg-muted/30">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email} {u.business ? `• ${u.business.name}` : ''}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden bg-card">
                <div className="px-5 py-4 border-b bg-muted/20">
                  <p className="font-semibold text-primary">Auditoría del Sistema (Todo)</p>
                </div>
                <div className="divide-y text-xs">
                  {data.activity.length > 0 ? (
                    data.activity.map((log) => (
                      <div key={log.id} className="px-5 py-3 flex gap-4 items-start hover:bg-muted/30">
                        <div className="w-24 shrink-0 text-muted-foreground">
                          {new Date(log.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex-1">
                          <p><span className="font-medium">{log.actor.name}</span> <span className="text-muted-foreground">{log.action}</span></p>
                          {log.business && <p className="text-[10px] text-muted-foreground">Negocio: {log.business.name}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-8 text-center text-muted-foreground italic">No hay actividad reciente registrada</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
