'use client';

import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import type { Task } from '@/types';
// FullCalendar resource types are not cleanly exported; we use plain objects
import { useProjectsQuery } from '@/hooks/queries/use-projects-query';
import { useObjectivesQuery } from '@/hooks/queries/use-objectives-query';
import { useAuth } from '@/hooks/auth-context';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import { cn } from '@/lib/utils';
import { Calendar, User, Target, LayoutGrid } from 'lucide-react';

type GroupBy = 'project' | 'objective' | 'assignee' | 'none';

interface GanttViewProps {
  tasks: Task[];
}

export function GanttView({ tasks }: GanttViewProps) {
  const { user } = useAuth();
  const businessId = user?.businessId ?? '';
  const { data: projects = [] } = useProjectsQuery(businessId);
  const { data: objectives = [] } = useObjectivesQuery(businessId);
  const { openTaskDetail } = useKanbanUIStore();
  const [groupBy, setGroupBy] = useState<GroupBy>('project');

  const tasksWithDates = useMemo(() =>
    tasks.filter((t) => t.startDate || t.dueDate || t.createdAt),
  [tasks]);

  const { resources, events } = useMemo(() => {
    const resMap = new Map<string, { id: string; title: string }>();
    const evs: { id: string; resourceId: string; title: string; start: string; end: string; backgroundColor: string; borderColor: string; textColor: string; extendedProps: { task: Task } }[] = [];

    tasksWithDates.forEach((task) => {
      const start = task.startDate
        ? new Date(task.startDate)
        : task.createdAt
          ? new Date(task.createdAt)
          : new Date();
      const end = task.dueDate
        ? new Date(task.dueDate)
        : new Date(start.getTime() + 24 * 60 * 60 * 1000);

      // Ensure end is after start
      const safeEnd = end <= start ? new Date(start.getTime() + 24 * 60 * 60 * 1000) : end;

      let resourceId = 'unassigned';
      let resourceTitle = 'Sin agrupar';

      if (groupBy === 'project') {
        const p = projects.find((x) => x.id === task.projectId);
        resourceId = task.projectId ?? 'unassigned';
        resourceTitle = p?.name ?? 'Sin tablero';
      } else if (groupBy === 'objective') {
        const o = objectives.find((x) => x.id === task.objectiveId);
        resourceId = task.objectiveId ?? 'unassigned';
        resourceTitle = o?.name ?? 'Sin objetivo';
      } else if (groupBy === 'assignee') {
        const firstAssignee = task.assignees?.[0];
        resourceId = firstAssignee?.id ?? 'unassigned';
        resourceTitle = firstAssignee?.name ?? 'Sin asignar';
      } else {
        resourceId = 'all';
        resourceTitle = 'Todas las tareas';
      }

      if (!resMap.has(resourceId)) {
        resMap.set(resourceId, { id: resourceId, title: resourceTitle });
      }

      const statusColors: Record<string, string> = {
        backlog: '#94a3b8',
        todo: '#8b5cf6',
        in_progress: '#f59e0b',
        in_review: '#06b6d4',
        done: '#22c55e',
        blocked: '#ef4444',
      };

      evs.push({
        id: task.id,
        resourceId,
        title: task.title,
        start: start.toISOString(),
        end: safeEnd.toISOString(),
        backgroundColor: statusColors[task.status] ?? '#3b82f6',
        borderColor: statusColors[task.status] ?? '#3b82f6',
        textColor: '#ffffff',
        extendedProps: { task },
      });
    });

    return {
      resources: Array.from(resMap.values()),
      events: evs,
    };
  }, [tasksWithDates, groupBy, projects, objectives]);

  const groupOptions: { value: GroupBy; label: string; icon: React.ReactNode }[] = [
    { value: 'project', label: 'Tablero', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { value: 'objective', label: 'Objetivo', icon: <Target className="h-3.5 w-3.5" /> },
    { value: 'assignee', label: 'Asignado', icon: <User className="h-3.5 w-3.5" /> },
    { value: 'none', label: 'Ninguno', icon: <Calendar className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b">
        <span className="text-sm text-muted-foreground">Agrupar por:</span>
        {groupOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setGroupBy(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 h-7 px-2.5 text-xs rounded-md border transition-colors',
              groupBy === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-accent'
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 p-2">
        <FullCalendar
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth',
          }}
          resources={resources}
          events={events}
          resourceAreaHeaderContent="Grupos"
          height="100%"
          eventClick={(info) => {
            const task = info.event.extendedProps.task as Task;
            if (task?.id) openTaskDetail(task.id);
          }}
          eventMouseEnter={(info) => {
            info.el.style.cursor = 'pointer';
          }}
          slotMinWidth={40}
          resourceAreaWidth={180}
        />
      </div>
    </div>
  );
}
