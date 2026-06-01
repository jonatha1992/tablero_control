import { describe, it, expect } from 'vitest';
import { extractedTaskToDraft } from '@/lib/create-task-draft';
import type { ExtractedTask } from '@/lib/groq/extract-tasks';

describe('useConfirmDictatedTasks DTO mapping', () => {
  it('extractedTaskToDraft incluye campos extendidos', () => {
    const task: ExtractedTask = {
      title: 'Informe',
      priority: 'high',
      status: 'todo',
      type: 'task',
      assigneeIds: ['u1'],
      tags: ['finanzas'],
      order: 1,
      projectId: 'p1',
      cycleId: 'c1',
      objectiveId: 'o1',
      checklist: [{ id: '1', text: 'Revisar', done: false }],
      subtasks: ['Borrador'],
      recurrence: { frequency: 'weekly', interval: 1, dayOfWeek: 1 },
    };
    const draft = extractedTaskToDraft(task);
    expect(draft.projectId).toBe('p1');
    expect(draft.cycleId).toBe('c1');
    expect(draft.objectiveId).toBe('o1');
    expect(draft.checklist).toHaveLength(1);
    expect(draft.subtasks).toEqual(['Borrador']);
    expect(draft.recurrence?.frequency).toBe('weekly');
  });
});
