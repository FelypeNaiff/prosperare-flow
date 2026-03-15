'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Um componente que escuta falhas de permissão globais.
 * Seguindo as diretrizes de desenvolvimento, ele apenas loga no console
 * para evitar o travamento da interface pelo overlay do Next.js.
 */
export function FirebaseErrorListener() {
  const [, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      if (process.env.NODE_ENV === 'development') {
        // Apenas logamos no console para evitar o crash total da interface no overlay
        console.warn('[Firestore Security Policy Violation]', {
          path: error.request.path,
          method: error.request.method,
          auth: error.request.auth?.uid || 'Unauthenticated'
        });
      } else {
        console.error('[Firestore Security Policy Violation]', error.request.path, error.request.method);
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // Removido o throw error para evitar o overlay do Next.js em desenvolvimento
  return null;
}
