import type { UserRole } from './user';

export type AuditAction =
  | 'business.create'
  | 'business.update'
  | 'business.suspend'
  | 'business.reactivate'
  | 'business.delete'
  | 'user.create'
  | 'user.update'
  | 'user.role_change'
  | 'user.deactivate'
  | 'user.reactivate'
  | 'user.delete'
  | 'user.impersonate'
  | 'user.upgrade_ghost'
  | 'role.create'
  | 'role.update'
  | 'role.delete'
  | 'role.assign'
  | 'subscription.create'
  | 'subscription.update'
  | 'subscription.cancel'
  | 'subscription.reactivate'
  | 'subscription.checkout_initiated'
  | 'subscription.activated'
  | 'subscription.sync'
  | 'invoice.paid'
  | 'invoice.failed'
  | 'invoice.pending'
  | 'invoice.recovered'
  | 'task.create'
  | 'task.update'
  | 'task.move'
  | 'task.delete'
  | 'attachment.upload'
  | 'attachment.delete'
  | 'plan_config.update'
  | 'invite_link.create'
  | 'invite_link.revoke'
  | 'user.join_via_invite'
  | 'user.switch_business'
  | 'comment.create'
  | 'comment.delete'
  | 'cycle.create'
  | 'cycle.update'
  | 'cycle.delete'
  | 'objective.create'
  | 'objective.update'
  | 'objective.delete'
  | 'project.create'
  | 'project.update'
  | 'project.delete'
  | 'time_entry.create'
  | 'time_entry.delete'
  | 'calendar_event.create'
  | 'calendar_event.update'
  | 'calendar_event.delete';

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole;
  businessId?: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AuditLogEnriched extends AuditLog {
  actor: {
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    avatar: string | null;
    phone: string | null;
    lastLogin: Date | null;
    createdAt: Date;
  };
  business: { name: string } | null;
}
