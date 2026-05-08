import { cloudinary } from './config';

async function fileToDataURI(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = file instanceof File ? file.type : 'application/octet-stream';
  return `data:${mimeType};base64,${base64}`;
}

export async function uploadUserAvatar(userId: string, file: File | Blob): Promise<string> {
  const dataURI = await fileToDataURI(file);
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'tablero_control/avatars',
    public_id: `user_${userId}`,
    overwrite: true,
    transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
  });
  return result.secure_url;
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  [key: string]: unknown;
}

export async function uploadTaskAttachment(
  taskId: string,
  fileName: string,
  file: File | Blob
): Promise<CloudinaryUploadResult> {
  const dataURI = await fileToDataURI(file);
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: `tablero_control/tasks/${taskId}`,
    resource_type: 'auto',
    format: 'webp',
    quality: 'auto',
    fetch_format: 'auto',
    transformation: [{ width: 1000, crop: 'limit' }],
    use_filename: true,
    unique_filename: true,
  });
  return result;
}

export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch {
    // Si no es imagen (PDF, doc, etc.), intentar como raw
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (err) {
      console.error('[cloudinary] deleteCloudinaryAsset failed for', publicId, err);
    }
  }
}


