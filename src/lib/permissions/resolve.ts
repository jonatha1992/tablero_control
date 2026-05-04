import type { User, UserRole } from '@/types/domain/user';
import type { CustomRole, PermissionSet } from '@/types/domain/custom-role';

const ALL_TRUE: PermissionSet = {
  tasks: { read: true, create: true, update: true, delete: true, assign: true, comment: true },
  locations: { read: true, create: true, update: true, delete: true },
  teams: { read: true, create: true, update: true, delete: true, manageMembers: true },
  users: { read: true, invite: true, update: true, deactivate: true, changeRole: true },
  reports: { read: true, export: true },
  billing: { read: true, manage: true },
  attachments: { upload: true, delete: true },
};

export const ADMIN_PERMISSIONS: PermissionSet = {
  ...ALL_TRUE,
};

export const RESPONSABLE_PERMISSIONS: PermissionSet = {
  tasks: { read: true, create: true, update: true, delete: true, assign: true, comment: true },
  locations: { read: true, create: false, update: false, delete: false },
  teams: { read: true, create: false, update: false, delete: false, manageMembers: true },
  users: { read: true, invite: true, update: false, deactivate: false, changeRole: false },
  reports: { read: true, export: false },
  billing: { read: false, manage: false },
  attachments: { upload: true, delete: true },
};

export const MIEMBRO_PERMISSIONS: PermissionSet = {
  tasks: { read: true, create: false, update: true, delete: false, assign: false, comment: true },
  locations: { read: true, create: false, update: false, delete: false },
  teams: { read: true, create: false, update: false, delete: false, manageMembers: false },
  users: { read: true, invite: false, update: false, deactivate: false, changeRole: false },
  reports: { read: false, export: false },
  billing: { read: false, manage: false },
  attachments: { upload: true, delete: false },
};

export const VIEWER_PERMISSIONS: PermissionSet = {
  tasks: { read: true, create: false, update: false, delete: false, assign: false, comment: false },
  locations: { read: true, create: false, update: false, delete: false },
  teams: { read: true, create: false, update: false, delete: false, manageMembers: false },
  users: { read: false, invite: false, update: false, deactivate: false, changeRole: false },
  reports: { read: true, export: false },
  billing: { read: false, manage: false },
  attachments: { upload: false, delete: false },
};

export function basePermissions(role: UserRole): PermissionSet {
  switch (role) {
    case 'superadmin':
    case 'admin':
      return ADMIN_PERMISSIONS;
    case 'responsable':
      return RESPONSABLE_PERMISSIONS;
    case 'miembro':
      return MIEMBRO_PERMISSIONS;
    case 'viewer':
      return VIEWER_PERMISSIONS;
    case 'pending':
      return VIEWER_PERMISSIONS; // pending has same base as viewer (minimal)
  }
}

export function resolvePermissions(user: Pick<User, 'role'>, customRole?: CustomRole | null): PermissionSet {
  const base = basePermissions(user.role);
  if (!customRole || !customRole.isActive) return base;
  return intersect(base, customRole.permissions);
}

function intersect(a: PermissionSet, b: PermissionSet): PermissionSet {
  const out = {} as PermissionSet;
  for (const key of Object.keys(a) as Array<keyof PermissionSet>) {
    const merged: Record<string, boolean> = {};
    const aMod = a[key] as Record<string, boolean>;
    const bMod = b[key] as Record<string, boolean>;
    for (const k of Object.keys(aMod)) merged[k] = Boolean(aMod[k] && bMod[k]);
    (out[key] as unknown) = merged;
  }
  return out;
}
