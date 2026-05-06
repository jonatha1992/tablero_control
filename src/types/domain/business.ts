import type { PlanId } from './subscription';

export type BusinessStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

export interface BusinessSettings {
  maxLocations?: number;
  maxUsers?: number;
  customDomain?: string;
  theme?: string;
  language?: string;
  timezone?: string;
  notifications?: Record<string, boolean>;
  features?: string[] | Record<string, boolean>;
  localeTypes?: string[];
}

export interface Business {
  id: string;
  name: string;
  plan: PlanId;
  status: BusinessStatus;
  logo?: string;
  adminId: string;
  ownerId: string;
  locationIds: string[];
  teamIds: string[];
  settings: BusinessSettings;
  featureFlags: Record<string, boolean>;
  subscriptionId?: string;
  trialEndsAt?: Date;
  suspendedAt?: Date;
  suspendedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
