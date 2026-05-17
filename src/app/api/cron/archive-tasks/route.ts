import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handle } from '@/lib/api/route-handler';

const DEFAULT_ARCHIVE_DAYS = 30;

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${secret}`;
}

export const POST = handle(async (req: NextRequest) => {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const days = DEFAULT_ARCHIVE_DAYS;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await prisma.task.updateMany({
    where: {
      status: 'done',
      completedDate: { lt: cutoff },
    },
    data: { status: 'archived' },
  });

  return NextResponse.json({
    archived: result.count,
    cutoffDate: cutoff.toISOString(),
    days,
  });
});
