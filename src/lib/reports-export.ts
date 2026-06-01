import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task } from '@/types/domain/task';
import type { User } from '@/types/domain/user';
import { downloadCsv } from '@/lib/csv-download';

const STATUS_LABELS: Record<string, string> = {
  done: 'Completadas',
  in_progress: 'En progreso',
  todo: 'Por hacer',
  backlog: 'Backlog',
  blocked: 'Bloqueadas',
  in_review: 'En revisión',
  archived: 'Archivadas',
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const PERIOD_LABELS: Record<'week' | 'month' | 'quarter', string> = {
  week: 'Última semana',
  month: 'Último mes',
  quarter: 'Último trimestre',
};

function periodStart(period: 'week' | 'month' | 'quarter'): Date {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  return subDays(new Date(), days);
}

function filterTasksByPeriod(tasks: Task[], period: 'week' | 'month' | 'quarter'): Task[] {
  const start = periodStart(period).getTime();
  return tasks.filter((t) => {
    const created = new Date(t.createdAt).getTime();
    const updated = new Date(t.updatedAt).getTime();
    return created >= start || updated >= start;
  });
}

function memberNameMap(members: User[]): Map<string, string> {
  return new Map(members.map((m) => [m.id, m.name]));
}

export type ReportExportData = {
  period: 'week' | 'month' | 'quarter';
  tasks: Task[];
  members: User[];
  completionRate: number;
  completedTasks: number;
  totalTasks: number;
  blockedTasks: number;
  urgentTasks: number;
  statusDist: { name: string; value: number }[];
  priorityDist: { name: string; value: number }[];
  teamWorkload: { fullName: string; asignadas: number; completadas: number; rate: number }[];
  weeklyActivity: { semana: string; creadas: number; completadas: number; bloqueadas: number }[];
};

export function buildReportCsvRows(data: ReportExportData): string[][] {
  const rows: string[][] = [];
  const generatedAt = format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es });

  rows.push(['Reporte — Tablero de Control']);
  rows.push(['Generado', generatedAt]);
  rows.push(['Período', PERIOD_LABELS[data.period]]);
  rows.push([]);

  rows.push(['Resumen']);
  rows.push(['Métrica', 'Valor']);
  rows.push(['Tasa de completado', `${data.completionRate}%`]);
  rows.push(['Tareas completadas', String(data.completedTasks)]);
  rows.push(['Total tareas (vista actual)', String(data.totalTasks)]);
  rows.push(['Bloqueadas', String(data.blockedTasks)]);
  rows.push(['Urgentes activas', String(data.urgentTasks)]);
  rows.push([]);

  rows.push(['Actividad semanal (últimas 6 semanas)']);
  rows.push(['Semana', 'Creadas', 'Completadas', 'Bloqueadas']);
  for (const w of data.weeklyActivity) {
    rows.push([w.semana, String(w.creadas), String(w.completadas), String(w.bloqueadas)]);
  }
  rows.push([]);

  rows.push(['Distribución por estado']);
  rows.push(['Estado', 'Cantidad']);
  for (const s of data.statusDist) {
    rows.push([s.name, String(s.value)]);
  }
  rows.push([]);

  rows.push(['Distribución por prioridad']);
  rows.push(['Prioridad', 'Cantidad']);
  for (const p of data.priorityDist) {
    rows.push([p.name, String(p.value)]);
  }
  rows.push([]);

  rows.push(['Carga por miembro']);
  rows.push(['Miembro', 'Asignadas', 'Completadas', 'Tasa %']);
  for (const m of data.teamWorkload) {
    rows.push([m.fullName, String(m.asignadas), String(m.completadas), String(m.rate)]);
  }
  rows.push([]);

  const periodTasks = filterTasksByPeriod(data.tasks, data.period);
  const names = memberNameMap(data.members);

  rows.push(['Detalle de tareas', `(${PERIOD_LABELS[data.period]} — ${periodTasks.length} registros)`]);
  rows.push([
    'ID',
    'Título',
    'Estado',
    'Prioridad',
    'Asignados',
    'Creada',
    'Actualizada',
    'Vencimiento',
  ]);

  for (const t of periodTasks) {
    const assignees = t.assigneeIds.map((id) => names.get(id) ?? id).join('; ');
    rows.push([
      t.id,
      t.title,
      STATUS_LABELS[t.status] ?? t.status,
      PRIORITY_LABELS[t.priority] ?? t.priority,
      assignees,
      format(new Date(t.createdAt), 'yyyy-MM-dd'),
      format(new Date(t.updatedAt), 'yyyy-MM-dd'),
      t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : '',
    ]);
  }

  return rows;
}

export function exportReportCsv(data: ReportExportData): void {
  const rows = buildReportCsvRows(data);
  const stamp = format(new Date(), 'yyyy-MM-dd');
  downloadCsv(`reporte-tareas-${data.period}-${stamp}.csv`, rows);
}
