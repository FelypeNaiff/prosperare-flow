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
  if (typeof window === 'undefined') return { firebaseApp: null, auth: null, firestore: null } as any;

  try {
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
  } catch (error) {
    console.error("Critical: Failed to initialize Firebase services:", error);
    // Retorna as instâncias cacheadas se existirem para evitar quebra total
    return {
      firebaseApp: cachedApp!,
      auth: cachedAuth!,
      firestore: cachedFirestore!
    };
  }
}
