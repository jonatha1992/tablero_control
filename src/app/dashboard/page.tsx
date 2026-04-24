'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { AlertCircle, CheckCircle2, Clock, Zap, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { data: tasks = [], isLoading } = useTasksQuery();

  // Detect context (Global vs Business)
  const isGlobal = tasks.length > 0 && tasks.some(t => t.businessId !== tasks[0].businessId);

  const metrics = {
    active: tasks.filter((t) => t.status !== 'done').length,
    done: tasks.filter((t) => t.status === 'done').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    urgent: tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length,
  };

  // Group by project for "Report" feel
  const projectStats = tasks.reduce((acc, task) => {
    const name = task.project?.name || 'Sin Proyecto';
    if (!acc[name]) acc[name] = { total: 0, done: 0 };
    acc[name].total++;
    if (task.status === 'done') acc[name].done++;
    return acc;
  }, {} as Record<string, { total: number, done: number }>);

  const sortedProjects = Object.entries(projectStats)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-6 pb-8">

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
              <TrendingUp className="h-3 w-3" /> Tareas activas
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
            <p className="text-xs text-muted-foreground mt-1">Eficiencia histórica</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Bloqueadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{isLoading ? '—' : metrics.blocked}</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
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
            <p className="text-xs text-muted-foreground mt-1">Prioridad inmediata</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        {/* Main Charts Section */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">Análisis de Operaciones</h2>
          <DashboardMetrics />
        </div>

        {/* Report Summary Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Resumen de Proyectos</h2>
          <Card className="shadow-sm border-none bg-slate-50/50 dark:bg-slate-900/50">
            <CardContent className="p-4">
              <div className="space-y-4">
                {sortedProjects.map(([name, stats]) => (
                  <div key={name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium truncate mr-2">{name}</span>
                      <span className="text-muted-foreground shrink-0">{Math.round((stats.done / stats.total) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${(stats.done / stats.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {stats.done} de {stats.total} tareas completadas
                    </p>
                  </div>
                ))}
                {sortedProjects.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay datos de proyectos disponibles.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
