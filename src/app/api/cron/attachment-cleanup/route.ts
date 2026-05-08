import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteCloudinaryAsset } from '@/lib/cloudinary/upload';
import { handle } from '@/lib/api/route-handler';

// Días de retención por plan. -1 = nunca borrar.
const RETENTION_DAYS: Record<string, number> = {
  free: 30,
  basic: 180,
  pro: 365,
  enterprise: -1,
};

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export const GET = handle(async (req: NextRequest) => {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let deleted = 0;
  let errors = 0;

  const plans = Object.entries(RETENTION_DAYS).filter(([, days]) => days !== -1);

  for (const [plan, retentionDays] of plans) {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const businesses = await prisma.business.findMany({
      where: { plan: plan as never },
      select: { id: true },
    });

    if (businesses.length === 0) continue;
    const businessIds = businesses.map((b) => b.id);

    const attachments = await prisma.attachment.findMany({
      where: {
        createdAt: { lt: cutoff },
        task: {
          OR: [
            { project: { businessId: { in: businessIds } } },
            { location: { businessId: { in: businessIds } } },
            { creator: { businessId: { in: businessIds } } },
          ],
        },
      },
      select: { id: true, publicId: true },
    });

    for (const att of attachments) {
      try {
        await deleteCloudinaryAsset(att.publicId);
        await prisma.attachment.delete({ where: { id: att.id } });
        deleted++;
      } catch (err) {
        console.error('[cron/attachment-cleanup] error deleting', att.id, err);
        errors++;
      }
    }
  }

  return NextResponse.json({ ok: true, deleted, errors });
});
