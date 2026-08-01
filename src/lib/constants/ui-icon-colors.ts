import type { TaskPriority } from '@/types/domain/task';

/**
 * Domain icon tints for page content (empty states, section headers, Ayuda).
 * Not used in the sidebar — nav stays monochrome.
 * Color on icon only; labels stay muted/foreground.
 */
export const NAV_ICON_COLORS = {
  dashboard: 'text-blue-600 dark:text-blue-400',
  tareas: 'text-sky-600 dark:text-sky-400',
  planificacion: 'text-violet-600 dark:text-violet-400',
  equipo: 'text-emerald-600 dark:text-emerald-400',
  reportes: 'text-orange-600 dark:text-orange-400',
  billing: 'text-amber-600 dark:text-amber-400',
  config: 'text-slate-500 dark:text-slate-400',
  ayuda: 'text-cyan-600 dark:text-cyan-400',
  superadmin: 'text-fuchsia-600 dark:text-fuchsia-400',
} as const;

export type NavIconKey = keyof typeof NAV_ICON_COLORS;

/** Semantic icons in filters, toolbars, empty states. */
export const SEMANTIC_ICON = {
  priority: {
    urgent: 'text-red-500 dark:text-red-400',
    high: 'text-orange-500 dark:text-orange-400',
    medium: 'text-blue-500 dark:text-blue-400',
    low: 'text-slate-400 dark:text-slate-500',
  } satisfies Record<TaskPriority, string>,
  /** Default Flag when no priority selected */
  priorityDefault: 'text-orange-500 dark:text-orange-400',
  location: 'text-teal-600 dark:text-teal-400',
  objective: 'text-violet-600 dark:text-violet-400',
  team: 'text-emerald-600 dark:text-emerald-400',
  danger: 'text-destructive',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-500 dark:text-amber-400',
  info: 'text-sky-600 dark:text-sky-400',
  /** Header: notifications with unread */
  notification: 'text-amber-500 dark:text-amber-400',
  /** Header: PWA install */
  install: 'text-sky-600 dark:text-sky-400',
} as const;

export function priorityIconClass(priority: TaskPriority | '' | null | undefined): string {
  if (!priority) return SEMANTIC_ICON.priorityDefault;
  return SEMANTIC_ICON.priority[priority] ?? SEMANTIC_ICON.priorityDefault;
}
