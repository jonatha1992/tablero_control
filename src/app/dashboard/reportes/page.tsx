'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Sample data ─────────────────────────────────────────────────────────────

const WEEKLY_TASKS = [
  { semana: 'S1 Mar', completadas: 8, creadas: 12, bloqueadas: 2 },
  { semana: 'S2 Mar', completadas: 11, creadas: 9, bloqueadas: 1 },
  { semana: 'S3 Mar', completadas: 14, creadas: 15, bloqueadas: 3 },
  { semana: 'S4 Mar', completadas: 9, creadas: 11, bloqueadas: 4 },
  { semana: 'S1 Abr', completadas: 13, creadas: 10, bloqueadas: 1 },
  { semana: 'S2 Abr', completadas: 7, creadas: 14, bloqueadas: 2 },
];

const VELOCITY_DATA = [
  { sprint: 'Sprint 1', puntos: 18, objetivo: 20 },
  { sprint: 'Sprint 2', puntos: 22, objetivo: 20 },
  { sprint: 'Sprint 3', puntos: 19, objetivo: 22 },
  { sprint: 'Sprint 4', puntos: 25, objetivo: 22 },
  { sprint: 'Sprint 5', puntos: 21, objetivo: 24 },
];

const STATUS_DIST = [
  { name: 'Completadas', value: 28, color: '#10b981' },
  { name: 'En progreso', value: 12, color: '#f59e0b' },
  { name: 'Por hacer', value: 15, color: '#3b82f6' },
  { name: 'Backlog', value: 9, color: '#6b7280' },
  { name: 'Bloqueadas', value: 4, color: '#ef4444' },
  { name: 'En revisión', value: 6, color: '#8b5cf6' },
];

const PRIORITY_DIST = [
  { name: 'Urgente', value: 6, color: '#ef4444' },
  { name: 'Alta', value: 18, color: '#f97316' },
  { name: 'Media', value: 32, color: '#3b82f6' },
  { name: 'Baja', value: 18, color: '#6b7280' },
];

const TEAM_WORKLOAD = [
  { miembro: 'Ana García', asignadas: 8, completadas: 6, horas: 32 },
  { miembro: 'Carlos López', asignadas: 11, completadas: 9, horas: 41 },
  { miembro: 'María Pérez', asignadas: 6, completadas: 5, horas: 24 },
  { miembro: 'Luis Torres', asignadas: 9, completadas: 8, horas: 36 },
  { miembro: 'Sofia Ruiz', asignadas: 7, completadas: 5, horas: 28 },
];

const BURNDOWN_DATA = [
  { dia: 'Día 1', ideal: 50, real: 50 },
  { dia: 'Día 2', ideal: 45, real: 47 },
  { dia: 'Día 3', ideal: 40, real: 44 },
  { dia: 'Día 4', ideal: 35, real: 38 },
  { dia: 'Día 5', ideal: 30, real: 35 },
  { dia: 'Día 6', ideal: 25, real: 29 },
  { dia: 'Día 7', ideal: 20, real: 26 },
  { dia: 'Día 8', ideal: 15, real: 20 },
  { dia: 'Día 9', ideal: 10, real: 15 },
  { dia: 'Día 10', ideal: 5, real: 10 },
];

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon: React.ReactNode;
  className?: string;
}

function KpiCard({ title, value, delta, deltaLabel, icon, className }: KpiCardProps) {
  const isPositive = delta !== undefined ? delta >= 0 : undefined;
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {delta !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs mt-1',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(delta)}% {deltaLabel ?? 'vs semana anterior'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const totalTasks = STATUS_DIST.reduce((s, d) => s + d.value, 0);
  const completedTasks = STATUS_DIST.find(d => d.name === 'Completadas')?.value ?? 0;
  const blockedTasks = STATUS_DIST.find(d => d.name === 'Bloqueadas')?.value ?? 0;
  const completionRate = Math.round((completedTasks / totalTasks) * 100);

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
          title="Tasa de Completado"
          value={`${completionRate}%`}
          delta={5}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <KpiCard
          title="Total Tareas"
          value={totalTasks}
          delta={12}
          icon={<Clock className="h-4 w-4" />}
        />
        <KpiCard
          title="Bloqueadas"
          value={blockedTasks}
          delta={-25}
          deltaLabel="vs período anterior"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          title="Velocidad promedio"
          value="21 pts"
          delta={8}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Tabs with charts */}
      <Tabs defaultValue="actividad">
        <TabsList>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
          <TabsTrigger value="distribucion">Distribución</TabsTrigger>
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
          <TabsTrigger value="sprint">Sprint</TabsTrigger>
        </TabsList>

        {/* Actividad tab */}
        <TabsContent value="actividad" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tareas por semana</CardTitle>
                <CardDescription>Creadas vs completadas vs bloqueadas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={WEEKLY_TASKS} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="creadas" name="Creadas" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="completadas" name="Completadas" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="bloqueadas" name="Bloqueadas" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Velocidad por sprint</CardTitle>
                <CardDescription>Puntos completados vs objetivo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={VELOCITY_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="sprint" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="puntos"
                      name="Puntos completados"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="objetivo"
                      name="Objetivo"
                      stroke="#e2e8f0"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribución tab */}
        <TabsContent value="distribucion" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución por estado</CardTitle>
                <CardDescription>{totalTasks} tareas en total</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={STATUS_DIST}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {STATUS_DIST.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} tareas`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {STATUS_DIST.map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-sm">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="ml-auto font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución por prioridad</CardTitle>
                <CardDescription>Carga de trabajo por urgencia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={PRIORITY_DIST}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {PRIORITY_DIST.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} tareas`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {PRIORITY_DIST.map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-sm">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="ml-auto font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Equipo tab */}
        <TabsContent value="equipo" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Carga de trabajo por miembro</CardTitle>
              <CardDescription>Tareas asignadas y completadas esta semana</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={TEAM_WORKLOAD}
                  layout="vertical"
                  margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="miembro" type="category" tick={{ fontSize: 12 }} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="asignadas" name="Asignadas" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="completadas" name="Completadas" fill="#10b981" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {TEAM_WORKLOAD.map((m) => {
              const rate = Math.round((m.completadas / m.asignadas) * 100);
              return (
                <Card key={m.miembro}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                        {m.miembro.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.miembro}</p>
                        <p className="text-xs text-muted-foreground">{m.horas}h esta semana</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tasa</span>
                        <Badge variant={rate >= 80 ? 'default' : rate >= 60 ? 'secondary' : 'destructive'}>
                          {rate}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Asignadas</span>
                        <span className="font-medium">{m.asignadas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completadas</span>
                        <span className="font-medium text-green-600">{m.completadas}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Sprint tab */}
        <TabsContent value="sprint" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Burndown Chart — Sprint 5</CardTitle>
              <CardDescription>Trabajo restante vs ideal. Sprint: 16 Abr → 30 Abr</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={BURNDOWN_DATA} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} label={{ value: 'Puntos', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 12 } }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="ideal"
                    name="Línea ideal"
                    stroke="#e2e8f0"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="real"
                    name="Trabajo real"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Puntos comprometidos', value: '50', icon: <Clock className="h-4 w-4" /> },
              { label: 'Puntos completados', value: '21', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
              { label: 'Velocidad proyectada', value: '~21 pts', icon: <TrendingUp className="h-4 w-4 text-blue-500" /> },
            ].map(({ label, value, icon }) => (
              <Card key={label}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">{icon}<span className="text-sm">{label}</span></div>
                  <p className="text-2xl font-bold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
