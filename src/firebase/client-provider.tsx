'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // A inicialização agora acontece no nível do módulo em init.ts (Singleton)
  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
