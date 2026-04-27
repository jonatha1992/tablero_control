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
  | 'user.impersonate'
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
  | 'plan_config.update';

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
