'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { CalendarEventSheet } from '@/components/calendario/calendar-event-sheet';
import { TaskFilterBar } from '@/components/tareas/task-filter-bar';
import { CreateTaskModal } from '@/components/tareas/create-task-modal';
import { useAuth } from '@/hooks/auth-context';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useProjectsQuery } from '@/hooks/queries/use-projects-query';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';
import { useCalendarEventsQuery } from '@/hooks/queries/use-calendar-events-query';
import { TaskDetailModal } from '@/components/tareas/task-detail-modal';
import { isTaskFromActiveEntities } from '@/lib/tasks/active-entity';
import { useTaskFiltersUIStore } from '@/stores/task-filters-ui.store';
import { matchesTaskFilters } from '@/types/ui/task-filters.ui';
import type { Task } from '@/types';
import type { CalendarEvent } from '@/types/domain/calendar';

const CalendarView = dynamic(
  () => import('@/components/calendario/calendar-view').then((m) => m.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Cargando calendario...
      </div>
    ),
  },
);
export default function CalendarioPage() {
  const { user } = useAuth();
  const { data: tasks = [], isPending: isPendingTasks } = useTasksQuery();
  const { data: locations = [], isPending: isPendingLocations } = useLocationsQuery();
  const { data: projects = [], isPending: isPendingProjects } = useProjectsQuery(user?.businessId ?? '');
  const updateTask = useUpdateTask();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<CalendarEvent | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date | undefined>();

  const filters = useTaskFiltersUIStore((s) => s.filters.calendar);
  const setFilter = useTaskFiltersUIStore((s) => s.setFilter);
  const clearFilters = useTaskFiltersUIStore((s) => s.clearFilters);

  const eventsFrom = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); d.setDate(1); return d; }, []);
  const eventsTo   = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() + 2); d.setDate(0); return d; }, []);
  const { data: calendarEvents = [] } = useCalendarEventsQuery(eventsFrom, eventsTo);
  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, { status: project.status }])),
    [projects],
  );
  const locationsById = useMemo(
    () => new Map(locations.map((location) => [location.id, { status: location.status }])),
    [locations],
  );

  const filteredTasks = useMemo(
    () => tasks.filter((task) =>
      matchesTaskFilters(task, filters) &&
      isTaskFromActiveEntities(task, projectsById, locationsById)),
    [tasks, filters, projectsById, locationsById]
  );

  const handleEventDrop = (taskId: string, newDate: Date) => {
    updateTask.mutate({ id: taskId, data: { dueDate: newDate } });
  };

  const handleEventClick = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) setSelectedTask(task);
  };

  const handleDateClick = (date: Date) => {
    setCreateDate(date);
    setCreateOpen(true);
  };

  return (
    <div className="flex flex-col h-full w-full gap-4">
      <TaskFilterBar
        filters={filters}
        onChange={(patch) => setFilter('calendar', patch)}
        onClear={() => clearFilters('calendar')}
        showExcludeDoneToggle
      />
      <div className="flex-1 min-h-[600px] relative">
        {isPendingTasks || isPendingProjects || isPendingLocations ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Cargando calendario...
          </div>
        ) : (
          <CalendarView
            tasks={filteredTasks}
            calendarEvents={calendarEvents}
            onEventDrop={handleEventDrop}
            onEventClick={handleEventClick}
            onCalendarEventClick={(ev) => setSelectedCalendarEvent(ev)}
            onDateClick={handleDateClick}
          />
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
      />

      <CreateTaskModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultDueDate={createDate?.toISOString().split('T')[0]}
      />

      <CalendarEventSheet
        event={selectedCalendarEvent}
        open={!!selectedCalendarEvent}
        onOpenChange={(open) => { if (!open) setSelectedCalendarEvent(null); }}
      />
    </div>
  );
}
