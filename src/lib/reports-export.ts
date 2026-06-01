import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task } from '@/types/domain/task';
import type { User } from '@/types/domain/user';

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

function buildResumenRows(data: ReportExportData): (string | number)[][] {
  const generatedAt = format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es });
  return [
    ['Reporte — Tablero de Control'],
    ['Generado', generatedAt],
    ['Período', PERIOD_LABELS[data.period]],
    [],
    ['Métrica', 'Valor'],
    ['Tasa de completado', `${data.completionRate}%`],
    ['Tareas completadas', data.completedTasks],
    ['Total tareas', data.totalTasks],
    ['Bloqueadas', data.blockedTasks],
    ['Urgentes activas', data.urgentTasks],
  ];
}

function buildActividadRows(data: ReportExportData): (string | number)[][] {
  return [
    ['Semana', 'Creadas', 'Completadas', 'Bloqueadas'],
    ...data.weeklyActivity.map((w) => [w.semana, w.creadas, w.completadas, w.bloqueadas]),
  ];
}

function buildEstadoRows(data: ReportExportData): (string | number)[][] {
  return [
    ['Estado', 'Cantidad'],
    ...data.statusDist.map((s) => [s.name, s.value]),
  ];
}

function buildPrioridadRows(data: ReportExportData): (string | number)[][] {
  return [
    ['Prioridad', 'Cantidad'],
    ...data.priorityDist.map((p) => [p.name, p.value]),
  ];
}

function buildEquipoRows(data: ReportExportData): (string | number)[][] {
  return [
    ['Miembro', 'Asignadas', 'Completadas', 'Tasa %'],
    ...data.teamWorkload.map((m) => [m.fullName, m.asignadas, m.completadas, m.rate]),
  ];
}

function buildTareasRows(data: ReportExportData): string[][] {
  const periodTasks = filterTasksByPeriod(data.tasks, data.period);
  const names = memberNameMap(data.members);

  const rows: string[][] = [
    [
      'ID',
      'Título',
      'Estado',
      'Prioridad',
      'Asignados',
      'Creada',
      'Actualizada',
      'Vencimiento',
    ],
  ];

  for (const t of periodTasks) {
    const assignees = t.assigneeIds.map((id) => names.get(id) ?? id).join(', ');
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

/** Exporta un libro Excel (.xlsx) con una hoja por sección del reporte. */
export async function exportReportExcel(data: ReportExportData): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const append = (name: string, rows: (string | number)[][]) => {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    if (name === 'Tareas' && rows.length > 1) {
      sheet['!cols'] = [
        { wch: 38 },
        { wch: 48 },
        { wch: 16 },
        { wch: 12 },
        { wch: 28 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];
    }
    XLSX.utils.book_append_sheet(wb, sheet, name);
  };

  append('Resumen', buildResumenRows(data));
  append('Actividad', buildActividadRows(data));
  append('Por estado', buildEstadoRows(data));
  append('Por prioridad', buildPrioridadRows(data));
  append('Equipo', buildEquipoRows(data));
  append('Tareas', buildTareasRows(data));

  const stamp = format(new Date(), 'yyyy-MM-dd');
  XLSX.writeFile(wb, `reporte-tareas-${data.period}-${stamp}.xlsx`);
}
