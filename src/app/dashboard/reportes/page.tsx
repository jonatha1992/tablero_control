'use client';

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { format, subWeeks, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Config ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  done: '#10b981', in_progress: '#f59e0b', todo: '#3b82f6',
  backlog: '#6b7280', blocked: '#ef4444', in_review: '#8b5cf6',
};
const STATUS_LABELS: Record<string, string> = {
  done: 'Completadas', in_progress: 'En progreso', todo: 'Por hacer',
  backlog: 'Backlog', blocked: 'Bloqueadas', in_review: 'En revisión',
};
const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#6b7280',
};
const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja',
};

// ── Tooltip ──────────────────────────────────────────────────────────────────

function CustomTooltip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { dataKey: string; color: string; name: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((e) => (
        <div key={e.dataKey} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
          <span className="text-muted-foreground">{e.name}:</span>
          <span className="font-medium">{e.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title, value, sub, icon, highlight,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  highlight?: 'green' | 'red' | 'orange';
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold',
          highlight === 'green' && 'text-green-600',
          highlight === 'red' && 'text-red-500',
          highlight === 'orange' && 'text-orange-500',
        )}>
          {value}
        </div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const { data: tasks = [], isLoading: loadingTasks } = useTasksQuery();
  const { data: members = [], isLoading: loadingMembers } = useMembersQuery();
  const isLoading = loadingTasks || loadingMembers;

  // ── Métricas ────────────────────────────────────────────────────────────────

  const statusDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) counts[t.status] = (counts[t.status] ?? 0) + 1;
    return Object.entries(counts).map(([s, v]) => ({
      name: STATUS_LABELS[s] ?? s,
      value: v,
      color: STATUS_COLORS[s] ?? '#6b7280',
    }));
  }, [tasks]);

  const priorityDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) counts[t.priority] = (counts[t.priority] ?? 0) + 1;
    return ['urgent', 'high', 'medium', 'low']
      .filter((p) => counts[p])
      .map((p) => ({ name: PRIORITY_LABELS[p], value: counts[p], color: PRIORITY_COLORS[p] }));
  }, [tasks]);

  const teamWorkload = useMemo(() =>
    members
      .filter((m) => m.isActive)
      .map((m) => {
        const assigned = tasks.filter((t) => t.assigneeIds.includes(m.id));
        const completed = assigned.filter((t) => t.status === 'done');
        return {
          miembro: m.name.split(' ')[0],
          fullName: m.name,
          asignadas: assigned.length,
          completadas: completed.length,
          rate: assigned.length > 0 ? Math.round((completed.length / assigned.length) * 100) : 0,
        };
      })
      .filter((m) => m.asignadas > 0)
      .sort((a, b) => b.asignadas - a.asignadas)
      .slice(0, 8),
  [tasks, members]);

  const weeklyActivity = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const ref = subWeeks(new Date(), 5 - i);
      const start = startOfWeek(ref, { weekStartsOn: 1 });
      const end = endOfWeek(ref, { weekStartsOn: 1 });
      const inRange = (d: unknown) => {
        try { return isWithinInterval(new Date(d as string), { start, end }); } catch { return false; }
      };
      return {
        semana: format(start, 'd MMM', { locale: es }),
        completadas: tasks.filter((t) => t.status === 'done' && inRange(t.updatedAt)).length,
        creadas: tasks.filter((t) => inRange(t.createdAt)).length,
        bloqueadas: tasks.filter((t) => t.status === 'blocked' && inRange(t.updatedAt)).length,
      };
    }),
  [tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const blockedTasks = tasks.filter((t) => t.status === 'blocked').length;
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Cargando reportes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground mt-1">Métricas y análisis del equipo</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-muted p-1 gap-1">
            {(['week', 'month', 'quarter'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  period === p
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Trimestre'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Tasa de completado"
          value={`${completionRate}%`}
          sub={`${completedTasks} de ${totalTasks} tareas`}
          icon={<CheckCircle className="h-4 w-4" />}
          highlight={completionRate >= 70 ? 'green' : undefined}
        />
        <KpiCard
          title="Total tareas"
          value={totalTasks}
          sub={`${members.filter((m) => m.isActive).length} miembros activos`}
          icon={<Clock className="h-4 w-4" />}
        />
        <KpiCard
          title="Bloqueadas"
          value={blockedTasks}
          sub={blockedTasks > 0 ? 'Requieren atención' : 'Sin bloqueos'}
          icon={<AlertTriangle className="h-4 w-4" />}
          highlight={blockedTasks > 0 ? 'red' : undefined}
        />
        <KpiCard
          title="Urgentes activas"
          value={urgentTasks}
          sub={urgentTasks > 0 ? 'Prioridad máxima' : 'Todo bajo control'}
          icon={<TrendingUp className="h-4 w-4" />}
          highlight={urgentTasks > 0 ? 'orange' : undefined}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="actividad">
        <TabsList>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
          <TabsTrigger value="distribucion">Distribución</TabsTrigger>
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
        </TabsList>

        {/* Actividad */}
        <TabsContent value="actividad" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actividad semanal</CardTitle>
              <CardDescription>Tareas creadas, completadas y bloqueadas — últimas 6 semanas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyActivity} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="creadas" name="Creadas" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="completadas" name="Completadas" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="bloqueadas" name="Bloqueadas" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribución */}
        <TabsContent value="distribucion" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por estado</CardTitle>
                <CardDescription>{totalTasks} tareas en total</CardDescription>
              </CardHeader>
              <CardContent>
                {statusDist.length === 0 ? (
                  <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Sin datos</div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={statusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                          {statusDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} tareas`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {statusDist.map((d) => (
                        <div key={d.name} className="flex items-center gap-2 text-sm">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-muted-foreground truncate">{d.name}</span>
                          <span className="ml-auto font-medium">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por prioridad</CardTitle>
                <CardDescription>Distribución de urgencia</CardDescription>
              </CardHeader>
              <CardContent>
                {priorityDist.length === 0 ? (
                  <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Sin datos</div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={priorityDist}
                          cx="50%" cy="50%"
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }: { name?: string; percent?: number }) =>
                            `${name ?? ''} ${Math.round((percent ?? 0) * 100)}%`
                          }
                          labelLine={false}
                        >
                          {priorityDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} tareas`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {priorityDist.map((d) => (
                        <div key={d.name} className="flex items-center gap-2 text-sm">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-muted-foreground">{d.name}</span>
                          <span className="ml-auto font-medium">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Equipo */}
        <TabsContent value="equipo" className="space-y-4 mt-4">
          {teamWorkload.length === 0 ? (
            <Card>
              <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                No hay tareas asignadas a miembros del equipo
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Carga por miembro</CardTitle>
                  <CardDescription>Tareas asignadas y completadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(200, teamWorkload.length * 50)}>
                    <BarChart data={teamWorkload} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <YAxis dataKey="miembro" type="category" tick={{ fontSize: 12 }} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="asignadas" name="Asignadas" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="completadas" name="Completadas" fill="#10b981" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {teamWorkload.map((m) => (
                  <Card key={m.fullName}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                          {m.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.fullName}</p>
                          <p className="text-xs text-muted-foreground">{m.asignadas} tareas</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Completadas</span>
                          <Badge variant={m.rate >= 80 ? 'default' : m.rate >= 50 ? 'secondary' : 'destructive'}>
                            {m.rate}%
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asignadas</span>
                          <span className="font-medium">{m.asignadas}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Listas</span>
                          <span className="font-medium text-green-600">{m.completadas}</span>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${m.rate}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
