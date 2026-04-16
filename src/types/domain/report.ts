export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface ReportMetrics {
  totalTasks?: number;
  completedTasks?: number;
  overdueTasks?: number;
  blockedTasks?: number;
  velocity?: number;
  teamWorkload?: Record<string, number>;
  [key: string]: unknown;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  content: string;
  metrics: ReportMetrics;
  generatedBy: string;
  date: Date;
  period?: { start: Date; end: Date };
}
