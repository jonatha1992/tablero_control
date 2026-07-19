import { describe, expect, it } from 'vitest';
import { checkTaskCompletion } from '@/lib/task-validation';
import type { BusinessSettings } from '@/types/domain/business';
import type { Task } from '@/types/domain/task';

function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Cerrar tarea',
    description: '',
    status: 'todo',
    priority: 'medium',
    type: 'task',
    assigneeIds: [],
    assignees: [],
    creatorId: 'user-1',
    businessId: 'business-1',
    projectId: 'project-1',
    locationId: undefined,
    cycleId: undefined,
    objectiveId: undefined,
    parentId: undefined,
    tags: [],
    startDate: undefined,
    dueDate: undefined,
    completedDate: undefined,
    estimatedHours: undefined,
    actualHours: undefined,
    recurrence: undefined,
    recurrenceSpawnedAt: undefined,
    recurrenceGroupId: undefined,
    checklist: [],
    deletedAt: undefined,
    deletedBy: undefined,
    subtaskIds: [],
    subtasksCompleted: 0,
    attachmentUrls: [],
    attachments: [],
    commentCount: 0,
    position: 0,
    createdAt: new Date('2026-07-19T12:00:00Z'),
    updatedAt: new Date('2026-07-19T12:00:00Z'),
    ...overrides,
  };
}

describe('checkTaskCompletion', () => {
  it('allows completion when checklist is done and no attachment rule applies', () => {
    const result = checkTaskCompletion(
      buildTask({
        checklist: [
          { id: 'c-1', text: 'Paso 1', done: true },
          { id: 'c-2', text: 'Paso 2', done: true },
        ],
      }),
    );

    expect(result).toEqual({ ok: true });
  });

  it('returns pending and completed checklist items separately', () => {
    const result = checkTaskCompletion(
      buildTask({
        checklist: [
          { id: 'c-1', text: 'Pendiente 1', done: false },
          { id: 'c-2', text: 'Hecho 1', done: true },
          { id: 'c-3', text: 'Pendiente 2', done: false },
        ],
      }),
    );

    expect(result).toEqual({
      ok: false,
      reason: 'checklist_incomplete',
      pending: [
        { id: 'c-1', text: 'Pendiente 1', done: false },
        { id: 'c-3', text: 'Pendiente 2', done: false },
      ],
      doneItems: [{ id: 'c-2', text: 'Hecho 1', done: true }],
    });
  });

  it('blocks completion when attachment is required and missing', () => {
    const settings: BusinessSettings = {
      requireAttachmentToFinalize: true,
    };

    const result = checkTaskCompletion(buildTask(), settings);

    expect(result).toEqual({
      ok: false,
      reason: 'attachment_required',
    });
  });

  it('prioritizes attachment block over checklist confirmation', () => {
    const settings: BusinessSettings = {
      requireAttachmentToFinalize: true,
    };

    const result = checkTaskCompletion(
      buildTask({
        checklist: [{ id: 'c-1', text: 'Pendiente', done: false }],
      }),
      settings,
    );

    expect(result).toEqual({
      ok: false,
      reason: 'attachment_required',
    });
  });
});
