import { prisma } from '@/lib/prisma';
import type { AuditAction } from '@/types/domain/audit-log';
import type { UserRole } from '@/types/domain/user';

interface LogArgs {
  actorId: string;
  actorRole: UserRole | string;
  businessId?: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export async function writeAuditLog(args: LogArgs): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: args.actorId,
      actorRole: args.actorRole,
      businessId: args.businessId,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      metadata: args.metadata as import('@prisma/client').Prisma.InputJsonValue ?? undefined,
      ip: args.ip,
    },
  });
}
