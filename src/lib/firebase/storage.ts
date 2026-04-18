import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './client';

export async function uploadUserAvatar(userId: string, file: File | Blob): Promise<string> {
  const fileExt = file.type.split('/')[1] || 'jpg';
  const filePath = `avatars/${userId}.${fileExt}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadTaskAttachment(
  taskId: string,
  fileName: string,
  file: File
): Promise<string> {
  const filePath = `tasks/${taskId}/${Date.now()}_${fileName}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteFile(publicUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, publicUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}
