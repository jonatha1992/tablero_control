import { describe, expect, it } from 'vitest';
import { shouldShowBoardsManager } from '@/lib/business-defaults';

describe('shouldShowBoardsManager', () => {
  it('oculta el extra cuando hay un solo tablero activo', () => {
    expect(shouldShowBoardsManager(1, 0)).toBe(false);
    expect(shouldShowBoardsManager(0, 0)).toBe(false);
  });

  it('muestra gestión con varios activos o alguno archivado', () => {
    expect(shouldShowBoardsManager(2, 0)).toBe(true);
    expect(shouldShowBoardsManager(1, 1)).toBe(true);
    expect(shouldShowBoardsManager(0, 1)).toBe(true);
  });
});
