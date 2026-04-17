export type UserRole = 'superadmin' | 'admin' | 'responsable' | 'miembro' | 'viewer';

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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessId?: string;
  locationId?: string;
  customRoleId?: string;
  avatar?: string;
  phone?: string;
  teamIds: string[];
  preferences: UserPreferences;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
