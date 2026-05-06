export type UserRole = 'superadmin' | 'admin' | 'responsable' | 'miembro' | 'viewer' | 'pending';

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
  role: UserRole;
  businessId?: string;
  locationId?: string;
  customRoleIds: string[];
  avatar?: string;
  phone?: string;
  teamIds: string[];
  memberships?: UserBusiness[];
  isOwner?: boolean;
  preferences: UserPreferences;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
