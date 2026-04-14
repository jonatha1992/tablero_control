import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from './client';

// --- Storage Helpers ---

export async function uploadFile(
  path: string,
  file: File | Blob,
  metadata?: Record<string, string>
): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    customMetadata: metadata,
  });
  
  return await getDownloadURL(snapshot.ref);
}

export async function uploadTaskAttachment(
  taskId: string,
  fileName: string,
  file: File | Blob
): Promise<string> {
  const path = `tasks/${taskId}/attachments/${fileName}`;
  return uploadFile(path, file);
}

export async function uploadUserAvatar(
  userId: string,
  file: File | Blob
): Promise<string> {
  const path = `users/${userId}/avatar.jpg`;
  return uploadFile(path, file);
}

export async function getFileUrl(path: string): Promise<string> {
  const storageRef = ref(storage, path);
  return await getDownloadURL(storageRef);
}

export async function deleteFile(url: string): Promise<void> {
  const storageRef = ref(storage, url);
  await deleteObject(storageRef);
}

export async function listTaskAttachments(taskId: string): Promise<string[]> {
  const listRef = ref(storage, `tasks/${taskId}/attachments`);
  const result = await listAll(listRef);
  
  const urls = await Promise.all(
    result.items.map(item => getDownloadURL(item))
  );
  
  return urls;
}
