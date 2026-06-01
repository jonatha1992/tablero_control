import type { BusinessInvite } from '@prisma/client';

export type InviteValidationFailure = 'revoked' | 'expired' | 'max_uses';

export function validateInvite(invite: BusinessInvite | null):
  | { valid: true }
  | { valid: false; reason: InviteValidationFailure } {
  if (!invite || !invite.isActive) {
    return { valid: false, reason: 'revoked' };
  }
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return { valid: false, reason: 'expired' };
  }
  if (invite.maxUses > 0 && invite.usedCount >= invite.maxUses) {
    return { valid: false, reason: 'max_uses' };
  }
  return { valid: true };
}

export function inviteErrorStatus(reason: InviteValidationFailure): number {
  return reason === 'revoked' ? 410 : reason === 'expired' ? 410 : 410;
}

export function inviteErrorCode(reason: InviteValidationFailure): string {
  if (reason === 'expired') return 'invite_expired';
  if (reason === 'max_uses') return 'invite_max_uses';
  return 'invite_revoked';
}
