'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Singleton Pattern Absoluto:
 * Garante que apenas uma instância de cada serviço exista, mesmo com HMR.
 */
const globalForFirebase = globalThis as unknown as {
  firebaseApp: FirebaseApp | undefined;
  firebaseAuth: Auth | undefined;
  firebaseFirestore: Firestore | undefined;
};

const app = 
  globalForFirebase.firebaseApp ?? 
  (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));

const auth = 
  globalForFirebase.firebaseAuth ?? 
  getAuth(app);

const firestore = 
  globalForFirebase.firebaseFirestore ?? 
  getFirestore(app);

if (process.env.NODE_ENV !== 'production') {
  globalForFirebase.firebaseApp = app;
  globalForFirebase.firebaseAuth = auth;
  globalForFirebase.firebaseFirestore = firestore;
}

export { app as firebaseApp, auth, firestore };

export function initializeFirebase() {
  return { firebaseApp: app, auth, firestore };
}
