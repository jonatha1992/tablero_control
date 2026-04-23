'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { 
  format, subDays, startOfDay, endOfDay, isBefore, isAfter, 
  eachDayOfInterval, subWeeks, startOfWeek, endOfWeek, isWithinInterval 
} from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_COLORS: Record<string, string> = {
  done: '#10b981', in_progress: '#f59e0b', todo: '#3b82f6',
  backlog: '#6b7280', blocked: '#ef4444', in_review: '#8b5cf6',
};
const STATUS_LABELS: Record<string, string> = {
  done: 'Completadas', in_progress: 'En progreso', todo: 'Por hacer',
  backlog: 'Backlog', blocked: 'Bloqueadas', in_review: 'En revisión',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((e: any) => (
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
  const { data: tasks = [] } = useTasksQuery();

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

    const totalTasks = tasks.length;
    
    return days.map((day, index) => {
      const dayEnd = endOfDay(day);
      
      // Tareas que NO estaban terminadas al final de este día
      // Una tarea se considera "restante" si:
      // - No está en estado 'done' 
      // - O si está en estado 'done' pero se completó DESPUÉS del final de este día
      const remaining = tasks.filter(t => {
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

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      {/* Burndown Chart */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Burndown (7d)</CardTitle>
          <CardDescription className="text-xs">Trabajo restante vs ideal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="dia" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="restante" 
                  name="Pendientes" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: "#3b82f6" }}
                />
                <Line 
                  type="dashed" 
                  dataKey="ideal" 
                  name="Ideal" 
                  stroke="#94a3b8" 
                  strokeDasharray="4 4" 
                  strokeWidth={1}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Productividad Trend */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Tendencia</CardTitle>
          <CardDescription className="text-xs">Resolución semanal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="semana" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="completadas" 
                  name="Completadas" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorComp)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Estado de Tareas (Pie) */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Distribución</CardTitle>
          <CardDescription className="text-xs">Estado actual global</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={statusDist} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={40} 
                  outerRadius={65} 
                  paddingAngle={4} 
                  dataKey="value"
                >
                  {statusDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Tareas']} />
                <Legend 
                  layout="horizontal" 
                  align="center" 
                  verticalAlign="bottom" 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
