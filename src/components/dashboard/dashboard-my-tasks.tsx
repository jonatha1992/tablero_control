'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/lib/constants/task';
import { isActionableUpToToday } from '@/lib/tasks/task-status';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority } from '@/types/domain/task';

const MAX_TASKS = 6;

const PRIORITY_RANK: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  medium: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  low: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

/** Tareas accionables hoy asignadas al usuario, ordenadas por prioridad y vencimiento. */
export function selectMyTasks(tasks: Task[], userId: string, now: Date): Task[] {
  return tasks
    .filter((t) => t.assigneeIds.includes(userId) && isActionableUpToToday(t, now))
    .sort((a, b) => {
      const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (byPriority !== 0) return byPriority;
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return aDue - bDue;
    });
}

interface DashboardMyTasksProps {
  tasks: Task[];
  userId: string | undefined;
  isLoading: boolean;
}

export function DashboardMyTasks({ tasks, userId, isLoading }: DashboardMyTasksProps) {
  const { myTasks, nowMs } = useMemo(() => {
    const now = new Date();
    return { myTasks: userId ? selectMyTasks(tasks, userId, now) : [], nowMs: now.getTime() };
  }, [tasks, userId]);
  const visible = myTasks.slice(0, MAX_TASKS);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Mis tareas {!isLoading && <span className="text-muted-foreground font-normal">({myTasks.length})</span>}
        </CardTitle>
        <Link href="/dashboard/tareas/agenda" className="text-xs font-medium text-primary hover:underline">
          Ver agenda
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>}
        {!isLoading && visible.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No tenés tareas pendientes para hoy.</p>
        )}
        {visible.map((task) => {
          const overdue = task.dueDate && new Date(task.dueDate).getTime() < nowMs;
          return (
            <div key={task.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/40">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {TASK_STATUS_LABELS[task.status]}
                  {task.dueDate && (
                    <span className={cn(overdue && 'text-red-600')}>
                      {' · '}
                      {new Date(task.dueDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </p>
              </div>
              <Badge variant="outline" className={cn('shrink-0 text-[10px]', PRIORITY_BADGE[task.priority])}>
                {TASK_PRIORITY_LABELS[task.priority]}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
