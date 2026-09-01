import { LOCATION_LABEL_PRESETS } from '@/lib/terminology';

const EXTRA_TYPE_LABELS: Record<string, string> = {
  department: 'Departamento',
  project: 'Proyecto',
  proyecto: 'Proyecto',
  business: 'Negocio',
  warehouse: 'Depósito',
  deposito: 'Depósito',
  oficina: 'Oficina',
};

/** Default slugs when the espacio has no `settings.localeTypes` configured yet. */
export const DEFAULT_LOCALE_TYPES = [
  'local',
  'sucursal',
  'departamento',
  'sector',
  'area',
  'negocio',
  'sede',
  'pagina',
] as const;

export function normalizeLocationTypeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');
}

export function formatLocationTypeLabel(slug: string): string {
  const key = slug.toLowerCase().trim();
  const preset = LOCATION_LABEL_PRESETS[key as keyof typeof LOCATION_LABEL_PRESETS];
  if (preset) return preset.singular;
  if (EXTRA_TYPE_LABELS[key]) return EXTRA_TYPE_LABELS[key];
  if (!key) return '';
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}

/** Merge configured locale types with types already used in existing locations. */
export function resolveLocationTypeOptions(
  configuredTypes: string[] | undefined,
  existingLocationTypes: string[],
): string[] {
  const base = configuredTypes?.length ? configuredTypes : [...DEFAULT_LOCALE_TYPES];
  const merged = new Set(
    [...base, ...existingLocationTypes]
      .map(normalizeLocationTypeSlug)
      .filter(Boolean),
  );
  return Array.from(merged).sort((a, b) =>
    formatLocationTypeLabel(a).localeCompare(formatLocationTypeLabel(b), 'es'),
  );
}

export function defaultLocationType(
  options: string[],
  configuredTypes?: string[],
): string {
  const configured = (configuredTypes ?? []).map(normalizeLocationTypeSlug).filter(Boolean);
  for (const slug of configured) {
    if (options.includes(slug)) return slug;
  }
  for (const preferred of ['local', 'departamento', 'sector', 'sede'] as const) {
    if (options.includes(preferred)) return preferred;
  }
  return options[0] ?? DEFAULT_LOCALE_TYPES[0];
}
