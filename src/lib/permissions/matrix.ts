import type { User, UserRole } from '@/types/domain/user';
import type { PermissionSet } from '@/types/domain/custom-role';

export type Action =
  // plataforma
  | 'platform.businesses.list'
  | 'platform.businesses.create'
  | 'platform.businesses.suspend'
  | 'platform.businesses.reactivate'
  | 'platform.metrics.read'
  | 'platform.users.read'
  | 'platform.plans.manage'
  | 'platform.subscriptions.force'
  | 'platform.audit.read'
  | 'platform.impersonate'
  // business
  | 'business.settings.update'
  | 'business.subscription.manage'
  | 'business.billing.read'
  | 'business.users.crud'
  | 'business.users.changeRole'
  | 'business.roles.crud'
  | 'business.locations.crud'
  | 'business.teams.crud'
  | 'business.reports.read'
  | 'business.reports.export'
  // tareas
  | 'task.read'
  | 'task.create'
  | 'task.update.any'
  | 'task.update.assigned'
  | 'task.delete'
  | 'task.assign'
  | 'task.comment'
  // adjuntos
  | 'attachment.upload'
  | 'attachment.delete';

type RoleMatrix = Record<UserRole, ReadonlySet<Action>>;

const SUPERADMIN: Action[] = [
  'platform.businesses.list',
  'platform.businesses.create',
  'platform.businesses.suspend',
  'platform.businesses.reactivate',
  'platform.metrics.read',
  'platform.users.read',
  'platform.plans.manage',
  'platform.subscriptions.force',
  'platform.audit.read',
  'platform.impersonate',
];

const ADMIN: Action[] = [
  'business.settings.update',
  'business.subscription.manage',
  'business.billing.read',
  'business.users.crud',
  'business.users.changeRole',
  'business.roles.crud',
  'business.locations.crud',
  'business.teams.crud',
  'business.reports.read',
  'business.reports.export',
  'task.read',
  'task.create',
  'task.update.any',
  'task.delete',
  'task.assign',
  'task.comment',
  'attachment.upload',
  'attachment.delete',
];

const RESPONSABLE: Action[] = [
  'business.reports.read',
  'task.read',
  'task.create',
  'task.update.any',
  'task.update.assigned',
  'task.delete',
  'task.assign',
  'task.comment',
  'attachment.upload',
  'attachment.delete',
];

const MIEMBRO: Action[] = [
  'task.read',
  'task.update.assigned',
  'task.comment',
  'attachment.upload',
];

const VIEWER: Action[] = ['task.read', 'business.reports.read'];

const ROLE_MATRIX: RoleMatrix = {
  superadmin: new Set(SUPERADMIN),
  admin: new Set(ADMIN),
  responsable: new Set(RESPONSABLE),
  miembro: new Set(MIEMBRO),
  viewer: new Set(VIEWER),
};

interface ResourceCtx {
  businessId?: string;
  assigneeIds?: string[];
  creatorId?: string;
}

export function can(
  user: Pick<User, 'id' | 'role' | 'businessId'> | null | undefined,
  action: Action,
  resource?: ResourceCtx,
  effectivePermissions?: PermissionSet
): boolean {
  if (!user) return false;
  const { role, businessId, id: userId } = user;

  // superadmin: todo permiso de plataforma; lectura global; escritura sobre cualquier business solo si acción lo permite
  if (role === 'superadmin') {
    if (action === 'platform.impersonate') return true;
    if (ROLE_MATRIX.superadmin.has(action)) return true;
    // superadmin puede leer, no escribir en datos de clientes salvo suspender (audit)
    if (action === 'task.read' || action === 'business.reports.read') return true;
    return false;
  }

  // tenant isolation: cualquier acción sobre recurso con businessId requiere match
  if (resource?.businessId && businessId && resource.businessId !== businessId) {
    return false;
  }

  // acciones de plataforma solo superadmin
  if (action.startsWith('platform.')) return false;

  // task.update.assigned: solo si el user está en assigneeIds
  if (action === 'task.update.assigned') {
    if (!resource?.assigneeIds?.includes(userId)) {
      // puede caer al permiso .any del rol
      if (ROLE_MATRIX[role].has('task.update.any')) return checkGranular(action, role, effectivePermissions);
      return false;
    }
    return checkGranular(action, role, effectivePermissions);
  }

  if (!ROLE_MATRIX[role].has(action)) return false;
  return checkGranular(action, role, effectivePermissions);
}

function checkGranular(action: Action, role: UserRole, perms?: PermissionSet): boolean {
  if (!perms || role === 'admin' || role === 'superadmin') return true;
  // Overrides de customRole. Si el rol base lo permite pero el custom lo deshabilita → false.
  const map: Partial<Record<Action, boolean>> = {
    'task.read': perms.tasks.read,
    'task.create': perms.tasks.create,
    'task.update.any': perms.tasks.update,
    'task.update.assigned': perms.tasks.update,
    'task.delete': perms.tasks.delete,
    'task.assign': perms.tasks.assign,
    'task.comment': perms.tasks.comment,
    'attachment.upload': perms.attachments.upload,
    'attachment.delete': perms.attachments.delete,
    'business.reports.read': perms.reports.read,
    'business.reports.export': perms.reports.export,
  };
  return map[action] ?? true;
}


