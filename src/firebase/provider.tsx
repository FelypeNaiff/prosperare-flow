'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { auth as authInstance, firestore as firestoreInstance, firebaseApp as appInstance } from './init';
import { setDocumentNonBlocking } from './non-blocking-updates';

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

// Lista de administradores para provisionamento automático no primeiro acesso
const ADMIN_LIST: Record<string, { name: string, dept: string }> = {
  "pscsucesso@gmail.com": { name: "Administrador Geral", dept: "Diretoria" },
  "felypenaiff01@gmail.com": { name: "Felype Naiff", dept: "Diretoria" },
  "thalyssonluiz@gmail.com": { name: "Thalysson Luiz", dept: "Diretoria" }
};

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UserAuthState>({
    user: null,
    userData: null,
    isUserLoading: true,
    isAuthChecking: true,
    userError: null,
    userLoaded: false,
  });

  const dbUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Monitora o estado da autenticação usando o singleton estável
    const unsubscribeAuth = onAuthStateChanged(
      authInstance,
      async (firebaseUser) => {
        // Limpa ouvintes anteriores do banco de dados ao mudar de usuário
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

        const userDocRef = doc(firestoreInstance, "users", firebaseUser.uid);
        
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
            
            // Inicia ouvinte reativo para o perfil do usuário
            dbUnsubscribeRef.current = onSnapshot(userDocRef, (snapshot) => {
              if (snapshot.exists()) {
                const updatedData = { ...snapshot.data(), id: snapshot.id };
                setState(prev => ({ ...prev, userData: updatedData }));
              }
            }, (err) => {
              console.warn("[FirebaseProvider] Profile listener error:", err.message);
            });
          } else {
            // Provisionamento automático de administradores semente
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
              
              // Uso de mutação não-bloqueante para evitar erros ca9 no banco
              setDocumentNonBlocking(userDocRef, adminData, { merge: true });
              
              setState(prev => ({ 
                ...prev, 
                user: firebaseUser, 
                userData: adminData, 
                isUserLoading: false, 
                isAuthChecking: false, 
                userLoaded: true 
              }));
            } else {
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
          console.error("Firebase Provider Error:", error);
          setState(prev => ({ 
            ...prev, 
            user: firebaseUser,
            isUserLoading: false, 
            isAuthChecking: false, 
            userLoaded: true,
            userError: error
          }));
        }
      }
    );

    return () => {
      unsubscribeAuth();
      if (dbUnsubscribeRef.current) dbUnsubscribeRef.current();
    };
  }, []);

  const contextValue = useMemo((): FirebaseContextState => {
    return {
      areServicesAvailable: true,
      firebaseApp: appInstance,
      firestore: firestoreInstance,
      auth: authInstance,
      ...state,
    };
  }, [state]);

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

export const useAuth = () => authInstance;
export const useFirestore = () => firestoreInstance;
export const useFirebaseApp = () => appInstance;

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
