'use client';

import { Button } from '@/components/ui/button';
import { UserX, Trash2 } from 'lucide-react';
import {
  canRemoveMemberFromBusiness,
  getMemberRemovalBlockMessage,
  getMemberRemovalBlockReason,
} from '@/lib/team/member-removal';
import type { User } from '@/types';

interface MemberRemoveButtonProps {
  member: Pick<User, 'id' | 'isOwner' | 'name'>;
  actorId?: string;
  onRemove?: (id: string) => void;
  variant: 'icon' | 'modal';
  disabled?: boolean;
  onRequestConfirm?: () => void;
}

export function MemberRemoveButton({
  member,
  actorId,
  onRemove,
  variant,
  disabled: externalDisabled,
  onRequestConfirm,
}: MemberRemoveButtonProps) {
  if (!onRemove || !actorId) return null;

  const blockReason = getMemberRemovalBlockReason(member, actorId);
  const blocked = blockReason !== null;
  const blockMessage = blockReason ? getMemberRemovalBlockMessage(blockReason) : undefined;
  const canRemove = canRemoveMemberFromBusiness(member, actorId);
  const disabled = externalDisabled || blocked;

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive disabled:opacity-40"
        onClick={() => canRemove && onRequestConfirm?.()}
        disabled={disabled}
        title={blockMessage ?? 'Eliminar miembro'}
      >
        <UserX className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={() => canRemove && onRequestConfirm?.()}
      disabled={disabled}
      title={blockMessage}
    >
      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
      Eliminar
    </Button>
  );
}
