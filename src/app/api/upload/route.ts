import { NextRequest, NextResponse } from 'next/server';
import { uploadUserAvatar, uploadTaskAttachment, type CloudinaryUploadResult } from '@/lib/cloudinary/upload';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { getEffectivePlanConfig } from '@/lib/mercadopago/plan-config';
import type { PlanId } from '@/types/domain/subscription';

async function getTaskBusinessId(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      project: { select: { businessId: true } },
      location: { select: { businessId: true } },
      creator: { select: { businessId: true } },
    },
  });
  return task?.project?.businessId ?? task?.location?.businessId ?? task?.creator?.businessId ?? null;
}

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;
    const id = formData.get('id') as string | null;
    const fileName = formData.get('fileName') as string | null;

    if (!file || !type || !id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let url: string;

    if (type === 'avatar') {
      // Users can only upload their own avatar (superadmin can upload any)
      if (id !== user.uid && user.role !== 'superadmin') {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const result = await uploadUserAvatar(id, file);
      url = result;
    } else if (type === 'attachment') {
      const businessId = await getTaskBusinessId(id);
      assertResourceBelongsToBusiness(user.data, businessId);

      // Verificar límite de adjuntos del plan
      if (businessId) {
        const business = await prisma.business.findUnique({ where: { id: businessId }, select: { plan: true } });
        if (business) {
          const planConfig = await getEffectivePlanConfig(business.plan as PlanId);
          const limit = planConfig.limits.attachmentsPerMonth;
          if (limit !== -1) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const count = await prisma.attachment.count({
              where: {
                createdAt: { gte: startOfMonth },
                task: { OR: [
                  { project: { businessId } },
                  { location: { businessId } },
                  { creator: { businessId } },
                ]},
              },
            });
            if (count >= limit) {
              return NextResponse.json(
                { error: 'attachments_limit_exceeded', limit, current: count },
                { status: 429 }
              );
            }
          }
        }
      }

      const result: CloudinaryUploadResult = await uploadTaskAttachment(id, fileName ?? file.name, file);
      url = result.secure_url;

      await prisma.attachment.create({
        data: {
          taskId: id,
          url: result.secure_url,
          publicId: result.public_id,
          filename: fileName ?? file.name,
          mimetype: file.type,
          size: file.size,
        }
      });

      await writeAuditLog({
        actorId: user.uid,
        actorRole: user.role,
        businessId: user.businessId,
        action: 'attachment.upload',
        targetType: 'ATTACHMENT',
        targetId: result.public_id,
        metadata: { taskId: id, filename: fileName ?? file.name },
      });
    } else {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});
