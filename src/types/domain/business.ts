import type { PlanId } from './subscription';

export type BusinessStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

export interface BusinessSettings {
  maxLocations: number;
  maxUsers: number;
  customDomain?: string;
  features: string[];
  localeTypes: string[];
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
  settings: BusinessSettings;
  featureFlags: Record<string, boolean>;
  subscriptionId?: string;
  mpPayerId?: string;
  trialEndsAt?: Date;
  suspendedAt?: Date;
  suspendedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
