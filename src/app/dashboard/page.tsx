'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActiveTasksQuery } from '@/hooks/queries/use-active-tasks-query';
import { useAuth } from '@/hooks/auth-context';
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { DashboardUpcomingEvents } from '@/components/dashboard/dashboard-upcoming-events';
import { DashboardMyTasks } from '@/components/dashboard/dashboard-my-tasks';
import { DashboardActiveSprints } from '@/components/dashboard/dashboard-active-sprints';
import { AlertCircle, CheckCircle2, Clock, Zap, TrendingUp } from 'lucide-react';
import { isActionableUpToToday } from '@/lib/tasks/task-status';

export default function DashboardPage() {
  const { data: tasks = [], isLoading } = useActiveTasksQuery();
  const { user } = useAuth();

  const now = new Date();
  const metrics = {
    // A1/A2: excluir backlog y tareas con dueDate futuro (issue #1, #3, #13)
    active: tasks.filter((t) => isActionableUpToToday(t, now)).length,
    done: tasks.filter((t) => t.status === 'done').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    urgent: tasks.filter((t) => t.priority === 'urgent' && isActionableUpToToday(t, now)).length,
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-6 pb-8">

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-30 dark:opacity-10">
            <Clock className="h-12 w-12 text-blue-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tareas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{isLoading ? '—' : metrics.active}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Tareas activas
            </p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-30 dark:opacity-10">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tareas Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{isLoading ? '—' : metrics.done}</div>
            <p className="text-xs text-muted-foreground mt-1">Eficiencia histórica</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-30 dark:opacity-10">
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
          <div className="absolute top-0 right-0 p-4 opacity-30 dark:opacity-10">
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

        <DashboardUpcomingEvents />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <DashboardMyTasks tasks={tasks} userId={user?.id} isLoading={isLoading} />
        <DashboardActiveSprints tasks={tasks} businessId={user?.businessId} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Progreso del equipo</h2>
        <DashboardMetrics />
      </div>
    </div>
  );
}
