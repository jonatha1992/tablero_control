import { NextRequest, NextResponse } from 'next/server';
import { uploadUserAvatar, uploadTaskAttachment } from '@/lib/cloudinary/upload';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
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
      const result = await uploadTaskAttachment(id, fileName ?? file.name, file);
      url = result.secure_url;
      
      // Guardamos en la base de datos
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
    } else {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
