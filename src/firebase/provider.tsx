
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, collection, query, where, onSnapshot, query as firestoreQuery, doc, setDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

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
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  userData: any | null;
  isUserLoading: boolean;
  isAuthChecking: boolean;
  userError: Error | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  userData: any | null;
  isUserLoading: boolean;
  isAuthChecking: boolean;
  userError: Error | null;
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
  });

  useEffect(() => {
    if (!auth) return;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          const usersRef = collection(firestore, "users");
          const q = firestoreQuery(usersRef, where("email", "==", firebaseUser.email));
          
          const unsubscribeDb = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
              const userData = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id };
              setState(prev => ({ 
                ...prev, 
                user: firebaseUser, 
                userData, 
                isUserLoading: false, 
                isAuthChecking: false 
              }));
            } else {
              // Provisionamento automático para o administrador principal usando o UID como ID do documento
              if (firebaseUser.email === "felypenaiff01@gmail.com") {
                const newUserRef = doc(firestore, "users", firebaseUser.uid);
                const adminData = {
                  id: firebaseUser.uid,
                  fullName: "Felype Naiff",
                  email: firebaseUser.email,
                  profile: "ADMINISTRADOR",
                  status: "ATIVO",
                  createdAt: new Date().toISOString(),
                  departmentId: "Diretoria",
                  departmentIds: ["Diretoria", "Administrativo"]
                };
                
                // Realiza o provisionamento. O snapshot disparará novamente após a criação.
                setDoc(newUserRef, adminData).catch(() => {});
              } else {
                setState(prev => ({ 
                  ...prev, 
                  user: firebaseUser, 
                  userData: null, 
                  isUserLoading: false, 
                  isAuthChecking: false 
                }));
              }
            }
          }, (err) => {
            // Em caso de erro de permissão na consulta de usuário, ainda tentamos manter o estado de login
            setState(prev => ({ ...prev, user: firebaseUser, isUserLoading: false, isAuthChecking: false, userError: err }));
          });

          return () => unsubscribeDb();
        } else {
          setState({ 
            user: null, 
            userData: null, 
            isUserLoading: false, 
            isAuthChecking: false, 
            userError: null 
          });
        }
      },
      (error) => {
        setState(prev => ({ ...prev, isUserLoading: false, isAuthChecking: false, userError: error }));
      }
    );

    return () => unsubscribeAuth();
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: state.user,
      userData: state.userData,
      isUserLoading: state.isUserLoading,
      isAuthChecking: state.isAuthChecking,
      userError: state.userError,
    };
  }, [firebaseApp, firestore, auth, state]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available.');
  }
  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    userData: context.userData,
    isUserLoading: context.isUserLoading,
    isAuthChecking: context.isAuthChecking,
    userError: context.userError,
  };
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useFirebaseApp = () => useFirebase().firebaseApp;
export const useUser = () => {
  const { user, userData, isUserLoading, isAuthChecking, userError } = useFirebase();
  return { user, userData, isUserLoading, isAuthChecking, userError };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  const memoized = useMemo(factory, deps) as any;
  if(typeof memoized === 'object' && memoized !== null) memoized.__memo = true;
  return memoized;
}
