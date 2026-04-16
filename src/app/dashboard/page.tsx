'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KanbanBoard } from '@/components/tareas/kanban-board';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';

export default function DashboardPage() {
  const { data: tasks = [], isLoading } = useTasksQuery();

  return (
    <div className="flex flex-col h-full overflow-hidden gap-4">
      <div className="shrink-0">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Vista general de tu negocio</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 shrink-0">
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Tareas Activas</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-lg font-bold">
              {isLoading ? '—' : tasks.filter((t) => t.status !== 'done').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Completadas</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-lg font-bold">
              {isLoading ? '—' : tasks.filter((t) => t.status === 'done').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Bloqueadas</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-lg font-bold text-red-500">
              {isLoading ? '—' : tasks.filter((t) => t.status === 'blocked').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Urgentes</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-lg font-bold text-orange-500">
              {isLoading ? '—' : tasks.filter((t) => t.priority === 'urgent').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="py-2 px-4 shrink-0">
          <CardTitle className="text-sm">Kanban Board</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          <div className="p-2 flex-1 overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Cargando...
              </div>
            ) : (
              <KanbanBoard tasks={tasks} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
