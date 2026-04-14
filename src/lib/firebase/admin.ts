// Firebase Admin configuration
// For server-side operations (API routes, server actions)
// This module is only available in Node.js environment

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

export function getAdminApp(): App {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'gestordetrabajo';
    
    // For local development with service account
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } else {
      // Use Application Default Credentials
      adminApp = initializeApp({
        projectId,
      });
    }
  } else {
    adminApp = getApps()[0];
  }
  
  return adminApp;
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

// Verify Firebase ID token (for API routes)
export async function verifyToken(token: string) {
  const auth = getAdminAuth();
  return auth.verifyIdToken(token);
}
