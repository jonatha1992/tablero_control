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
import { Calendar, User, Target, LayoutGrid, CalendarX2 } from 'lucide-react';

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

  // Only tasks with at least a dueDate (avoids createdAt-spanning bars)
  const tasksWithDates = useMemo(() =>
    tasks.filter((t) => t.dueDate),
  [tasks]);

  const { resources, events } = useMemo(() => {
    const resMap = new Map<string, { id: string; title: string }>();
    const evs: { id: string; resourceId: string; title: string; start: string; end: string; backgroundColor: string; borderColor: string; textColor: string; extendedProps: { task: Task } }[] = [];

    tasksWithDates.forEach((task) => {
      const due = new Date(task.dueDate!);

      let start: Date;
      if (task.startDate) {
        start = new Date(task.startDate);
      } else if (task.estimatedHours) {
        // Place bar so it ends at dueDate
        start = new Date(due.getTime() - task.estimatedHours * 60 * 60 * 1000);
      } else {
        // Default: 1-day bar ending at dueDate
        start = new Date(due.getTime() - 24 * 60 * 60 * 1000);
      }

      // Never let start be after due
      const safeEnd = due <= start ? new Date(start.getTime() + 24 * 60 * 60 * 1000) : due;

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

      const priorityColors: Record<string, string> = {
        urgent: '#ef4444',
        high:   '#f97316',
        medium: '#60a5fa',
        low:    '#94a3b8',
      };

      const color = priorityColors[task.priority] ?? '#60a5fa';

      evs.push({
        id: task.id,
        resourceId,
        title: task.title,
        start: start.toISOString(),
        end: safeEnd.toISOString(),
        backgroundColor: color,
        borderColor: color,
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

  const hasData = tasksWithDates.length > 0;

  const PRIORITY_LEGEND = [
    { label: 'Urgente', color: '#ef4444' },
    { label: 'Alta',    color: '#f97316' },
    { label: 'Media',   color: '#60a5fa' },
    { label: 'Baja',    color: '#94a3b8' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-3 px-4 py-2 border-b flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Agrupar:</span>
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
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-3">
          {PRIORITY_LEGEND.map((p) => (
            <span key={p.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
              {p.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 flex flex-col">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <CalendarX2 className="h-10 w-10 opacity-40" />
            <p className="text-sm font-medium">Sin tareas con fecha de vencimiento</p>
            <p className="text-xs opacity-70 max-w-xs text-center">
              El cronograma muestra tareas que tienen fecha límite asignada. Asigná una fecha a tus tareas desde el Kanban para verlas acá.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 rounded-md border overflow-hidden" style={{ height: '100%' }}>
            <style jsx global>{`
              .fc-timeline .fc-scrollgrid,
              .fc-timeline td, .fc-timeline th {
                border-color: hsl(var(--border)) !important;
              }
              .fc-timeline .fc-col-header-cell,
              .fc-timeline .fc-resource-area-header {
                background: hsl(var(--muted)/0.5) !important;
                color: hsl(var(--muted-foreground));
                font-size: 0.75rem;
              }
              .fc-timeline .fc-datagrid-cell-main {
                font-size: 0.8rem;
                color: hsl(var(--foreground));
              }
              .fc-timeline .fc-timeline-slot {
                background: hsl(var(--card));
              }
              .fc-timeline .fc-timeline-slot.fc-today {
                background: color-mix(in srgb, hsl(var(--primary)) 8%, hsl(var(--card))) !important;
              }
              .fc-timeline-event {
                border-radius: 4px !important;
                font-size: 0.72rem;
                font-weight: 500;
                padding: 0 !important;
                cursor: pointer !important;
                min-height: 24px !important;
                overflow: hidden !important;
              }
              .fc-timeline-event .fc-event-main {
                padding: 0 !important;
                overflow: hidden !important;
              }
              .fc-timeline-event:hover {
                filter: brightness(1.15);
              }
              .fc-timeline-lane {
                min-height: 36px !important;
              }
              .fc-button {
                background: hsl(var(--secondary)) !important;
                color: hsl(var(--secondary-foreground)) !important;
                border: 1px solid hsl(var(--border)) !important;
                border-radius: var(--radius) !important;
                font-size: 0.8rem !important;
                padding: 0.2rem 0.6rem !important;
                box-shadow: none !important;
              }
              .fc-button:hover { background: hsl(var(--muted)) !important; }
              .fc-button-active {
                background: hsl(var(--primary)) !important;
                color: hsl(var(--primary-foreground)) !important;
                border-color: hsl(var(--primary)) !important;
              }
              .fc-toolbar-title {
                font-size: 1rem !important;
                font-weight: 600 !important;
                color: hsl(var(--foreground));
              }
            `}</style>
            <FullCalendar
              plugins={[resourceTimelinePlugin, interactionPlugin]}
              initialView="resourceTimelineMonth"
              locale="es"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth',
              }}
              buttonText={{
                today: 'Hoy',
                day: 'Día',
                week: 'Semana',
                month: 'Mes',
              }}
              resources={resources}
              events={events}
              resourceAreaHeaderContent="Grupos"
              height="100%"
              expandRows
              schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
              eventClick={(info) => {
                const task = info.event.extendedProps.task as Task;
                if (task?.id) openTaskDetail(task.id);
              }}
              eventMouseEnter={(info) => { info.el.style.cursor = 'pointer'; }}
              slotMinWidth={40}
              resourceAreaWidth={200}
              eventMinWidth={60}
              eventContent={(info) => {
                const task = info.event.extendedProps.task as Task;
                const priorityDot: Record<string, string> = {
                  urgent: '#fca5a5',
                  high: '#fed7aa',
                  medium: '#bfdbfe',
                  low: '#e2e8f0',
                };
                const dot = priorityDot[task?.priority] ?? '#bfdbfe';
                return {
                  html: `
                    <div style="display:flex;align-items:center;gap:4px;padding:0 6px;height:100%;overflow:hidden;white-space:nowrap;">
                      <span style="width:6px;height:6px;border-radius:50%;background:${dot};flex-shrink:0;"></span>
                      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:500;"
                            title="${info.event.title.replace(/"/g, '&quot;')}">${info.event.title}</span>
                    </div>
                  `,
                };
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
