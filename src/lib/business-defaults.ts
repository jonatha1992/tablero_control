import type { BusinessSettings } from '@/types/domain/business';

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  maxLocations: 1,
  maxUsers: 5,
  multipleBoards: false,
  theme: 'system',
  language: 'es',
  timezone: 'America/Argentina/Buenos_Aires',
  notifications: { email: true },
  features: { customBranding: false, advancedReports: false, apiAccess: false },
  localeTypes: [],
};

export function hasMultipleBoards(settings?: BusinessSettings | null): boolean {
  return settings?.multipleBoards === true;
}

/** Nav/página Tableros: extra si solo existe el tablero por defecto. */
export function shouldShowBoardsManager(activeCount: number, archivedCount: number): boolean {
  return activeCount > 1 || archivedCount > 0;
}

export function isAttachmentRequiredToFinalize(settings?: BusinessSettings | null): boolean {
  return settings?.requireAttachmentToFinalize === true;
}
