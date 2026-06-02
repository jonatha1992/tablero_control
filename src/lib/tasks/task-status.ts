import type { Task, TaskStatus } from '@/types/domain/task';

/** Estados que NO representan trabajo en curso. */
export const DONE_STATUSES: TaskStatus[] = ['done', 'archived'];

/**
 * Tarea "pendiente"/activa = trabajo comprometido sin terminar.
 * Excluye `done`/`archived` (terminadas) y `backlog` (ideas, no comprometido).
 * Ver docs/decisions y feedback #13.
 */
export function isPending(task: Pick<Task, 'status'>): boolean {
  return !DONE_STATUSES.includes(task.status) && task.status !== 'backlog';
}

/** Fin del día de `now` (23:59:59.999). */
export function endOfToday(now: Date): Date {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(start.getTime() + 86_400_000 - 1);
}

/**
 * Tarea accionable hasta hoy: pendiente y (sin fecha, vencida, o vence hoy).
 * Excluye futuras. Ver feedback #1/#3.
 */
export function isActionableUpToToday(
  task: Pick<Task, 'status' | 'dueDate'>,
  now: Date,
): boolean {
  if (!isPending(task)) return false;
  if (!task.dueDate) return true;
  return new Date(task.dueDate).getTime() <= endOfToday(now).getTime();
}

/** Tarea con fecha futura (después de hoy). */
export function isFuture(task: Pick<Task, 'dueDate'>, now: Date): boolean {
  if (!task.dueDate) return false;
  return new Date(task.dueDate).getTime() > endOfToday(now).getTime();
}
