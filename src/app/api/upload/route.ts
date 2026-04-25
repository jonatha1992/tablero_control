import { NextRequest, NextResponse } from 'next/server';
import { uploadUserAvatar, uploadTaskAttachment, type CloudinaryUploadResult } from '@/lib/cloudinary/upload';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';

export async function POST(request: NextRequest) {
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
      const result = await uploadUserAvatar(id, file);
      url = result;
    } else if (type === 'attachment') {
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
}
