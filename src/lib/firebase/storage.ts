/**
 * Storage helpers — usa Cloudinary vía API route /api/upload
 * El SDK de Cloudinary vive en src/lib/cloudinary/ (solo server-side)
 */

async function uploadViaAPI(formData: FormData): Promise<string> {
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url as string;
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'avatar');
  formData.append('id', userId);
  return uploadViaAPI(formData);
}

export async function uploadTaskAttachment(
  taskId: string,
  fileName: string,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'attachment');
  formData.append('id', taskId);
  formData.append('fileName', fileName);
  return uploadViaAPI(formData);
}

export async function deleteFile(publicId: string): Promise<void> {
  await fetch('/api/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId }),
  });
}
