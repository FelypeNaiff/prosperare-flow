'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Singleton Pattern Robusto para Next.js:
 * Armazenamos as instâncias no objeto global para sobreviver ao Hot Module Replacement (HMR).
 * Isso evita o erro "INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)".
 */

const globalForFirebase = globalThis as unknown as {
  firebaseApp: FirebaseApp | undefined;
  firebaseAuth: Auth | undefined;
  firebaseFirestore: Firestore | undefined;
};

export const firebaseApp = 
  globalForFirebase.firebaseApp ?? 
  (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));

export const auth = 
  globalForFirebase.firebaseAuth ?? 
  getAuth(firebaseApp);

export const firestore = 
  globalForFirebase.firebaseFirestore ?? 
  getFirestore(firebaseApp);

if (process.env.NODE_ENV !== 'production') {
  globalForFirebase.firebaseApp = firebaseApp;
  globalForFirebase.firebaseAuth = auth;
  globalForFirebase.firebaseFirestore = firestore;
}

/**
 * Função de conveniência para compatibilidade.
 */
export function initializeFirebase() {
  return { firebaseApp, auth, firestore };
}
