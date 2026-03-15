'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Singleton Pattern: Garante que o Firebase seja inicializado apenas uma vez.
 * Essencial para evitar o erro INTERNAL ASSERTION FAILED (ID: ca9) no Next.js.
 */
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app as firebaseApp, auth, firestore };

/**
 * Função de conveniência para manter compatibilidade com código existente,
 * mas retornando sempre as mesmas instâncias estáveis.
 */
export function initializeFirebase() {
  return { firebaseApp: app, auth, firestore };
}
