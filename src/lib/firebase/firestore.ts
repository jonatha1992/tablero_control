import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from './client';
import type { PaginatedResponse, TaskSort } from '@/types';

// --- Generic CRUD helpers ---

export async function getById<T = DocumentData>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return { id: docSnap.id, ...docSnap.data() } as T;
}

export async function getAll<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
}

export async function create<T extends Record<string, unknown>>(
  collectionName: string,
  data: T,
  id?: string
): Promise<string> {
  const now = Timestamp.now();
  const docRef = id
    ? doc(db, collectionName, id)
    : doc(collection(db, collectionName));
  
  const payload = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  await setDoc(docRef, payload);
  return docRef.id;
}

export async function update(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function remove(collectionName: string, id: string): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

// --- Pagination ---

export async function getPaginated<T = DocumentData>(
  collectionName: string,
  {
    page = 1,
    pageSize = 20,
    filters = {},
    sort = { field: 'createdAt', direction: 'desc' },
  }: {
    page?: number;
    pageSize?: number;
    filters?: Record<string, unknown>;
    sort?: TaskSort;
  }
): Promise<PaginatedResponse<T>> {
  const collectionRef = collection(db, collectionName);
  const constraints: QueryConstraint[] = [];
  
  // Apply filters
  for (const [field, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        constraints.push(where(field, 'in', value));
      }
    } else if (value !== undefined && value !== null) {
      constraints.push(where(field, '==', value));
    }
  }
  
  // Apply sort
  constraints.push(orderBy(sort.field, sort.direction));
  
  // Apply pagination
  constraints.push(limit(pageSize));
  
  const q = query(collectionRef, ...constraints);
  const snapshot = await getDocs(q);
  
  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  
  // Get total count (separate query without pagination)
  // const countQuery = query(collectionRef, ...constraints.filter(c => !isLimitConstraint(c)));
  // Note: Firestore doesn't support count() with all constraints efficiently
  // For large datasets, consider maintaining a counter
  
  return {
    items,
    total: items.length, // Approximate - would need separate count query
    page,
    pageSize,
    hasMore: items.length === pageSize,
  };
}

function isLimitConstraint(_: QueryConstraint): boolean {
  // This is a simplification - in reality you'd check constraint type
  return false;
}

// --- Timestamp helpers ---

export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export function fromTimestamp(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

// --- Batch operations ---

export async function batchUpdate(
  collectionName: string,
  updates: { id: string; data: Record<string, unknown> }[]
): Promise<void> {
  const batch = writeBatch(db);
  
  for (const { id, data } of updates) {
    const docRef = doc(db, collectionName, id);
    batch.update(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  }
  
  await batch.commit();
}

export async function batchDelete(
  collectionName: string,
  ids: string[]
): Promise<void> {
  const batch = writeBatch(db);
  
  for (const id of ids) {
    const docRef = doc(db, collectionName, id);
    batch.delete(docRef);
  }
  
  await batch.commit();
}
