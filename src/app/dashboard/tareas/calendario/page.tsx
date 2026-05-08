'use client';

import { useState } from 'react';
import { CalendarView } from '@/components/calendario/calendar-view';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';
import { TaskDetailModal } from '@/components/tareas/task-detail-modal';
import type { Task } from '@/types';

export default function CalendarioPage() {
  const { data: tasks = [], isLoading } = useTasksQuery();
  const updateTask = useUpdateTask();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleEventDrop = (taskId: string, newDate: Date) => {
    updateTask.mutate({ id: taskId, data: { dueDate: newDate } });
  };

  const handleEventClick = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) setSelectedTask(task);
  };

  return (
    <div className="flex flex-col h-full w-full gap-4">
      <div className="flex-1 min-h-[600px] relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Cargando calendario...
          </div>
        ) : (
          <CalendarView
            tasks={tasks}
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
