// Fuente centralizada de versión de la aplicación.
// Se actualiza automáticamente en cada build (scripts/bump-version.ts).

export const APP_VERSION = '0.1.31';
export const BUILD_DATE = '2026-08-08';

export const VERSION_INFO = {
  version: APP_VERSION,
  buildDate: BUILD_DATE,
} as const;
