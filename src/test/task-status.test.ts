import { describe, expect, it } from 'vitest';
import {
  isActionableByEndOfDay,
  isActionableUpToToday,
  isCommittedByEndOfDay,
  isPending,
} from '@/lib/tasks/task-status';
import type { TaskStatus } from '@/types/domain/task';

const task = (status: TaskStatus, dueDate?: Date) => ({ status, dueDate });

describe('task status helpers', () => {
  it('treats backlog, done and archived as non-pending', () => {
    expect(isPending(task('todo'))).toBe(true);
    expect(isPending(task('in_progress'))).toBe(true);
    expect(isPending(task('blocked'))).toBe(true);
    expect(isPending(task('backlog'))).toBe(false);
    expect(isPending(task('done'))).toBe(false);
    expect(isPending(task('archived'))).toBe(false);
  });

  it('counts only pending work due up to today as actionable', () => {
    const now = new Date('2026-06-02T10:00:00');

    expect(isActionableUpToToday(task('todo'), now)).toBe(true);
    expect(isActionableUpToToday(task('todo', new Date('2026-06-02T23:59:59')), now)).toBe(true);
    expect(isActionableUpToToday(task('todo', new Date('2026-06-03T00:00:00')), now)).toBe(false);
    expect(isActionableUpToToday(task('backlog', new Date('2026-06-02T12:00:00')), now)).toBe(false);
  });

  it('keeps completed committed work in burndown totals but not actionable counts', () => {
    const day = new Date('2026-06-02T10:00:00');
    const doneToday = task('done', new Date('2026-06-02T12:00:00'));

    expect(isCommittedByEndOfDay(doneToday, day)).toBe(true);
    expect(isActionableByEndOfDay(doneToday, day)).toBe(false);
    expect(isCommittedByEndOfDay(task('todo', new Date('2026-06-03T00:00:00')), day)).toBe(false);
  });
});
