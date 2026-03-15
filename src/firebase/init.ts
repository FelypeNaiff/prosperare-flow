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
 * Inicializa os serviços do Firebase garantindo que não haja múltiplas instâncias
 * que possam causar erros internos de asserção (como o ID: ca9).
 */
export function initializeFirebase() {
  if (!cachedApp) {
    if (!getApps().length) {
      try {
        // Tenta inicialização automática do ambiente (Firebase App Hosting)
        cachedApp = initializeApp();
      } catch (e) {
        // Fallback para o objeto de configuração manual
        cachedApp = initializeApp(firebaseConfig);
      }
    } else {
      cachedApp = getApp();
    }
  }

  // Garante que os serviços sejam inicializados apenas uma vez para o app
  if (!cachedAuth) cachedAuth = getAuth(cachedApp);
  if (!cachedFirestore) cachedFirestore = getFirestore(cachedApp);

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
