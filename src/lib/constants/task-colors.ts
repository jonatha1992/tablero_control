import type { TaskStatus, TaskPriority, TaskType } from '@/types/domain/task';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  dot: string;
}

export const STATUS_OPTIONS: SelectOption<TaskStatus>[] = [
  { value: 'backlog',     label: 'Backlog',      dot: 'bg-slate-400' },
  { value: 'todo',        label: 'Por hacer',    dot: 'bg-violet-500' },
  { value: 'in_progress', label: 'En progreso',  dot: 'bg-amber-500' },
  { value: 'in_review',   label: 'En revisión',  dot: 'bg-cyan-500' },
  { value: 'done',        label: 'Finalizado',   dot: 'bg-green-500' },
  { value: 'blocked',     label: 'Bloqueada',    dot: 'bg-red-500' },
  { value: 'archived',    label: 'Archivada',    dot: 'bg-gray-400' },
];

export const PRIORITY_OPTIONS: SelectOption<TaskPriority>[] = [
  { value: 'urgent', label: 'Urgente', dot: 'bg-red-500' },
  { value: 'high',   label: 'Alta',    dot: 'bg-orange-500' },
  { value: 'medium', label: 'Media',   dot: 'bg-blue-500' },
  { value: 'low',    label: 'Baja',    dot: 'bg-slate-400' },
];

export const TYPE_OPTIONS: SelectOption<TaskType>[] = [
  { value: 'task',          label: 'Tarea',         dot: 'bg-blue-500' },
  { value: 'feature',       label: 'Feature',       dot: 'bg-emerald-500' },
  { value: 'bug',           label: 'Bug',           dot: 'bg-red-500' },
  { value: 'improvement',   label: 'Mejora',        dot: 'bg-purple-500' },
  { value: 'documentation', label: 'Documentación', dot: 'bg-slate-400' },
];
