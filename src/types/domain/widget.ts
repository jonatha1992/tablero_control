export type WidgetType =
  | 'kpi_tasks'
  | 'kpi_velocity'
  | 'kpi_team'
  | 'burndown_chart'
  | 'distribution_chart'
  | 'activity_feed'
  | 'active_alerts'
  | 'ai_summary'
  | 'critical_tasks'
  | 'upcoming_deadlines'
  | 'team_workload';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
  position: number;
  size: 'small' | 'medium' | 'large' | 'full';
  settings: Record<string, unknown>;
}
