import type { AlertSeverity } from '@/types/domain/alert';

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export const ALERT_SEVERITY_COLORS: Record<AlertSeverity, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};
