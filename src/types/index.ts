// Re-exporta todas las capas — compatibilidad total con imports existentes

export * from './domain/task';
export * from './domain/user';
export * from './domain/team';
export * from './domain/location';
export * from './domain/business';
export * from './domain/subscription';
export * from './domain/audit-log';
export * from './domain/custom-role';
export * from './domain/project';
export * from './domain/sprint';
export * from './domain/report';
export * from './domain/alert';
export * from './domain/calendar';
export * from './domain/agent';
export * from './domain/widget';

export * from './dto/task.dto';
export * from './dto/team.dto';
export * from './dto/auth.dto';

export * from './ui/kanban.ui';
export * from './ui/forms.ui';

export * from './api/responses';

// Constante de compatibilidad (se mantiene aquí por si algo la importa de @/types)
export const ROLE_LEVEL: Record<import('./domain/user').UserRole, number> = {
  superadmin: 5,
  admin: 4,
  responsable: 3,
  miembro: 2,
  viewer: 1,
};
