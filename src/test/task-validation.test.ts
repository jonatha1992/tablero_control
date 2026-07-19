import { describe, expect, it } from 'vitest';
import { checkBulkTaskCompletion, checkTaskCompletion } from '@/lib/task-validation';
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

describe('checkBulkTaskCompletion', () => {
  it('allows bulk completion when every task passes validation', () => {
    const result = checkBulkTaskCompletion([
      buildTask({
        id: 'task-1',
        checklist: [{ id: 'c-1', text: 'Paso 1', done: true }],
        attachments: [{ url: 'https://example.com/a.pdf', name: 'Adjunto' }],
      }),
      buildTask({
        id: 'task-2',
        checklist: [],
        attachments: [{ url: 'https://example.com/b.pdf', name: 'Adjunto 2' }],
      }),
    ]);

    expect(result).toEqual({ ok: true });
  });

  it('blocks bulk completion when any selected task requires attachments', () => {
    const settings: BusinessSettings = {
      requireAttachmentToFinalize: true,
    };

    const result = checkBulkTaskCompletion(
      [
        buildTask({
          id: 'task-1',
          attachments: [],
        }),
        buildTask({
          id: 'task-2',
          attachments: [{ url: 'https://example.com/a.pdf', name: 'Adjunto' }],
        }),
      ],
      settings,
    );

    expect(result).toEqual({
      ok: false,
      reason: 'attachment_required',
      blockedCount: 1,
      totalCount: 2,
    });
  });

  it('blocks bulk completion when any selected task has pending checklist items', () => {
    const result = checkBulkTaskCompletion([
      buildTask({
        id: 'task-1',
        checklist: [{ id: 'c-1', text: 'Pendiente', done: false }],
      }),
      buildTask({
        id: 'task-2',
        checklist: [{ id: 'c-2', text: 'Hecho', done: true }],
      }),
    ]);

    expect(result).toEqual({
      ok: false,
      reason: 'checklist_incomplete',
      blockedCount: 1,
      totalCount: 2,
    });
  });

  it('prioritizes attachment blocks over checklist blocks in bulk mode', () => {
    const settings: BusinessSettings = {
      requireAttachmentToFinalize: true,
    };

    const result = checkBulkTaskCompletion(
      [
        buildTask({
          id: 'task-1',
          attachments: [],
        }),
        buildTask({
          id: 'task-2',
          attachments: [{ url: 'https://example.com/a.pdf', name: 'Adjunto' }],
          checklist: [{ id: 'c-1', text: 'Pendiente', done: false }],
        }),
      ],
      settings,
    );

    expect(result).toEqual({
      ok: false,
      reason: 'attachment_required',
      blockedCount: 1,
      totalCount: 2,
    });
  });
});
