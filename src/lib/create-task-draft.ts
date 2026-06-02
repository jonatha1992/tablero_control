import type { ExtractedTask } from '@/lib/groq/extract-tasks';
import type { CreateTaskDraft } from '@/types/ui/create-task-draft';

export function extractedTaskToDraft(task: ExtractedTask): CreateTaskDraft {
  const checklist = [
    ...(task.checklist ?? []),
    ...(task.subtasks ?? []).map((text, index) => ({
      id: `st-${index + 1}`,
      text,
      done: false,
    })),
  ];

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
    checklist: checklist.length ? checklist : undefined,
    recurrence: task.recurrence,
  };
}
