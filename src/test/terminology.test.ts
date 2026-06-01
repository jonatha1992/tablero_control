import { describe, it, expect } from 'vitest';
import {
  defaultSpaceName,
  displaySpaceName,
  LABELS,
  resolveSpaceLabels,
  LOCATION_LABEL_PRESETS,
} from '@/lib/terminology';
import type { BusinessSettings } from '@/types/domain/business';

describe('terminology', () => {
  it('defaultSpaceName usa Espacio de', () => {
    expect(defaultSpaceName('Ana')).toBe('Espacio de Ana');
  });

  it('displaySpaceName normaliza nombres legacy', () => {
    expect(displaySpaceName('Negocio de David')).toBe('Espacio de David');
    expect(displaySpaceName('Empresa de TecnoFusión')).toBe('Espacio de TecnoFusión');
    expect(displaySpaceName('Mi cadena')).toBe('Mi cadena');
    expect(displaySpaceName('')).toBe(LABELS.mySpace);
  });

  it('resolveSpaceLabels usa sede por defecto', () => {
    const labels = resolveSpaceLabels(undefined);
    expect(labels.site).toBe('Sede');
    expect(labels.sites).toBe('Sedes');
  });

  it('resolveSpaceLabels respeta preset departamento', () => {
    const settings: BusinessSettings = {
      terminology: { locationPreset: 'departamento' },
    };
    expect(resolveSpaceLabels(settings).sites).toBe('Departamentos');
  });

  it('resolveSpaceLabels respeta custom', () => {
    const settings: BusinessSettings = {
      terminology: {
        locationPreset: 'custom',
        locationSingular: 'Casa matriz',
        locationPlural: 'Casas matriz',
      },
    };
    const labels = resolveSpaceLabels(settings);
    expect(labels.site).toBe('Casa matriz');
    expect(labels.sites).toBe('Casas matriz');
  });

  it('LOCATION_LABEL_PRESETS incluye sede y sector', () => {
    expect(LOCATION_LABEL_PRESETS.sede.plural).toBe('Sedes');
    expect(LOCATION_LABEL_PRESETS.sector.plural).toBe('Sectores');
  });
});
