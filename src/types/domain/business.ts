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
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  logo?: string;
  adminId: string;
  locationIds: string[];
  teamIds: string[];
  settings: BusinessSettings;
  createdAt: Date;
  updatedAt: Date;
}
