import type {
  BusinessSettings,
  LocationLabelPreset,
  ObjectiveLabelPreset,
  SpaceTerminology,
} from '@/types/domain/business';

/** Resolved labels for the active espacio (UI only). */
export interface SpaceLabels {
  space: string;
  spaces: string;
  board: string;
  boards: string;
  site: string;
  sites: string;
  objective: string;
  objectives: string;
  createSpace: string;
  anotherSpace: string;
  mySpace: string;
  defaultBoardName: string;
}

export const DEFAULT_LABELS: SpaceLabels = {
  space: 'Espacio',
  spaces: 'Espacios',
  board: 'Tablero',
  boards: 'Tableros',
  site: 'Sede',
  sites: 'Sedes',
  objective: 'Épica',
  objectives: 'Épicas',
  createSpace: 'Crear espacio',
  anotherSpace: 'Crear otro espacio',
  mySpace: 'Mi espacio',
  defaultBoardName: 'Principal',
};

/** @deprecated use DEFAULT_LABELS or resolveSpaceLabels */
export const LABELS = DEFAULT_LABELS;

export const LOCATION_LABEL_PRESETS: Record<
  Exclude<LocationLabelPreset, 'custom'>,
  { singular: string; plural: string; description: string }
> = {
  sede: { singular: 'Sede', plural: 'Sedes', description: 'Sucursal u oficina (retail, servicios)' },
  sucursal: { singular: 'Sucursal', plural: 'Sucursales', description: 'Tiendas o puntos de venta' },
  local: { singular: 'Local', plural: 'Locales', description: 'Unidad operativa del espacio' },
  departamento: { singular: 'Departamento', plural: 'Departamentos', description: 'Áreas internas (RRHH, IT, etc.)' },
  sector: { singular: 'Sector', plural: 'Sectores', description: 'División por área de trabajo' },
  area: { singular: 'Área', plural: 'Áreas', description: 'Genérico, equipos o zonas' },
  negocio: { singular: 'Negocio', plural: 'Negocios', description: 'Unidad comercial dentro del espacio' },
  pagina: { singular: 'Página', plural: 'Páginas', description: 'Sitio o página web a controlar' },
};

export const OBJECTIVE_LABEL_PRESETS: Record<
  Exclude<ObjectiveLabelPreset, 'custom'>,
  { singular: string; plural: string; description: string }
> = {
  epica: { singular: 'Épica', plural: 'Épicas', description: 'Funcionalidad grande que agrupa tareas (software)' },
  objetivo: { singular: 'Objetivo', plural: 'Objetivos', description: 'Meta que se completa (genérico)' },
  iniciativa: { singular: 'Iniciativa', plural: 'Iniciativas', description: 'Programa o iniciativa de mediano plazo' },
  causa: { singular: 'Causa', plural: 'Causas', description: 'Expediente o caso que se cierra' },
  campana: { singular: 'Campaña', plural: 'Campañas', description: 'Campaña de marketing o temporada' },
};

export const OBJECTIVE_PRESET_OPTIONS = (
  Object.entries(OBJECTIVE_LABEL_PRESETS) as [Exclude<ObjectiveLabelPreset, 'custom'>, (typeof OBJECTIVE_LABEL_PRESETS)[Exclude<ObjectiveLabelPreset, 'custom'>]][]
).map(([id, meta]) => ({ id, ...meta }));

export const LOCATION_PRESET_OPTIONS = (
  Object.entries(LOCATION_LABEL_PRESETS) as [Exclude<LocationLabelPreset, 'custom'>, (typeof LOCATION_LABEL_PRESETS)[Exclude<LocationLabelPreset, 'custom'>]][]
).map(([id, meta]) => ({ id, ...meta }));

/** Default name when the user does not provide one on signup / create space. */
export function defaultSpaceName(ownerName: string): string {
  return `Espacio de ${ownerName.trim()}`;
}

/** Maps legacy DB names (Negocio/Empresa de …) to Espacio de … in UI. */
export function displaySpaceName(name: string | undefined | null): string {
  if (!name?.trim()) return DEFAULT_LABELS.mySpace;
  return name
    .replace(/^Negocio de /i, 'Espacio de ')
    .replace(/^Empresa de /i, 'Espacio de ');
}

function resolveLocationLabels(terminology?: SpaceTerminology): Pick<SpaceLabels, 'site' | 'sites'> {
  const preset = terminology?.locationPreset ?? 'sede';

  if (preset === 'custom') {
    const singular = terminology?.locationSingular?.trim() || DEFAULT_LABELS.site;
    const plural = terminology?.locationPlural?.trim() || `${singular}s`;
    return { site: singular, sites: plural };
  }

  const meta = LOCATION_LABEL_PRESETS[preset];
  return meta
    ? { site: meta.singular, sites: meta.plural }
    : { site: DEFAULT_LABELS.site, sites: DEFAULT_LABELS.sites };
}

function resolveObjectiveLabels(terminology?: SpaceTerminology): Pick<SpaceLabels, 'objective' | 'objectives'> {
  const preset = terminology?.objectivePreset ?? 'epica';

  if (preset === 'custom') {
    const singular = terminology?.objectiveSingular?.trim() || DEFAULT_LABELS.objective;
    const plural = terminology?.objectivePlural?.trim() || `${singular}s`;
    return { objective: singular, objectives: plural };
  }

  const meta = OBJECTIVE_LABEL_PRESETS[preset];
  return meta
    ? { objective: meta.singular, objectives: meta.plural }
    : { objective: DEFAULT_LABELS.objective, objectives: DEFAULT_LABELS.objectives };
}

/** Merge business terminology settings with defaults. */
export function resolveSpaceLabels(settings?: BusinessSettings | null): SpaceLabels {
  return {
    ...DEFAULT_LABELS,
    ...resolveLocationLabels(settings?.terminology),
    ...resolveObjectiveLabels(settings?.terminology),
  };
}
