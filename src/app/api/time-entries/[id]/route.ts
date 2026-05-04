import { NextRequest, NextResponse } from 'next/server';
import { timeEntryService } from '@/services/time-entry.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;

  const entry = await prisma.timeEntry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: 'time_entry_not_found' }, { status: 404 });
  }

  // Users can delete their own entries; admins/superadmins can delete any
  if (entry.userId !== user.uid && user.role !== 'admin' && user.role !== 'superadmin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  await timeEntryService.delete(id, entry.taskId);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'time_entry.delete' as any,
    targetType: 'TIME_ENTRY',
    targetId: id,
    metadata: { taskId: entry.taskId },
  });

  return NextResponse.json({ ok: true });
});
