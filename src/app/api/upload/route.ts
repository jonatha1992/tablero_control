import { NextRequest, NextResponse } from 'next/server';
import { uploadUserAvatar, uploadTaskAttachment } from '@/lib/cloudinary/upload';

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
      url = await uploadUserAvatar(id, file);
    } else if (type === 'attachment') {
      url = await uploadTaskAttachment(id, fileName ?? file.name, file);
    } else {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
