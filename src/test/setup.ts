import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('@/lib/firebase/client', () => ({
  app: {},
  auth: {},
  db: {},
  storage: {},
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
    // Simulate no user by default
    callback(null);
    return () => {}; // unsubscribe
  }),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
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
  Timestamp: {
    now: () => ({ toDate: () => new Date() }),
    fromDate: () => ({ toDate: () => new Date() }),
  },
}));
