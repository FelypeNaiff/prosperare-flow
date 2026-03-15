'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Um componente que escuta falhas de permissão globais.
 * Em desenvolvimento, ele dispara um erro capturável pelo Next.js.
 * Em produção, ele apenas registra no console para evitar o crash total da interface.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      if (process.env.NODE_ENV === 'development') {
        setError(error);
      } else {
        console.error('[Firestore Security Policy Violation]', error.request.path, error.request.method);
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // On re-render in dev mode, if an error exists in state, throw it.
  if (error && process.env.NODE_ENV === 'development') {
    throw error;
  }

  return null;
}
