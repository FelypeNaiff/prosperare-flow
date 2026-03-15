'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Singleton Pattern Definitivo para Next.js:
 * Armazenamos as instâncias no objeto global para sobreviver ao HMR (Hot Module Replacement).
 * Isso evita o erro "INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)".
 */

const globalForFirebase = globalThis as unknown as {
  firebaseApp: FirebaseApp | undefined;
  firebaseAuth: Auth | undefined;
  firebaseFirestore: Firestore | undefined;
};

// Inicializa o App apenas se não existir um global
const app = 
  globalForFirebase.firebaseApp ?? 
  (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));

// Inicializa os serviços usando o App garantido
const authInstance = 
  globalForFirebase.firebaseAuth ?? 
  getAuth(app);

const firestoreInstance = 
  globalForFirebase.firebaseFirestore ?? 
  getFirestore(app);

// Em desenvolvimento, persiste no objeto global
if (process.env.NODE_ENV !== 'production') {
  globalForFirebase.firebaseApp = app;
  globalForFirebase.firebaseAuth = authInstance;
  globalForFirebase.firebaseFirestore = firestoreInstance;
}

export { app as firebaseApp, authInstance as auth, firestoreInstance as firestore };

/**
 * Função de conveniência para compatibilidade com o barrel file index.ts
 */
export function initializeFirebase() {
  return { firebaseApp: app, auth: authInstance, firestore: firestoreInstance };
}
