'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Singleton Pattern Definitivo para Next.js:
 * Armazenamos as instâncias no objeto global para sobreviver ao HMR.
 * Isso evita o erro "INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)".
 */

const globalForFirebase = globalThis as unknown as {
  firebaseApp: FirebaseApp | undefined;
  firebaseAuth: Auth | undefined;
  firebaseFirestore: Firestore | undefined;
};

const app = 
  globalForFirebase.firebaseApp ?? 
  (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));

const authInstance = 
  globalForFirebase.firebaseAuth ?? 
  getAuth(app);

const firestoreInstance = 
  globalForFirebase.firebaseFirestore ?? 
  getFirestore(app);

if (process.env.NODE_ENV !== 'production') {
  globalForFirebase.firebaseApp = app;
  globalForFirebase.firebaseAuth = authInstance;
  globalForFirebase.firebaseFirestore = firestoreInstance;
}

export { app as firebaseApp, authInstance as auth, firestoreInstance as firestore };

/**
 * Função de conveniência para compatibilidade.
 */
export function initializeFirebase() {
  return { firebaseApp: app, auth: authInstance, firestore: firestoreInstance };
}
