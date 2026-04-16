export type AlertType =
  | 'deadline_approaching'
  | 'overdue'
  | 'blocked'
  | 'bottleneck'
  | 'workload_imbalance'
  | 'custom';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}
