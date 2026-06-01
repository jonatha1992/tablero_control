'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDfdKHelBDB1N5sA_nQ5cQMDe93MAU8WjY',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gestordetrabajo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gestordetrabajo',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gestordetrabajo.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '478008899800',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:478008899800:web:a5618898a550dff9f67fad',
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services
const auth = getAuth(app);
auth.languageCode = 'es';

const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// Inicializar Messaging solo si es soportado por el navegador
let messaging: ReturnType<typeof getMessaging> | null = null;

export async function getMessagingInstance() {
  if (typeof window === 'undefined') return null;
  if (messaging) return messaging;
  const supported = await isSupported();
  if (supported) {
    messaging = getMessaging(app);
  }
  return messaging;
}

// Connect to emulators in development (set NEXT_PUBLIC_USE_EMULATOR=true in .env.local)
const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';

if (typeof window !== 'undefined' && useEmulators) {
  // Warn clearly in browser console so the developer knows emulators must be running
  console.warn(
    '[Firebase] Modo emulador activo — asegurate de correr "npm run dev:all" para iniciar los emuladores en localhost:9099. Si ves ERR_CONNECTION_REFUSED, el emulador no está corriendo.',
  );
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export { app, auth, db, functions, storage };
