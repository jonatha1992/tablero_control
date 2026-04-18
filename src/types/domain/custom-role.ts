import type { UserRole } from './user';

export type BaseRoleForCustom = Exclude<UserRole, 'superadmin' | 'admin'>;

export interface PermissionSet {
  tasks: { read: boolean; create: boolean; update: boolean; delete: boolean; assign: boolean; comment: boolean };
  locations: { read: boolean; create: boolean; update: boolean; delete: boolean };
  teams: { read: boolean; create: boolean; update: boolean; delete: boolean; manageMembers: boolean };
  users: { read: boolean; invite: boolean; update: boolean; deactivate: boolean; changeRole: boolean };
  reports: { read: boolean; export: boolean };
  billing: { read: boolean; manage: boolean };
  attachments: { upload: boolean; delete: boolean };
}

export type RoleScopeType = 'business' | 'location' | 'team';

export interface RoleScope {
  type: RoleScopeType;
  targetIds?: string[];
}

export interface CustomRole {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  baseRole: BaseRoleForCustom;
  scope: RoleScope;
  permissions: PermissionSet;
  isActive: boolean;
  isSystem: boolean;
  userCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const EMPTY_PERMISSIONS: PermissionSet = {
  tasks: { read: false, create: false, update: false, delete: false, assign: false, comment: false },
  locations: { read: false, create: false, update: false, delete: false },
  teams: { read: false, create: false, update: false, delete: false, manageMembers: false },
  users: { read: false, invite: false, update: false, deactivate: false, changeRole: false },
  reports: { read: false, export: false },
  billing: { read: false, manage: false },
  attachments: { upload: false, delete: false },
};
