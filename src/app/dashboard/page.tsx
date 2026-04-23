'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { AlertCircle, CheckCircle2, Clock, Zap, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { data: tasks = [], isLoading } = useTasksQuery();

  const metrics = {
    active: tasks.filter((t) => t.status !== 'done').length,
    done: tasks.filter((t) => t.status === 'done').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    urgent: tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length,
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Negocio</h1>
          <p className="text-muted-foreground">Resumen global de rendimiento y métricas operativas.</p>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="h-12 w-12 text-blue-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{isLoading ? '—' : metrics.active}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Tareas activas en el tablero
            </p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Finalizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{isLoading ? '—' : metrics.done}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              Total completado históricamente
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Críticas / Bloqueadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{isLoading ? '—' : metrics.blocked}</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren atención inmediata</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="h-12 w-12 text-orange-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{isLoading ? '—' : metrics.urgent}</div>
            <p className="text-xs text-muted-foreground mt-1">Alta prioridad pendiente</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Análisis de Operaciones
        </h2>
        <DashboardMetrics />
      </div>
    </div>
  );
}
