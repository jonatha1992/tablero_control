import type { PlanId } from './subscription';

/** Preset keys for how locations are labeled in the UI (Prisma model stays `Location`). */
export type LocationLabelPreset =
  | 'sede'
  | 'sucursal'
  | 'local'
  | 'departamento'
  | 'sector'
  | 'area'
  | 'negocio'
  | 'custom';

export interface SpaceTerminology {
  /** How sub-units (Location) are named in this espacio. Default: sede */
  locationPreset?: LocationLabelPreset;
  /** When locationPreset is `custom` */
  locationSingular?: string;
  locationPlural?: string;
}

export type BusinessStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

export interface BusinessSettings {
  maxLocations?: number;
  maxUsers?: number;
  /** When false (default), one auto-created tablero; project picker hidden in UI. */
  multipleBoards?: boolean;
  /** Si es true, exige que las tareas tengan al menos 1 adjunto para poder pasar a "done" */
  requireAttachmentToFinalize?: boolean;
  /** User-chosen labels for locations (sede, sucursal, departamento, etc.) */
  terminology?: SpaceTerminology;
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
