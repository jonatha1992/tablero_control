import { describe, it, expect, beforeEach } from 'vitest';
import { useTeamUIStore } from '@/stores/team-ui.store';

// Resetear el store antes de cada test
beforeEach(() => {
  useTeamUIStore.setState({
    searchQuery: '',
    roleFilter: 'all',
    isInviteModalOpen: false,
  });
});

describe('useTeamUIStore — estado inicial', () => {
  it('searchQuery inicia en ""', () => {
    expect(useTeamUIStore.getState().searchQuery).toBe('');
  });

  it('roleFilter inicia en "all"', () => {
    expect(useTeamUIStore.getState().roleFilter).toBe('all');
  });

  it('isInviteModalOpen inicia en false', () => {
    expect(useTeamUIStore.getState().isInviteModalOpen).toBe(false);
  });
});

describe('useTeamUIStore — setSearchQuery', () => {
  it('actualiza searchQuery', () => {
    useTeamUIStore.getState().setSearchQuery('ana');
    expect(useTeamUIStore.getState().searchQuery).toBe('ana');
  });

  it('permite vaciar la query', () => {
    useTeamUIStore.getState().setSearchQuery('foo');
    useTeamUIStore.getState().setSearchQuery('');
    expect(useTeamUIStore.getState().searchQuery).toBe('');
  });
});

describe('useTeamUIStore — setRoleFilter', () => {
  it('actualiza roleFilter a un rol específico', () => {
    useTeamUIStore.getState().setRoleFilter('admin');
    expect(useTeamUIStore.getState().roleFilter).toBe('admin');
  });

  it('puede volver a "all"', () => {
    useTeamUIStore.getState().setRoleFilter('miembro');
    useTeamUIStore.getState().setRoleFilter('all');
    expect(useTeamUIStore.getState().roleFilter).toBe('all');
  });

  it('acepta todos los roles válidos', () => {
    const roles = ['superadmin', 'admin', 'responsable', 'miembro', 'viewer', 'all'] as const;
    for (const role of roles) {
      useTeamUIStore.getState().setRoleFilter(role);
      expect(useTeamUIStore.getState().roleFilter).toBe(role);
    }
  });
});

describe('useTeamUIStore — modal de invitación', () => {
  it('openInviteModal pone isInviteModalOpen en true', () => {
    useTeamUIStore.getState().openInviteModal();
    expect(useTeamUIStore.getState().isInviteModalOpen).toBe(true);
  });

  it('closeInviteModal pone isInviteModalOpen en false', () => {
    useTeamUIStore.getState().openInviteModal();
    useTeamUIStore.getState().closeInviteModal();
    expect(useTeamUIStore.getState().isInviteModalOpen).toBe(false);
  });

  it('openInviteModal es idempotente', () => {
    useTeamUIStore.getState().openInviteModal();
    useTeamUIStore.getState().openInviteModal();
    expect(useTeamUIStore.getState().isInviteModalOpen).toBe(true);
  });

  it('closeInviteModal es idempotente', () => {
    useTeamUIStore.getState().closeInviteModal();
    useTeamUIStore.getState().closeInviteModal();
    expect(useTeamUIStore.getState().isInviteModalOpen).toBe(false);
  });
});

describe('useTeamUIStore — cambios independientes', () => {
  it('cambiar searchQuery no afecta roleFilter ni modal', () => {
    useTeamUIStore.getState().openInviteModal();
    useTeamUIStore.getState().setRoleFilter('admin');
    useTeamUIStore.getState().setSearchQuery('test');
    expect(useTeamUIStore.getState().roleFilter).toBe('admin');
    expect(useTeamUIStore.getState().isInviteModalOpen).toBe(true);
  });
});
