import type { Task } from '@/types/domain/task';
import type { CreateTaskDTO } from '@/types/dto/task.dto';

/** Plantilla para duplicar una tarea en otros tableros (sin projectId). */
export function taskToReplicateTemplate(task: Task): CreateTaskDTO {
  const checklist = (task.checklist ?? []).map((item) => ({ ...item, done: false }));
  return {
    title: task.title,
    description: task.description,
    status: 'todo',
    priority: task.priority,
    type: task.type,
    assigneeIds: task.assigneeIds ?? [],
    locationId: task.locationId,
    cycleId: task.cycleId,
    objectiveId: task.objectiveId,
    tags: task.tags ?? [],
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    recurrence: task.recurrence,
    checklist: checklist.length > 0 ? checklist : undefined,
  };
}
