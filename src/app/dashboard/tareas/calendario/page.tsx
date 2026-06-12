'use client';

import { useMemo, useState } from 'react';
import { CalendarView } from '@/components/calendario/calendar-view';
import { TaskFilterBar } from '@/components/tareas/task-filter-bar';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';
import { TaskDetailModal } from '@/components/tareas/task-detail-modal';
import { useTaskFiltersUIStore } from '@/stores/task-filters-ui.store';
import { matchesTaskFilters } from '@/types/ui/task-filters.ui';
import type { Task } from '@/types';

export default function CalendarioPage() {
  const { data: tasks = [], isLoading } = useTasksQuery();
  const updateTask = useUpdateTask();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const filters = useTaskFiltersUIStore((s) => s.filters.calendar);
  const setFilter = useTaskFiltersUIStore((s) => s.setFilter);
  const clearFilters = useTaskFiltersUIStore((s) => s.clearFilters);

  const filteredTasks = useMemo(
    () => tasks.filter((t) => matchesTaskFilters(t, filters)),
    [tasks, filters]
  );

  const handleEventDrop = (taskId: string, newDate: Date) => {
    updateTask.mutate({ id: taskId, data: { dueDate: newDate } });
  };

  const handleEventClick = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) setSelectedTask(task);
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
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Cargando calendario...
          </div>
        ) : (
          <CalendarView
            tasks={filteredTasks}
            onEventDrop={handleEventDrop}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
      />
    </div>
  );
}
