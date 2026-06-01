export type UserRole = 'superadmin' | 'admin' | 'responsable' | 'miembro' | 'viewer' | 'pending';

export type AccountIntent = 'collaborator' | 'owner';

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
  dashboardLayout: string[];
  accountIntent?: AccountIntent;
  joinedViaInviteAt?: string;
}

export interface UserLocationAssignment {
  id: string;
  locationId: string;
  locationName?: string;
  role: UserRole;
  customRoleIds: string[];
}

export interface UserBusiness {
  id: string;
  userId: string;
  businessId: string;
  role: UserRole;
  locationId?: string;
  businessName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  /** Effective role for auth/UI: superadmin when platform operator, else business membership role. */
  role: UserRole;
  /** Role in the active business (never superadmin for team membership). */
  businessRole?: UserRole;
  /** TecnoFusión platform operator (SUPERADMIN_EMAILS / User.role superadmin). */
  isPlatformSuperAdmin?: boolean;
  businessId?: string;
  locationId?: string;
  customRoleIds: string[];
  avatar?: string;
  phone?: string;
  teamIds: string[];
  memberships?: UserBusiness[];
  locationAssignments?: UserLocationAssignment[];
  isOwner?: boolean;
  hasOwnedBusiness?: boolean;
  canCreateOwnBusiness?: boolean;
  preferences: UserPreferences;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
