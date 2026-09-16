'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCyclesQuery } from '@/hooks/queries/use-cycles-query';
import { useProjectsQuery } from '@/hooks/queries/use-projects-query';
import type { Task } from '@/types/domain/task';

interface DashboardActiveSprintsProps {
  tasks: Task[];
  businessId: string | undefined;
}

function daysLeftLabel(endDate: Date | undefined): string | null {
  if (!endDate) return null;
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return 'Vencido';
  if (days === 0) return 'Termina hoy';
  return days === 1 ? 'Queda 1 día' : `Quedan ${days} días`;
}

/** Sprints activos (puede haber uno por proyecto) con su avance. */
export function DashboardActiveSprints({ tasks, businessId }: DashboardActiveSprintsProps) {
  const { data: cycles = [], isPending } = useCyclesQuery(businessId ?? '');
  const { data: projects = [] } = useProjectsQuery(businessId ?? '');

  const sprints = useMemo(() => {
    const projectNames = new Map(projects.map((p) => [p.id, p.name]));
    return cycles
      .filter((c) => c.status === 'active')
      .map((cycle) => {
        const sprintTasks = tasks.filter((t) => t.cycleId === cycle.id && t.status !== 'archived');
        const done = sprintTasks.filter((t) => t.status === 'done').length;
        return {
          cycle,
          projectName: cycle.projectId ? projectNames.get(cycle.projectId) : undefined,
          total: sprintTasks.length,
          done,
          percent: sprintTasks.length ? Math.round((done / sprintTasks.length) * 100) : 0,
        };
      });
  }, [cycles, projects, tasks]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Sprints activos</CardTitle>
        <Link href="/dashboard/planificacion" className="text-xs font-medium text-primary hover:underline">
          Ver sprints
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending && businessId && <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>}
        {!isPending && sprints.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay sprints activos.</p>
        )}
        {sprints.map(({ cycle, projectName, total, done, percent }) => (
          <div key={cycle.id} className="space-y-1.5">
            <div className="flex justify-between gap-2 text-sm">
              <span className="truncate font-medium">
                {cycle.name}
                {projectName && <span className="font-normal text-muted-foreground"> · {projectName}</span>}
              </span>
              <span className="shrink-0 text-muted-foreground">{percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {done} de {total} tareas finalizadas
              {daysLeftLabel(cycle.endDate) && ` · ${daysLeftLabel(cycle.endDate)}`}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
