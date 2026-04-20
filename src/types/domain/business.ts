import type { PlanId } from './subscription';

export type BusinessStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

export interface BusinessSettings {
  maxLocations: number;
  maxUsers: number;
  customDomain?: string;
  features: string[];
  localeTypes: string[];
}

export type EntityType = 'negocio' | 'empresa' | 'area';

export interface TaskDefaults {
  status: string;
  priority: string;
  type: string;
  // Estos campos permitirán filtrar qué opciones se muestran en los selectores por negocio
  availableStatuses?: string[];
  availablePriorities?: string[];
  availableTypes?: string[];
}

export interface Business {
  id: string;
  name: string;
  plan: PlanId;
  status: BusinessStatus;
  logo?: string;
  adminId: string;
  locationIds: string[];
  teamIds: string[];
  entityType: EntityType;
  settings: BusinessSettings;
  taskDefaults: TaskDefaults;
  featureFlags: Record<string, boolean>;
  subscriptionId?: string;
  mpPayerId?: string;
  trialEndsAt?: Date;
  suspendedAt?: Date;
  suspendedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
