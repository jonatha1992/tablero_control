// ==========================================
// TYPES - Tablero de Control Profesional
// ==========================================

// ==========================================
// ROLES Y PERMISOS - Jerarquía Multi-Tenant
// ==========================================
// superadmin  → TecnoFusión (dueños del sistema)
// admin       → Admin de cada negocio/empresa
// responsable → Responsable de cada local/sector
// miembro     → Persona dentro de un local/sector
// viewer      → Solo lectura (sin interacción)
// ==========================================

export type UserRole = 'superadmin' | 'admin' | 'responsable' | 'miembro' | 'viewer';

// Nivel de acceso para comparaciones
export const ROLE_LEVEL: Record<UserRole, number> = {
  superadmin: 5,
  admin: 4,
  responsable: 3,
  miembro: 2,
  viewer: 1,
};

// --- Negocio/Empresa (multi-tenant) ---
export interface Business {
  id: string;
  name: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  logo?: string;
  adminId: string; // admin del negocio
  locationIds: string[];
  teamIds: string[];
  settings: BusinessSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessSettings {
  maxLocations: number;
  maxUsers: number;
  customDomain?: string;
  features: string[];
  localeTypes: string[]; // tipos de local/sector que el admin define
}

// --- Usuario ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessId?: string; // null para superadmin
  locationId?: string; // null si no está asignado a un local
  avatar?: string;
  phone?: string;
  teamIds: string[];
  preferences: UserPreferences;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  locale: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    agentReports: boolean;
    agentAlerts: boolean;
  };
  dashboardLayout: string[]; // widget ids order
}

// --- Location/Sector (generic entity defined by admin) ---
export interface Location {
  id: string;
  businessId: string;
  name: string;
  type: string; // definido por el admin del negocio
  description?: string;
  address?: string;
  managerId?: string; // responsable del local
  teamIds: string[];
  status: LocationStatus;
  operatingHours?: { open: string; close: string };
  metadata: Record<string, any>;
  taskIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type LocationStatus = 'active' | 'inactive' | 'maintenance' | 'closed' | 'incident';

// --- Equipo ---
export interface Team {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  leadId: string;
  settings: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamSettings {
  defaultTaskPriority: TaskPriority;
  workingHours: { start: string; end: string };
  sprintDuration: number; // days
}

// --- Proyecto ---
export interface Project {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  status: ProjectStatus;
  taskIds: string[];
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived';

// --- Tarea ---
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  
  assigneeIds: string[];
  creatorId: string;
  projectId?: string;
  locationId?: string; // Link task to a location/sector
  parentId?: string;
  
  tags: string[];
  
  startDate?: Date;
  dueDate?: Date;
  completedDate?: Date;
  
  estimatedHours?: number;
  actualHours?: number;
  
  recurrence?: RecurrenceConfig;
  
  subtaskIds: string[];
  attachmentUrls: string[];
  commentCount: number;
  
  position: number; // for ordering in kanban
  
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'feature' | 'bug' | 'improvement' | 'task' | 'documentation';

export interface RecurrenceConfig {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interval: number; // every N frequency
  endDate?: Date;
  count?: number;
}

// --- Subtarea ---
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
  position: number;
}

// --- Comentario ---
export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

// --- Reporte ---
export interface Report {
  id: string;
  type: ReportType;
  title: string;
  content: string; // markdown/html content
  metrics: ReportMetrics;
  generatedBy: string; // agent name
  date: Date;
  period?: { start: Date; end: Date };
}

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface ReportMetrics {
  totalTasks?: number;
  completedTasks?: number;
  overdueTasks?: number;
  blockedTasks?: number;
  velocity?: number;
  teamWorkload?: Record<string, number>;
  [key: string]: any;
}

// --- Alerta ---
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

export type AlertType = 'deadline_approaching' | 'overdue' | 'blocked' | 'bottleneck' | 'workload_imbalance' | 'custom';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// --- Agent Log ---
export interface AgentLog {
  id: string;
  agentName: string;
  action: string;
  input: Record<string, any>;
  output: Record<string, any>;
  status: 'success' | 'error' | 'partial';
  error?: string;
  durationMs?: number;
  timestamp: Date;
}

// --- Agente ---
export interface AgentConfig {
  name: string;
  description: string;
  enabled: boolean;
  schedule?: string; // cron expression
  triggerType: 'manual' | 'scheduled' | 'event';
  settings: Record<string, any>;
}

// --- Eventos de Calendario ---
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  taskId?: string;
  projectId?: string;
  assigneeIds: string[];
  color?: string;
  recurrence?: RecurrenceConfig;
  reminders: ReminderConfig[];
}

export interface ReminderConfig {
  type: 'notification' | 'email';
  minutesBefore: number;
}

// --- Dashboard Widget ---
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
  position: number;
  size: 'small' | 'medium' | 'large' | 'full';
  settings: Record<string, any>;
}

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

// --- API Responses ---
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// --- Agent Input/Output ---
export interface AgentInput {
  context: Record<string, any>;
  prompt?: string;
  options?: Record<string, any>;
}

export interface AgentOutput {
  content: string;
  metadata: Record<string, any>;
  suggestions?: AgentSuggestion[];
  actions?: AgentAction[];
}

export interface AgentSuggestion {
  label: string;
  description: string;
  action: string;
  params: Record<string, any>;
}

export interface AgentAction {
  type: string;
  payload: Record<string, any>;
}

// --- Filter/Query ---
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  projectId?: string[];
  locationId?: string[];
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
}

export interface TaskSort {
  field: keyof Task;
  direction: 'asc' | 'desc';
}
