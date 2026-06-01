import type { ExtractedTask } from '@/lib/groq/extract-tasks';
import type { CreateTaskDraft } from '@/types/ui/create-task-draft';

export function extractedTaskToDraft(task: ExtractedTask): CreateTaskDraft {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    type: task.type,
    tags: task.tags,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    assigneeIds: task.assigneeIds,
    locationId: task.locationId,
    projectId: task.projectId,
    projectIds: task.projectIds,
    cycleId: task.cycleId,
    objectiveId: task.objectiveId,
    estimatedHours: task.estimatedHours,
    checklist: task.checklist,
    subtasks: task.subtasks,
    recurrence: task.recurrence,
  };
}
