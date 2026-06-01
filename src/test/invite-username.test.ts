import { describe, it, expect } from 'vitest';
import { nameToUsernameBase, syntheticEmail, isValidUsername } from '@/lib/auth/invite-username';

describe('invite-username', () => {
  it('convierte nombre con acentos a username base', () => {
    expect(nameToUsernameBase('Juan García')).toBe('juan.garcia');
  });

  it('genera email sintético guest.local', () => {
    expect(syntheticEmail('juan.garcia')).toBe('juan.garcia@guest.local');
  });

  it('valida formato de username', () => {
    expect(isValidUsername('juan.garcia')).toBe(true);
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('Juan')).toBe(false);
  });
});
