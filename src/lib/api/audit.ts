import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { AuditAction, AuditLog } from '@/types/domain/audit-log';
import type { UserRole } from '@/types/domain/user';

interface LogArgs {
  actorId: string;
  actorRole: UserRole;
  businessId?: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export async function writeAuditLog(args: LogArgs): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection('auditLogs').doc();
  const doc = {
    actorId: args.actorId,
    actorRole: args.actorRole,
    businessId: args.businessId,
    action: args.action,
    targetType: args.targetType,
    targetId: args.targetId,
    metadata: args.metadata,
    ip: args.ip,
    userAgent: args.userAgent,
    createdAt: Timestamp.now(),
  };
  await ref.set(doc);
}
