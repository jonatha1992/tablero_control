// Re-exporta todas las capas — compatibilidad total con imports existentes

export * from './domain/task';
export * from './domain/user';
export * from './domain/location';
export * from './domain/business';
export * from './domain/subscription';
export * from './domain/audit-log';
export * from './domain/custom-role';
export * from './domain/project';
export * from './domain/calendar';
export * from './domain/objective';
export * from './domain/cycle';

export * from './dto/task.dto';
export * from './dto/team.dto';
export * from './dto/auth.dto';

export * from './ui/kanban.ui';
export * from './ui/task-filters.ui';
export * from './ui/create-task-draft';

export * from './api/responses';
