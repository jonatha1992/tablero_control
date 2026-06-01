import type { User } from '@/types/domain/user';

export type MemberRemovalBlockReason = 'self' | 'owner';

export function getMemberRemovalBlockReason(
  member: Pick<User, 'id' | 'isOwner'>,
  actorId: string
): MemberRemovalBlockReason | null {
  if (member.id === actorId) return 'self';
  if (member.isOwner) return 'owner';
  return null;
}

export function canRemoveMemberFromBusiness(
  member: Pick<User, 'id' | 'isOwner'>,
  actorId: string
): boolean {
  return getMemberRemovalBlockReason(member, actorId) === null;
}

export function getMemberRemovalBlockMessage(reason: MemberRemovalBlockReason): string {
  switch (reason) {
    case 'self':
      return 'No podés eliminarte a vos mismo';
    case 'owner':
      return 'No se puede eliminar al propietario del espacio';
  }
}
