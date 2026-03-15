'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';

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

// Lista de Administradores Nativa para Provisionamento Inicial
const ADMIN_LIST: Record<string, { name: string, dept: string }> = {
  "pscsucesso@gmail.com": { name: "Administrador Geral", dept: "Diretoria" },
  "felypenaiff01@gmail.com": { name: "Felype Naiff", dept: "Diretoria" },
  "thalyssonluiz@gmail.com": { name: "Thalysson Luiz", dept: "Diretoria" }
};

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
    userLoaded: false, // Inicia como falso até completar o fluxo
  });

  const dbUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!auth || !firestore) return;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        // Limpa ouvintes anteriores
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
            userLoaded: true, // Verificado: nenhum usuário
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
            
            dbUnsubscribeRef.current = onSnapshot(userDocRef, (snapshot) => {
              if (snapshot.exists()) {
                const updatedData = { ...snapshot.data(), id: snapshot.id };
                setState(prev => ({ ...prev, userData: updatedData }));
              }
            });
          } else {
            // Provisionamento de Administradores conforme lista inicial
            const email = firebaseUser.email?.toLowerCase();
            const adminConfig = email ? ADMIN_LIST[email] : null;

            if (adminConfig) {
              const adminData = {
                id: firebaseUser.uid,
                fullName: adminConfig.name,
                email: firebaseUser.email,
                profile: "ADMINISTRADOR",
                role: "ADMINISTRADOR",
                status: "ATIVO",
                createdAt: new Date().toISOString(),
                departmentIds: [adminConfig.dept, "Fiscal", "TI"]
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
              // Usuário autenticado mas sem perfil autorizado
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
          console.error("Firestore error in provider:", error);
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

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T & {__memo?: boolean} {
  return useMemo(() => {
    const result = factory() as any;
    if (typeof result === 'object' && result !== null) {
      result.__memo = true;
    }
    return result;
  }, deps);
}
