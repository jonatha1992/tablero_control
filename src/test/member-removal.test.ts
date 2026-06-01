import { describe, it, expect } from 'vitest';
import {
  canRemoveMemberFromBusiness,
  getMemberRemovalBlockMessage,
  getMemberRemovalBlockReason,
} from '@/lib/team/member-removal';

describe('member-removal', () => {
  const actorId = 'admin-1';

  it('permite eliminar a un miembro normal', () => {
    expect(
      canRemoveMemberFromBusiness({ id: 'mem-1', isOwner: false }, actorId)
    ).toBe(true);
    expect(getMemberRemovalBlockReason({ id: 'mem-1', isOwner: false }, actorId)).toBeNull();
  });

  it('bloquea auto-eliminación', () => {
    expect(canRemoveMemberFromBusiness({ id: actorId, isOwner: false }, actorId)).toBe(false);
    expect(getMemberRemovalBlockReason({ id: actorId, isOwner: false }, actorId)).toBe('self');
    expect(getMemberRemovalBlockMessage('self')).toBe('No podés eliminarte a vos mismo');
  });

  it('bloquea eliminar al propietario', () => {
    expect(canRemoveMemberFromBusiness({ id: 'owner-1', isOwner: true }, actorId)).toBe(false);
    expect(getMemberRemovalBlockReason({ id: 'owner-1', isOwner: true }, actorId)).toBe('owner');
    expect(getMemberRemovalBlockMessage('owner')).toBe(
      'No se puede eliminar al propietario del espacio'
    );
  });
});
