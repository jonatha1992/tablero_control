import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('@/lib/firebase/client', () => ({
  app: {},
  auth: {},
  db: {},
  functions: {},
  useEmulators: true,
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: () => ({}),
  connectAuthEmulator: () => {},
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(function (this: Record<string, unknown>) {
    this.addScope = vi.fn();
    this.setCustomParameters = vi.fn();
  }),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn().mockResolvedValue(null),
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  connectFirestoreEmulator: () => {},
  collection: () => ({}),
  doc: () => ({}),
  getDoc: vi.fn(() => ({ exists: () => false })),
  getDocs: vi.fn(() => ({ docs: [] })),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: () => ({}),
  where: () => ({}),
  orderBy: () => ({}),
  limit: () => ({}),
  writeBatch: () => ({ update: () => {}, delete: () => {}, commit: vi.fn() }),
  serverTimestamp: vi.fn(() => ({ toDate: () => new Date() })),
  Timestamp: {
    now: () => ({ toDate: () => new Date() }),
    fromDate: () => ({ toDate: () => new Date() }),
  },
}));
