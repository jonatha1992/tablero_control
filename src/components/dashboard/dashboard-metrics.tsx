'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useActiveTasksQuery } from '@/hooks/queries/use-active-tasks-query';
import { 
  format, subDays, endOfDay, isAfter, 
  eachDayOfInterval, subWeeks, startOfWeek, endOfWeek, isWithinInterval 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { isCommittedByEndOfDay } from '@/lib/tasks/task-status';

const STATUS_COLORS: Record<string, string> = {
  done: '#10b981', in_progress: '#f59e0b', todo: '#3b82f6',
  backlog: '#6b7280', blocked: '#ef4444', in_review: '#8b5cf6',
};
const STATUS_LABELS: Record<string, string> = {
  done: 'Completadas', in_progress: 'En progreso', todo: 'Por hacer',
  backlog: 'Backlog', blocked: 'Bloqueadas', in_review: 'En revisión',
};

interface TooltipPayloadItem {
  dataKey: string;
  name: string;
  value: number;
  color?: string;
  fill?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((e) => (
        <div key={e.dataKey} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color || e.fill }} />
          <span className="text-muted-foreground">{e.name}:</span>
          <span className="font-medium">{e.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardMetrics() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const r = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const { data: tasks = [] } = useActiveTasksQuery();

  // 1. Distribución por Estado (Pie)
  const statusDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) counts[t.status] = (counts[t.status] ?? 0) + 1;
    return Object.entries(counts).map(([s, v]) => ({
      name: STATUS_LABELS[s] ?? s,
      value: v,
      color: STATUS_COLORS[s] ?? '#6b7280',
    }));
  }, [tasks]);

  // 2. Burndown Chart (Last 7 days)
  const burndownData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    const totalTasks = tasks.filter((t) => isCommittedByEndOfDay(t, new Date())).length;
    
    return days.map((day, index) => {
      const dayEnd = endOfDay(day);
      
      // Tareas que NO estaban terminadas al final de este día
      // Una tarea se considera "restante" si:
      // - No está en estado 'done' 
      // - O si está en estado 'done' pero se completó DESPUÉS del final de este día
      const remaining = tasks.filter(t => {
        if (!isCommittedByEndOfDay(t, day)) return false;
        if (t.status !== 'done') return true;
        const completedDate = new Date(t.updatedAt || t.createdAt);
        return isAfter(completedDate, dayEnd);
      }).length;

      // Línea ideal (distribución lineal de total a 0 en el periodo)
      const ideal = Math.max(0, totalTasks - (totalTasks / 6) * index);

      return {
        dia: format(day, 'EEE d', { locale: es }),
        restante: remaining,
        ideal: parseFloat(ideal.toFixed(1)),
      };
    });
  }, [tasks]);

  // 3. Tendencia de Productividad (Area)
  const trendData = useMemo(() => {
    const weeks = Array.from({ length: 6 }, (_, i) => {
      const ref = subWeeks(new Date(), 5 - i);
      const start = startOfWeek(ref, { weekStartsOn: 1 });
      const end = endOfWeek(ref, { weekStartsOn: 1 });
      
      const completed = tasks.filter(t => 
        t.status === 'done' && 
        isWithinInterval(new Date(t.updatedAt), { start, end })
      ).length;

      return {
        semana: format(start, 'd MMM', { locale: es }),
        completadas: completed,
      };
    });
    return weeks;
  }, [tasks]);

  if (!isMounted) return <div className="h-[200px] w-full bg-slate-50/50 animate-pulse rounded-xl" />;

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      {/* Burndown Chart */}
      <Card className="shadow-sm border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Burndown (7d)</CardTitle>
          <CardDescription className="text-xs">Trabajo restante vs ideal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
              <LineChart data={burndownData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="dia" fontSize={10} tickLine={false} axisLine={false} tick={{fill: 'currentColor', opacity: 0.5}} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: 'currentColor', opacity: 0.5}} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="restante" 
                  name="Pendientes" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ideal" 
                  name="Ideal" 
                  stroke="#94a3b8" 
                  strokeDasharray="5 5" 
                  strokeWidth={1.5}
                  dot={false}
                  opacity={0.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Productividad Trend */}
      <Card className="shadow-sm border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tendencia</CardTitle>
          <CardDescription className="text-xs">Resolución semanal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="semana" fontSize={10} tickLine={false} axisLine={false} tick={{fill: 'currentColor', opacity: 0.5}} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: 'currentColor', opacity: 0.5}} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="completadas" 
                  name="Completadas" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorComp)" 
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Estado de Tareas (Pie) */}
      <Card className="shadow-sm border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Distribución</CardTitle>
          <CardDescription className="text-xs">Estado actual global</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full min-h-[200px] flex items-center">
            <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
              <PieChart>
                <Pie 
                  data={statusDist} 
                  cx="50%" 
                  cy="45%" 
                  innerRadius={50} 
                  outerRadius={75} 
                  paddingAngle={5} 
                  dataKey="value"
                  stroke="none"
                >
                  {statusDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Tareas']} />
                <Legend 
                  layout="horizontal" 
                  align="center" 
                  verticalAlign="bottom" 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
