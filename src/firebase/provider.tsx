'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthState {
  user: User | null;
  userData: any | null;
  isUserLoading: boolean;
  isAuthChecking: boolean;
  userError: Error | null;
  userLoaded: boolean;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [state, setState] = useState<UserAuthState>({
    user: null,
    userData: null,
    isUserLoading: true,
    isAuthChecking: true,
    userError: null,
    userLoaded: false,
  });

  // Ref para gerenciar a limpeza do listener do Firestore independente do Auth
  const dbUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!auth || !firestore) return;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        // Limpa listener anterior se existir
        if (dbUnsubscribeRef.current) {
          dbUnsubscribeRef.current();
          dbUnsubscribeRef.current = null;
        }

        if (!firebaseUser) {
          setState({
            user: null,
            userData: null,
            isUserLoading: false,
            isAuthChecking: false,
            userError: null,
            userLoaded: true,
          });
          return;
        }

        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        
        try {
          const uidSnap = await getDoc(userDocRef);
          
          if (uidSnap.exists()) {
            const initialData = { ...uidSnap.data(), id: uidSnap.id };
            
            setState(prev => ({ 
              ...prev, 
              user: firebaseUser, 
              userData: initialData, 
              isUserLoading: false, 
              isAuthChecking: false,
              userLoaded: true 
            }));
            
            // Ativa o listener em tempo real
            dbUnsubscribeRef.current = onSnapshot(userDocRef, (snapshot) => {
              if (snapshot.exists()) {
                const updatedData = { ...snapshot.data(), id: snapshot.id };
                setState(prev => ({ ...prev, userData: updatedData }));
              }
            });
          } else {
            // Provisionamento para o administrador felypenaiff01@gmail.com
            if (firebaseUser.email === "felypenaiff01@gmail.com") {
              const adminData = {
                id: firebaseUser.uid,
                fullName: firebaseUser.displayName || "Felype Naiff",
                email: firebaseUser.email,
                profile: "ADMINISTRADOR",
                role: "ADMINISTRADOR",
                status: "ATIVO",
                createdAt: new Date().toISOString(),
                departmentIds: ["Diretoria", "Administrativo"]
              };
              
              await setDoc(userDocRef, adminData, { merge: true });
              
              setState(prev => ({ 
                ...prev, 
                user: firebaseUser, 
                userData: adminData, 
                isUserLoading: false, 
                isAuthChecking: false, 
                userLoaded: true 
              }));
            } else {
              // Usuário autenticado mas sem perfil de colaborador
              setState(prev => ({ 
                ...prev, 
                user: firebaseUser, 
                userData: null, 
                isUserLoading: false, 
                isAuthChecking: false, 
                userLoaded: true 
              }));
            }
          }
        } catch (error: any) {
          console.error("Erro no fluxo de autenticação/perfil:", error);
          setState(prev => ({ 
            ...prev, 
            user: firebaseUser,
            isUserLoading: false, 
            isAuthChecking: false, 
            userLoaded: true,
            userError: error
          }));
        }
      },
      (error) => {
        setState(prev => ({ ...prev, isUserLoading: false, isAuthChecking: false, userError: error, userLoaded: true }));
      }
    );

    return () => {
      unsubscribeAuth();
      if (dbUnsubscribeRef.current) dbUnsubscribeRef.current();
    };
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      ...state,
    };
  }, [firebaseApp, firestore, auth, state]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  return context;
};

export const useAuth = () => {
  const { auth } = useFirebase();
  if (!auth) throw new Error('Firebase Auth não disponível.');
  return auth;
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  if (!firestore) throw new Error('Firebase Firestore não disponível.');
  return firestore;
};

export const useUser = () => {
  const { user, userData, isUserLoading, isAuthChecking, userError, userLoaded } = useFirebase();
  return { user, userData, isUserLoading, isAuthChecking, userError, userLoaded };
};

/**
 * Hook para memoizar referências e queries do Firestore.
 * Essencial para evitar loops infinitos de re-renderização.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  return useMemo(() => {
    const result = factory() as any;
    if (typeof result === 'object' && result !== null) {
      result.__memo = true;
    }
    return result;
  }, deps);
}
