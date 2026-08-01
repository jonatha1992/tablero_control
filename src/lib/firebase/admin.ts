// Firebase Admin configuration
// For server-side operations (API routes, server actions)
// This module is only available in Node.js environment

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

let adminApp: App;

function loadServiceAccount(): object | null {
  // 1. Try env var (production / Railway)
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envVal) {
    try {
      const parsed = JSON.parse(envVal);
      if (parsed.private_key && parsed.private_key !== '...') return parsed;
    } catch {
      // fall through
    }
  }

  // 2. Try key.json in project root (local development)
  try {
    const keyPath = join(process.cwd(), 'key.json');
    return JSON.parse(readFileSync(keyPath, 'utf-8'));
  } catch {
    return null;
  }
}

function getAdminApp(): App {
  if (process.env.NEXT_PUBLIC_USE_EMULATOR !== 'true') {
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  }

  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'gestordetrabajo';
    const serviceAccount = loadServiceAccount();

    if (serviceAccount) {
      adminApp = initializeApp({
        credential: cert(serviceAccount as Parameters<typeof cert>[0]),
        projectId,
      });
    } else {
      adminApp = initializeApp({ projectId });
    }
  } else {
    adminApp = getApps()[0];
  }

  return adminApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

type DecodedIdToken = Awaited<ReturnType<ReturnType<typeof getAdminAuth>['verifyIdToken']>>;

/** Avoid remote/crypto verify on every API hit during module navigation. */
const TOKEN_CACHE_MAX = 200;
const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;
const verifiedTokenCache = new Map<string, { decoded: DecodedIdToken; expiresAt: number }>();

function pruneVerifiedTokenCache(now: number) {
  for (const [key, entry] of verifiedTokenCache) {
    if (entry.expiresAt <= now) verifiedTokenCache.delete(key);
  }
  while (verifiedTokenCache.size > TOKEN_CACHE_MAX) {
    const oldest = verifiedTokenCache.keys().next().value;
    if (oldest === undefined) break;
    verifiedTokenCache.delete(oldest);
  }
}

// Verify Firebase ID token (for API routes) — short in-memory cache
export async function verifyToken(token: string) {
  const now = Date.now();
  const cached = verifiedTokenCache.get(token);
  if (cached && cached.expiresAt > now) return cached.decoded;

  const decoded = await getAdminAuth().verifyIdToken(token);
  const expMs = typeof decoded.exp === 'number' ? decoded.exp * 1000 - 60_000 : now + TOKEN_CACHE_TTL_MS;
  const expiresAt = Math.min(now + TOKEN_CACHE_TTL_MS, Math.max(now + 5_000, expMs));
  verifiedTokenCache.set(token, { decoded, expiresAt });
  pruneVerifiedTokenCache(now);
  return decoded;
}

let fcmAvailable: boolean | null = null;

export function isFcmAvailable(): boolean {
  if (fcmAvailable !== null) return fcmAvailable;
  const sa = loadServiceAccount();
  fcmAvailable = sa !== null;
  if (!fcmAvailable) {
    console.warn('[fcm] Firebase service account not configured — push notifications disabled');
  }
  return fcmAvailable;
}

export function getAdminMessaging() {
  return getMessaging(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
