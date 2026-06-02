import type { Task, TaskStatus } from '@/types/domain/task';

/** Estados que no representan trabajo accionable. */
export const NON_PENDING_STATUSES: TaskStatus[] = ['done', 'archived', 'backlog'];

export function isPendingStatus(status: TaskStatus): boolean {
  return !NON_PENDING_STATUSES.includes(status);
}

/**
 * Tarea "pendiente"/activa = trabajo comprometido sin terminar.
 * Excluye `done`/`archived` (terminadas) y `backlog` (ideas, no comprometido).
 */
export function isPending(task: Pick<Task, 'status'>): boolean {
  return isPendingStatus(task.status);
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
  if (!isPendingStatus(task.status)) return false;
  if (!task.dueDate) return true;
  return new Date(task.dueDate).getTime() <= endOfToday(now).getTime();
}

/**
 * Tarea accionable al cierre de un día arbitrario.
 * Útil para métricas históricas: no cuenta backlog ni futuras.
 */
export function isActionableByEndOfDay(
  task: Pick<Task, 'status' | 'dueDate'>,
  day: Date,
): boolean {
  if (!isPendingStatus(task.status)) return false;
  if (!task.dueDate) return true;
  return new Date(task.dueDate).getTime() <= endOfToday(day).getTime();
}

/**
 * Trabajo comprometido para métricas: incluye completadas, pero excluye ideas
 * de backlog, archivadas y tareas con vencimiento futuro.
 */
export function isCommittedByEndOfDay(
  task: Pick<Task, 'status' | 'dueDate'>,
  day: Date,
): boolean {
  if (task.status === 'backlog' || task.status === 'archived') return false;
  if (!task.dueDate) return true;
  return new Date(task.dueDate).getTime() <= endOfToday(day).getTime();
}
