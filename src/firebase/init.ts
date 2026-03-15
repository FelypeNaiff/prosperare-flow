'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Variáveis de cache para garantir instâncias únicas (Singleton)
let cachedApp: FirebaseApp | undefined;
let cachedAuth: Auth | undefined;
let cachedFirestore: Firestore | undefined;

/**
 * Inicializa os serviços do Firebase de forma determinística.
 * Evita o erro INTERNAL ASSERTION FAILED (ID: ca9) garantindo instâncias únicas.
 */
export function initializeFirebase() {
  if (!cachedApp) {
    // Em Next.js, verificamos se já existe uma app para evitar re-inicialização no HMR
    cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }

  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
  }

  if (!cachedFirestore) {
    cachedFirestore = getFirestore(cachedApp);
  }

  return {
    firebaseApp: cachedApp,
    auth: cachedAuth,
    firestore: cachedFirestore
  };
}

/**
 * Helper para obter os SDKs a partir de uma instância existente.
 */
export function getSdks(app: FirebaseApp) {
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app)
  };
}
